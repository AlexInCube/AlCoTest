export function splitBar(total: number, current: number, size = 40, line = '▬', slider = '🔘') {
  if (current > total) {
    const bar = line.repeat(size + 2);
    const percentage = (current / total) * 100;
    return [bar, percentage];
  } else {
    const percentage = current / total;
    const progress = Math.max(0, Math.round(size * percentage));
    const emptyProgress = size - progress;
    const progressText = line.repeat(progress) + slider;
    const emptyProgressText = line.repeat(emptyProgress);
    const bar = progressText + emptyProgressText;
    const calculated = percentage * 100;
    return [bar, calculated];
  }
}
