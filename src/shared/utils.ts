export const INACTIVITY_DAYS = 30;

export function getLocalDateString(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife', // UFCG is in Campina Grande, Paraíba (UTC-3)
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d); // Returns "YYYY-MM-DD"
}
