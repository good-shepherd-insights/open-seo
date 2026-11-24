// Guest accounts (src/server/auth/guest-accounts.ts) get a placeholder email
// on a reserved .invalid domain, which no mail server will ever accept. It
// keeps the user table's required, unique email column satisfied and marks
// addresses that must never be emailed.
const GUEST_EMAIL_DOMAIN = "guest.marylandinsights.invalid";

export function guestEmail(userId: string) {
  return `${userId}@${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestEmail(email: string | null | undefined) {
  const address = email?.toLowerCase();
  return Boolean(
    address?.endsWith(`@${GUEST_EMAIL_DOMAIN}`) ||
    // Guests created before the rename.
    address?.endsWith("@guest.openseo.invalid"),
  );
}
