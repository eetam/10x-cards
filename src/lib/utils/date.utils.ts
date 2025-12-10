/**
 * Format ISO 8601 date string to localized date string
 * @param isoString - ISO 8601 date string
 * @returns Formatted date string (e.g., "15 stycznia 2024, 14:30")
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Parse ISO 8601 duration string (PT{n}S) to seconds
 * @param duration - ISO 8601 duration string (e.g., "PT15.234S")
 * @returns Total seconds as number
 */
export function parseISO8601Duration(duration: string): number {
  if (!duration || !duration.startsWith("PT")) {
    return 0;
  }

  // Remove PT prefix and S suffix
  const secondsStr = duration.replace(/^PT/, "").replace(/S$/, "");
  const seconds = parseFloat(secondsStr);

  return isNaN(seconds) ? 0 : seconds;
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "15.2 s", "1 min 30 s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds.toFixed(0)} s`;
}

/**
 * Format ISO 8601 duration string to human-readable string
 * @param duration - ISO 8601 duration string (e.g., "PT15.234S")
 * @returns Formatted duration string (e.g., "15.2 s")
 */
export function formatISO8601Duration(duration: string): string {
  const seconds = parseISO8601Duration(duration);
  return formatDuration(seconds);
}

