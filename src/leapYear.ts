
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year) || year < 0) {
    throw new Error('INVALID_YEAR');
  }

  if (year % 400 === 0) {
    return true;
  }

  if (year % 100 === 0) {
    return false;
  }

  return year % 4 === 0;
}
