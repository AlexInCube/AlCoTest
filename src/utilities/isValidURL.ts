const SUPPORTED_PROTOCOL = ['https:', 'http:', 'file:'] as const;

export function isValidURL(input: any): input is `${(typeof SUPPORTED_PROTOCOL)[number]}//${string}` {
  if (typeof input !== 'string' || input.includes(' ')) return false;
  try {
    const url = new URL(input);
    if (!SUPPORTED_PROTOCOL.some((p: string) => p === url.protocol)) return false;
  } catch {
    return false;
  }
  return true;
}
