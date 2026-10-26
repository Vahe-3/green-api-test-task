export const digitsOnly = (value: string) => value.replace(/\D/g, '');

export const isValidPhone = (digits: string) => /^\d{10,15}$/.test(digits);

const PHONE_FORMATS: Array<[RegExp, string]> = [
  [/^7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2-$3-$4'],
  [/^375(\d{2})(\d{3})(\d{2})(\d{2})$/, '+375 $1 $2-$3-$4'],
  [/^374(\d{2})(\d{3})(\d{3})$/, '+374 $1 $2 $3'],
];

export function formatPhone(digits: string): string {
  for (const [pattern, format] of PHONE_FORMATS) {
    if (pattern.test(digits)) return digits.replace(pattern, format);
  }
  return digits ? `+${digits}` : '';
}
