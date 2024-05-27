export function formatSecondsToTime(seconds: number | string): string {
  if (typeof seconds === 'string') {
    seconds = parseInt(seconds);
  }

  const array_with_time = [];

  const hours = Math.floor(seconds / 60 / 60);
  if (hours > 0) {
    array_with_time.push(hours);
  }

  array_with_time.push(Math.floor((seconds / 60) % 60));
  array_with_time.push(Math.floor(seconds % 60));

  return array_with_time.join(':').replace(/\b(\d)\b/g, '0$1');
}
