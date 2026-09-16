/** Indian phone number validation and normalization to E.164 (+91XXXXXXXXXX). */

export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");

  let national: string;
  if (digits.startsWith("+91")) {
    national = digits.slice(3);
  } else if (digits.startsWith("91") && digits.length === 12) {
    national = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    national = digits.slice(1);
  } else {
    national = digits;
  }

  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

export function formatIndianPhoneForDisplay(e164: string): string {
  const national = e164.replace("+91", "");
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}
