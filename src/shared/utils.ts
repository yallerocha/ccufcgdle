
export function getLocalDateString(date?: Date): string {
  const d = date ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife', // UFCG is in Campina Grande, Paraíba (UTC-3)
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d); // Returns "YYYY-MM-DD"
}

// The local date string for the day before `dateStr` ("YYYY-MM-DD" → "YYYY-MM-DD").
// Used by the daily streak logic to tell a continued streak from a broken one.
export function getPreviousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d));
  prev.setUTCDate(prev.getUTCDate() - 1);
  const yyyy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(prev.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
