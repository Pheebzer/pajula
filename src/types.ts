export interface Env {
  pajula: KVNamespace;
  IS_DEV: boolean;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_PLAYLIST_ID: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_DOMAIN?: string;
  CLOUDFLARE_ZONE_ID?: string;
}

export interface AccessTokenResponse {
  access_token: string;
}
export interface UserDataResponse {
  display_name: string;
}
export interface MetadataResponse {
  snapshot_id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  tracks: { total: number };
}

// Shape of the objects the API returns, cannot be altered
// Can be null for unavailable tracks
export type TrackItem = {
  added_at: string;
  added_by: {
    id: string;
    display_name?: string;
  };
  track: {
    id: string;
    name: string;
    duration_ms: number;
    album: { name: string };
    artists: { name: string }[];
  } | null;
};

export interface TracksPageResponse {
  items: TrackItem[];
}

export type Track = {
  id: string;
  name: string;
  durationMs: number;
  durationTimestamp: string;
  album: string;
  artist: string;
  addedBy: string;
  addedAt: string;
};

export interface UserData {
  displayName: string;
  songCount: number;
  totalLenghtMs: number;
  tracks: Track[];
}

export type MasterData = Record<string, UserData>;

export interface DuplicateEntry {
  song: string;
  artist: string;
  addedBy: { user: string; AddedAt: string }[];
}

export type DuplicateData = Record<string, DuplicateEntry>;
