import { Track } from 'riffy';

export function playlistCalculateDuration(playlist: Array<Track>): number {
  let duration_ms = 0;

  for (const track of playlist) {
    duration_ms += track.info.length;
  }

  return duration_ms;
}
