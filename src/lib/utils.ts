// Calculate months lived based on date of birth
export function calculateMonthsLived(dateOfBirth: Date): number {
  const now = new Date();
  const years = now.getFullYear() - dateOfBirth.getFullYear();
  const months = now.getMonth() - dateOfBirth.getMonth();
  const totalMonths = years * 12 + months;
  return Math.max(0, totalMonths);
}

// Calculate days elapsed in current month (for partial fill)
export function getCurrentMonthProgress(dateOfBirth: Date): { daysElapsed: number; daysInMonth: number } {
  const now = new Date();
  const birthDay = dateOfBirth.getDate();
  const currentDay = now.getDate();
  
  // Get days in current month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  // Calculate days elapsed since birth day anniversary in current month
  let daysElapsed: number;
  if (currentDay >= birthDay) {
    daysElapsed = currentDay - birthDay + 1;
  } else {
    // If before birthday in month, calculate from start of month
    daysElapsed = currentDay;
  }
  
  return { daysElapsed: Math.min(daysElapsed, daysInMonth), daysInMonth };
}

// Convert age to approximate date of birth
export function ageToDateOfBirth(age: number): Date {
  const now = new Date();
  return new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
}

// Get total months for expected life years
export function getTotalMonths(years: number): number {
  return years * 12;
}

// Convert month index to year and month number
export function monthIndexToYearMonth(monthIndex: number): { year: number; month: number } {
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return { year, month };
}

// Convert year and month to month index
export function yearMonthToMonthIndex(year: number, month: number): number {
  return year * 12 + month;
}

// Generate cell key for storage (month-year format)
export function getCellKey(month: number, year: number): string {
  return `${month}-${year}`;
}

// Parse cell key
export function parseCellKey(key: string): { month: number; year: number } {
  const [month, year] = key.split("-").map(Number);
  return { month, year };
}

// Legacy support - convert weeks to months for migration if needed
export function calculateWeeksLived(dateOfBirth: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - dateOfBirth.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, diffWeeks);
}

