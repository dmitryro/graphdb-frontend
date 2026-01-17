export class TimezoneUtility {
  /**
   * Returns current local time in ISO format: "2026-01-16T16:38:49"
   * Includes the local timezone offset correction.
   */
  static getCurrentLocalISO(): string {
    const now = new Date();
    // Offset is in minutes; convert to milliseconds
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offsetMs);
    return localTime.toISOString().slice(0, 19);
  }

  /**
   * Normalizes any date input to an absolute local midnight timestamp.
   * This eliminates time-of-day discrepancies in inclusive filters.
   */
  static getAbsoluteMidnight(dateInput: Date | string | number): number {
    const d = new Date(dateInput);
    // Use the constructor that targets local calendar days
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  /**
   * Calculates a Date based on "X days ago" relative to the current 2026 system clock.
   */
  static getDateFromDaysAgo(daysAgo: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
  }
}
