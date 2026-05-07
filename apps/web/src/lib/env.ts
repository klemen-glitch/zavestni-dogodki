// Runtime env validation — throws at startup if required vars are missing
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),
  BEEHIIV_API_KEY: optional("BEEHIIV_API_KEY"),
  BEEHIIV_PUBLICATION_ID: optional("BEEHIIV_PUBLICATION_ID"),
  WEBHOOK_SECRET: optional("WEBHOOK_SECRET"),
  ADMIN_SECRET: optional("ADMIN_SECRET"),
  STRIPE_SECRET_KEY: optional("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: optional("STRIPE_WEBHOOK_SECRET"),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
