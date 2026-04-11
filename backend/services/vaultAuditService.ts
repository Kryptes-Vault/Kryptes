import type { Request } from "express";
import { getSupabaseAdmin } from "./supabaseAdmin";

const MAX_USER_AGENT_LEN = 512;

/** Action value for server-side vault item creation events. */
export const VAULT_AUDIT_ACTION_ITEM_CREATED = "ITEM_CREATED" as const;

/**
 * Builds safe metadata for vault_audit_log: event context only.
 * Never include passwords, card numbers, ciphertext, IVs, or request bodies.
 */
export function buildVaultItemCreatedMetadata(req: Request, itemType: string): Record<string, unknown> {
  const rawUa = req.headers["user-agent"];
  const userAgent =
    typeof rawUa === "string" && rawUa.length > 0 ? rawUa.slice(0, MAX_USER_AGENT_LEN) : undefined;

  const ip =
    typeof req.ip === "string" && req.ip.length > 0
      ? req.ip
      : typeof req.socket?.remoteAddress === "string" && req.socket.remoteAddress.length > 0
        ? req.socket.remoteAddress
        : undefined;

  const metadata: Record<string, unknown> = {
    item_type: itemType,
  };
  if (userAgent !== undefined) metadata.user_agent = userAgent;
  if (ip !== undefined) metadata.ip_address = ip;
  return metadata;
}

/**
 * Immutable audit row after a new vault_items row is created.
 */
export async function insertVaultItemCreatedAudit(params: {
  userId: string;
  vaultItemId: string;
  req: Request;
  itemType: string;
}): Promise<{ error: Error | null }> {
  const supabase = getSupabaseAdmin();
  const metadata = buildVaultItemCreatedMetadata(params.req, params.itemType);

  const { error } = await supabase.from("vault_audit_log").insert({
    user_id: params.userId,
    vault_item_id: params.vaultItemId,
    action: VAULT_AUDIT_ACTION_ITEM_CREATED,
    metadata,
  });

  return { error: error ? new Error(error.message) : null };
}
