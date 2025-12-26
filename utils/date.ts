/**
 * Formats a date string to be used in datetime-local input
 * @param date - The date to format (defaults to now)
 * @returns Formatted date string in YYYY-MM-DDTHH:MM format
 */
export function formatForDateTimeInput(date: Date = new Date()): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Adds days to a date
 * @param date - The base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
