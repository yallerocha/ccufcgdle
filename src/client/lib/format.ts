// Formats a prize amount (integer reais) as Brazilian currency, e.g. 1000000 →
// "R$ 1.000.000". Fictional show money, so no cents.
const prizeFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrize(value: number): string {
  return prizeFormatter.format(value);
}
