/* 
 * Best effort duplicate checker
 * Each song has an unique ID, but deduping with it will only catch entries that are literally the same song from Spotify POV.
 * This would now catch songs that are the same, but were e.g. added from a different album.
 * Instead we calculate a hash based on song attributes (name, title, artist), and deduplicate based on that.
*/

export function semanticKey(songTitle: string, primaryArtist: string, durationMs: number): string {
  return `${canonicalArtist(primaryArtist)}|${canonicalTitle(songTitle)}|${durationBucket(durationMs)}`;
}

function canonicalTitle(raw: string): string {
  const FEAT_RX = /\b(feat\.?|featuring|with)\b.*$/i;
  let t = raw.replace(FEAT_RX, "");
  return normalize(t);
}

function canonicalArtist(primary: string): string {
  return normalize(primary);
}

function durationBucket(ms: number, sec = 5): number {
  const s = Math.round(ms / 1000);
  return Math.round(s / sec) * sec;
}

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

