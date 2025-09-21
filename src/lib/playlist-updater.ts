import { SNAPSHOT_KEY, DATA_KEY, HTML_KEY } from '../const';
import * as spotify from './spotify-api';
import {
  formatDuration,
  fetchDisplayName,
  getClodflareKvKey,
  hasTrack,
  processItem,
  purgeCloudflareCache,
  toTrack,
  updateDuplicates,
} from './utils';
import { generateHtml } from './html-generator';
import { DuplicateData, Env, MasterData } from '../types';

export async function updatePlaylistData(env: Env): Promise<void> {
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const accessToken = await spotify.getAccessToken(credentials);

  const metadata = await spotify.getPlaylistMetadata(accessToken, env.SPOTIFY_PLAYLIST_ID);
  const snapshotChanged = await compareSnapshots(metadata.snapshot_id, env);
  if (!snapshotChanged && !env.IS_DEV) {
    console.log('Snapshot unchanged, skipping processing');
    return;
  }

  console.log('Snapshot changed, starting data processing');

  console.log('Starting to fetch playlist data...');
  const trackPages = await spotify.fetchAllPages(accessToken, env.SPOTIFY_PLAYLIST_ID, metadata.tracks.total);
  console.log('Finished fetching playlist data');
  const data: MasterData = {};
  const dupes: DuplicateData = {};

  for (const page of trackPages) {
    for (const item of page.items) {
      const userId = item.added_by.id;
      if (!data[userId]) {
        // Use display_name if available, otherwise fetch from API
        const displayName = item.added_by.display_name || (await fetchDisplayName(accessToken, userId));
        data[userId] = {
          displayName,
          songCount: 0,
          totalLenghtMs: 0,
          tracks: [],
        };
      }
      if (!hasTrack(item)) continue;
      const track = toTrack(item);
      processItem(data[userId], track);
      updateDuplicates(dupes, track);
    }
  }

  const totalDurationMs = Object.values(data).reduce((sum, user) => sum + user.totalLenghtMs, 0);
  const totalDuration = formatDuration(totalDurationMs);
  const totalSongs = Object.values(data).reduce((sum, user) => sum + user.songCount, 0);
  const userCount = Object.keys(data).length;
  const duplicatesFound = Object.values(dupes).filter((dupe) => dupe.addedBy.length > 1).length;
  const processedData = {
    metadata: {
      playlistName: metadata.name,
      playlistImage: metadata.images[0]?.url || '',
      snapshotId: metadata.snapshot_id,
      totalSongs,
      totalDuration,
      userCount,
      duplicatesFound,
      lastUpdated: new Date().toISOString(),
    },
    users: data,
    duplicates: Object.values(dupes).filter((dupe) => dupe.addedBy.length > 1),
  };

  console.log('Generated JSON data, uploading to KV storage...');
  await env.pajula.put(DATA_KEY, JSON.stringify(processedData, null, 2));
  await env.pajula.put(SNAPSHOT_KEY, metadata.snapshot_id);

  // Generate and store HTML
  console.log('Generating HTML...');
  const html = generateHtml(processedData);
  await env.pajula.put(HTML_KEY, html);
  console.log('Successfully uploaded HTML and JSON to KV storage');

  // Purge Cloudflare cache for both HTML and data routes
  // both routes are set to cache for a day in CF
  if (!env.IS_DEV) {
    console.log('Purging Cloudflare cache...');
    await purgeCloudflareCache(env);
    console.log('Successfully purged Cloudflare cache');
  }

  console.log('Processing completed successfully');
}

async function compareSnapshots(newSnapshotId: string, env: Env): Promise<boolean> {
  const previousSnapshotId = await getClodflareKvKey(env, SNAPSHOT_KEY);
  return (newSnapshotId ?? null) !== previousSnapshotId;
}
