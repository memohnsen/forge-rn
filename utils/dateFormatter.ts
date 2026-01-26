const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return new Date(year, month - 1, day);
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date;
};

export const formatDate = (dateString: string): string | null => {
  try {
    const date = parseDateString(dateString);
    if (!date) {
      return null;
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch {
    return null;
  }
};

export const formatDateShort = (dateString: string): string | null => {
  try {
    const date = parseDateString(dateString);
    if (!date) {
      return null;
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch {
    return null;
  }
};

export const formatToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
