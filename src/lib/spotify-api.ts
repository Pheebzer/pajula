import { AUTH_URL, PLAYLIST_URL, USER_URL } from '../const';
import { AccessTokenResponse, MetadataResponse, TracksPageResponse, UserDataResponse } from '../types';
import { spotifyApiRequest } from './utils';

export async function getAccessToken(credentials: string): Promise<string> {
  const data = await spotifyApiRequest<AccessTokenResponse>(
    AUTH_URL,
    'POST',
    {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    new URLSearchParams({ grant_type: 'client_credentials' }),
  );
  return data.access_token;
}

export async function getPlaylistMetadata(accessToken: string, playlistId: string): Promise<MetadataResponse> {
  const url = new URL(`${PLAYLIST_URL}/${playlistId}`);
  url.searchParams.set('fields', 'snapshot_id,name,images,tracks(total)');
  const data = await spotifyApiRequest<MetadataResponse>(url.toString(), 'GET', { Authorization: `Bearer ${accessToken}` });
  return data;
}

export async function getTrackPage(accessToken: string, playlistId: string, offset: number): Promise<TracksPageResponse> {
  const url = new URL(`${PLAYLIST_URL}/${playlistId}/tracks`);
  url.searchParams.set('fields', 'items(added_by(id,display_name),added_at,track(name,id,duration_ms,album(name),artists(name)))');
  url.searchParams.set('limit', '100');
  url.searchParams.set('offset', String(offset));
  const data = await spotifyApiRequest<TracksPageResponse>(url.toString(), 'GET', { Authorization: `Bearer ${accessToken}` });
  return data;
}

export async function getUsernameById(accessToken: string, id: string) {
  const url = new URL(`${USER_URL}/${encodeURIComponent(id)}`); // special characters allowed in usernames
  const data = await spotifyApiRequest<UserDataResponse>(url.toString(), 'GET', { Authorization: `Bearer ${accessToken}` });
  return data;
}

export async function fetchAllPages(accessToken: string, playlistId: string, total: number): Promise<TracksPageResponse[]> {
  console.info('Parsing response data pages');
  const LIMIT = 100;
  const offsets = [];
  for (let o = 0; o < total; o += LIMIT) offsets.push(o);
  const pages = await Promise.all(offsets.map((offset) => getTrackPage(accessToken, playlistId, offset)));
  return pages;
}
