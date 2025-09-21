import { DuplicateEntry, Env, Track, TrackItem, UserData } from '../types';
import { getUsernameById } from './spotify-api';
import { semanticKey } from './deduplicator';

export async function spotifyApiRequest<T>(url: string, method: string, headers: Record<string, string>, body: any = null): Promise<T> {
  const options: RequestInit = { method, headers };
  if (body !== null) options.body = body;
  const r = await fetch(url, options);
  if (!r.ok) {
    throw new Error(`Spotify api request failed for url ${url}: ${r.status} -> ${r.statusText}`);
  }
  return r.json() as Promise<T>;
}

export async function getClodflareKvKey(env: Env, key: string): Promise<string | null> {
  const value = await env.pajula.get(key);
  if (!value) console.error(`cannot find key ${key} from KV storage`);
  return value;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = hours > 0 ? `${hours}:` : '';
  const m = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const s = String(seconds).padStart(2, '0');

  return `${h}${m}:${s}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${day}.${month}.${year} ${hours}:${minutes.toString().padStart(2, '0')}`;
}

export async function processItem(data: UserData, track: Track) {
  data.songCount += 1;
  data.totalLenghtMs += track.durationMs;
  data.tracks.push(track);
}

export function hasTrack(i: TrackItem): i is TrackItem & { track: NonNullable<TrackItem['track']> } {
  return i.track !== null;
}

export function toTrack(trackItem: TrackItem & { track: NonNullable<TrackItem['track']> }): Track {
  return {
    id: trackItem.track.id,
    name: trackItem.track.name,
    durationMs: trackItem.track.duration_ms,
    durationTimestamp: formatDuration(trackItem.track.duration_ms),
    album: trackItem.track.album.name,
    artist: trackItem.track.artists.map((a) => a.name).join(', '),
    addedBy: trackItem.added_by.id,
    addedAt: trackItem.added_at,
  };
}

export async function initUserData(accessToken: string, id: string): Promise<UserData> {
  const userData = await getUsernameById(accessToken, id);
  return {
    displayName: userData.display_name,
    songCount: 0,
    totalLenghtMs: 0,
    tracks: [],
  };
}

export function updateDuplicates(dupes: Record<string, DuplicateEntry>, t: Track): void {
  const k = semanticKey(t.name, t.artist, t.durationMs);
  const entry = dupes[k];
  if (!entry) {
    dupes[k] = { song: t.name, artist: t.artist, addedBy: [{ user: t.addedBy, AddedAt: t.addedAt }] };
    return;
  }
  entry.addedBy.push({ user: t.addedBy, AddedAt: t.addedAt });
}

export async function fetchDisplayName(accessToken: string, userId: string): Promise<string> {
  try {
    const userData = await getUsernameById(accessToken, userId);
    return userData.display_name;
  } catch (error) {
    console.warn(`Failed to fetch display name for user ${userId}:`, error);
    return userId;
  }
}

export async function purgeCloudflareCache(env: Env): Promise<void> {
  try {
    if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_DOMAIN || !env.CLOUDFLARE_ZONE_ID) {
      console.error('Cloudflare cache purging skipped - credentials not configured');
      return;
    }

    const urls = ['/', '/data'];
    const apiUrl = `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`;
    const requestBody = {
      files: urls.map((url) => `https://${env.CLOUDFLARE_DOMAIN}${url}`),
    };

    console.log('Purging cache for URLs:', requestBody.files);
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Failed to purge Cloudflare cache:', response.status, response.statusText);
      console.warn('Error response:', errorText);
    } else {
      const result = await response.json();
      console.log('Successfully purged Cloudflare cache:', result);
    }
  } catch (error) {
    console.warn('Error purging Cloudflare cache:', error);
  }
}
