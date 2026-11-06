// The current browser-only account prototype must never accept real credentials.
// Replace it with server-verified authentication before enabling public accounts.
export const AUTH_ENABLED = !import.meta.env.PROD;
