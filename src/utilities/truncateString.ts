export function truncateString(str: string, maxLen: number) {
  if (str.length > maxLen - 3) {
    return str.slice(0, maxLen - 3) + '...';
  } else {
    return str;
  }
}
