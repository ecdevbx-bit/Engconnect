// Support contact numbers — surfaced on the homepage footer, the account
// dropdown's Support section, and the privacy page. Indian mobiles; the links
// prepend the +91 country code.
export const CONTACT_NUMBERS = ["8808803020", "8595926123"] as const;

export function telLink(n: string): string {
  return `tel:+91${n}`;
}

export function smsLink(n: string): string {
  return `sms:+91${n}`;
}

export function whatsappLink(n: string): string {
  return `https://wa.me/91${n}`;
}

// "8808803020" -> "+91 88088 03020"
export function formatNumber(n: string): string {
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}
