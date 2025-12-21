// @ts-ignore
import { getUserVaultStatus, setUserVaultActive } from "../services/supabaseAdmin";
import { redisCacheService } from "../services/redisCacheService";
// @ts-ignore - bitwardenService is currently JS and may not have type declarations
import { fetchCardsFromBitwarden, saveCardToBitwarden } from "../services/bitwardenService";

/**
 * bankingController handles the secure data flow for Banking & Cards assets.
 * It enforces AES-256-GCM encrypted caching to prevent plaintext leaks in Redis.
 */
export const bankingController = {
  /**
   * GET /api/vault/cards
   * Retrieves user's cards using a secure cache-aside pattern.
   */
  async getCards(req: Request, res: Response) {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required as a query parameter." });
    }

    try {
      // 0. Gatekeeper Check: Prevent unnecessary calls for new users
      const hasVaultData = await getUserVaultStatus(userId);
      if (!hasVaultData) {
        console.log(`[Gatekeeper] Fast-returning [] for user ${userId} (Empty Vault)`);
        return res.status(200).json({ cards: [], source: "gatekeeper" });
      }

      // 1. Attempt to retrieve and decrypt items from the secure cache
      const cachedCards = await redisCacheService.getCachedVaultItems(userId, "cards");

      if (cachedCards) {
        return res.status(200).json({ 
          cards: cachedCards, 
          source: "cache" 
        });
      }

      // 2. Cache Miss - Fetch fresh data from the Bitwarden SDK
      console.log(`[Cache Miss] Fetching fresh cards for user ${userId} from Bitwarden`);
      const freshCards = await fetchCardsFromBitwarden(userId);

      // 3. Encrypt and store the fresh data back into Redis for future requests
      if (freshCards && freshCards.length > 0) {
        await redisCacheService.setCachedVaultItems(userId, "cards", freshCards);
      }

      return res.status(200).json({ 
        cards: freshCards, 
        source: "vault" 
      });
    } catch (error: any) {
      console.error(`[BankingController] getCards Error:`, error.message);
      return res.status(500).json({ error: "Failed to retrieve secure banking assets." });
    }
  },

  /**
   * POST /api/vault/cards
   * Persists a new card to Bitwarden and invalidates the stale cache.
   */
  async addCard(req: Request, res: Response) {
    const { 
      userId, 
      cardholderName, 
      cardNumber, 
      expMonth, 
      expYear, 
      code, 
      accountNumber, 
      ifscCode 
    } = req.body;

    // Strict validation for required banking identifiers
    if (!userId || !accountNumber || !ifscCode) {
      return res.status(400).json({ error: "Missing required fields (userId, accountNumber, ifscCode)" });
    }

    try {
      // Prepare the Bitwarden-compliant payload for a Card item (type 3)
      const bitwardenPayload = {
        type: 3, 
        name: `Bank Card - ${cardholderName || 'Unknown'}`,
        card: {
          cardholderName,
          number: cardNumber,
          expMonth,
          expYear,
          code
        },
        fields: [
          { name: "Account Number", value: accountNumber, type: 1 },
          { name: "IFSC Code", value: ifscCode, type: 1 }
        ]
      };

      // 1. Persistence: Save securely to Bitwarden (Single Source of Truth)
      await saveCardToBitwarden(userId, bitwardenPayload);

      // 2. Cache Invalidation: Explicitly clear the stale cache key to force a refresh on next GET
      await redisCacheService.invalidateVaultCache(userId, "cards");

      // 3. First-Save Flip: Ensure subsequent fetches are allowed
      await setUserVaultActive(userId);

      return res.status(201).json({ 
        success: true, 
        message: "Card securely stored and cache invalidated." 
      });
    } catch (error: any) {
      console.error(`[BankingController] addCard Error:`, error.message);
      return res.status(500).json({ error: error.message || "Failed to persist card to secure vault." });
    }
  }
};
