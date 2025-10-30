
// New function to parse 'dd/mm/yyyy' into a Date object
export const parseDate = (dateString: string): Date => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return new Date(NaN);
    const [day, month, year] = parts.map(Number);
    // Month is 0-indexed in JavaScript Date constructor
    return new Date(year, month - 1, day);
};

// Formats a Date object into 'dd/mm/yyyy' string
export const formatDate = (date: Date): string => {
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Converts 'dd/mm/yyyy' string to 'yyyy-mm-dd' for date input elements
export const toInputDate = (dateString: string): string => {
    if (!dateString || dateString.split('/').length !== 3) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
};

// Converts 'yyyy-mm-dd' from a date input to 'dd/mm/yyyy' string
export const fromInputDate = (inputDateString: string): string => {
    if (!inputDateString || inputDateString.split('-').length !== 3) return '';
    const [year, month, day] = inputDateString.split('-');
    return `${day}/${month}/${year}`;
};

export const getTodayDateString = (): string => {
  return formatDate(new Date());
};

export const generateBookingId = (): string => {
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SR${timestamp}${randomPart}`;
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  const startDate = parseDate(checkIn);
  const endDate = parseDate(checkOut);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
    return 0;
  }
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Add days to a date string in 'dd/mm/yyyy' format
export const addDays = (dateString: string, days: number): string => {
    const date = parseDate(dateString);
    date.setDate(date.getDate() + days);
    return formatDate(date);
};
