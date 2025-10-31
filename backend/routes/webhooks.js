const express = require("express");
const router = express.Router();
const { processNewEmails } = require("../integrations/googleService");

/**
 * @route POST /api/webhooks/gmail
 * @desc Cloud Pub/Sub Webhook for Gmail Push Notifications
 */
router.post("/gmail", async (req, res) => {
  try {
    if (!req.body.message) return res.status(400).send("No message provided");

    // Decode Pub/Sub Base64 Message
    const encodedData = req.body.message.data;
    const decodedMessage = JSON.parse(Buffer.from(encodedData, "base64").toString());
    
    const { emailAddress, historyId } = decodedMessage;
    console.log(`[Webhook] Gmail Update for ${emailAddress} (HistoryID: ${historyId})`);

    // Process newest messages
    await processNewEmails(emailAddress, historyId);

    res.status(200).send("Processed");
  } catch (error) {
    console.error("[Webhook Error] Gmail Processing Failed:", error.message);
    res.status(500).send("Internal Processing Error");
  }
});

module.exports = router;
