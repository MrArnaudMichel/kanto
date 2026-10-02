/** How many decimals `n` is written with: 0.25 has two, 1e-7 seven. */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const [mantissa = '', exponent] = n.toExponential().split('e');
  const digits = (mantissa.split('.')[1] ?? '').length;
  return Math.max(0, digits - Number(exponent));
}
