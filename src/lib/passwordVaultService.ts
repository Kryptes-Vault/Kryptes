/** Password-specific vault operations + audit logging. */
import { supabase } from "@/lib/supabase";
import {
  deriveVaultKeyFromPassword,
  encryptSecretBody,
  ENCRYPTION_VERSION_V2_PBKDF2,
} from "@/lib/crypto/vaultCrypto";
import { getOrCreateKdfSaltBytes } from "@/lib/vaultService";

function bytesToB64(u8: Uint8Array): string {
  let s = "";
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

export type PasswordCategory = "social" | "work" | "shopping" | "finance" | "other";

/** Auto-suggest category from a website URL domain. */
export function inferCategory(url: string): PasswordCategory {
  const lower = url.toLowerCase();
  const socialDomains = [
    "facebook", "instagram", "twitter", "x.com", "linkedin", "snapchat",
    "tiktok", "reddit", "pinterest", "tumblr", "discord", "telegram",
    "whatsapp", "signal", "mastodon", "threads",
  ];
  const workDomains = [
    "gmail", "outlook", "microsoft", "google", "slack", "notion",
    "github", "gitlab", "bitbucket", "jira", "confluence", "trello",
    "asana", "figma", "zoom", "teams", "dropbox", "drive",
  ];
  const shoppingDomains = [
    "amazon", "flipkart", "ebay", "walmart", "shopify", "etsy",
    "alibaba", "aliexpress", "myntra", "ajio", "nykaa", "meesho",
  ];
  const financeDomains = [
    "paypal", "stripe", "razorpay", "paytm", "phonepe", "gpay",
    "sbi", "hdfc", "icici", "axis", "kotak", "bank", "crypto",
    "coinbase", "binance", "robinhood", "zerodha", "groww",
  ];

  if (socialDomains.some((d) => lower.includes(d))) return "social";
  if (workDomains.some((d) => lower.includes(d))) return "work";
  if (shoppingDomains.some((d) => lower.includes(d))) return "shopping";
  if (financeDomains.some((d) => lower.includes(d))) return "finance";
  return "other";
}

/**
 * Generate a Google Favicon URL for any domain.
 * Falls back to Clearbit if preferred, but Google's service is sufficient.
 */
export function getFaviconUrl(websiteUrl: string): string {
  try {
    const domain = new URL(
      websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
    ).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${websiteUrl}&sz=64`;
  }
}

/** Encrypt username + password as a JSON blob, store metadata as plaintext. */
export async function addPasswordEntry(params: {
  userId: string;
  title: string;
  websiteUrl: string;
  username: string;
  password: string;
  category: PasswordCategory;
  masterPassword: string;
}): Promise<void> {
  const salt = await getOrCreateKdfSaltBytes(params.userId);
  const key = await deriveVaultKeyFromPassword(params.masterPassword, salt);
  const saltB64 = bytesToB64(salt);

  // Encrypt the sensitive fields as a single JSON blob
  const secretPayload = JSON.stringify({
    username: params.username,
    password: params.password,
  });
  const { ciphertext, iv } = await encryptSecretBody(secretPayload, key);

  const { error } = await supabase.from("vault_items").insert({
    user_id: params.userId,
    title: params.title.trim(),
    website_url: params.websiteUrl.trim() || null,
    category: params.category,
    item_type: "password",
    ciphertext,
    iv,
    salt: saltB64,
    encryption_version: ENCRYPTION_VERSION_V2_PBKDF2,
  });
  if (error) throw error;

  // Log creation event
  await logAuditEvent({
    userId: params.userId,
    action: "create",
    metadata: { title: params.title.trim(), category: params.category },
  });
}

/** Insert an immutable audit log entry. */
export async function logAuditEvent(params: {
  userId: string;
  vaultItemId?: string;
  action: "reveal" | "copy" | "create" | "delete";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("vault_audit_log").insert({
    user_id: params.userId,
    vault_item_id: params.vaultItemId ?? null,
    action: params.action,
    metadata: params.metadata ?? {},
  });
  // Audit log failures are non-fatal — don't break the user flow
  if (error) console.warn("[Kryptex Audit]", error.message);
}

/**
 * Generate a cryptographically secure random password.
 */
export function generateSecurePassword(options: {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let chars = "";
  if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}
