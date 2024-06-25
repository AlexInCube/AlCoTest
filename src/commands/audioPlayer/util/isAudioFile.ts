export function isAudioFile(filename: string) {
  return filename.endsWith('.mp3') || filename.endsWith('.wav') || filename.endsWith('.ogg');
}
