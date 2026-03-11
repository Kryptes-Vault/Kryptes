const { google } = require("googleapis");
const { getCachedVault, setCachedVault } = require("../services/redisService");

// Initialization of Service Account Auth
const serviceAccountAuth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/gmail.readonly"]
);

// OAuth2 Client (for user-specific actions if needed, but we use Service Account as requested)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:4000/auth/google/callback"
);

/**
 * Log new user to Google Sheets using Service Account
 */
const logUserToSheet = async (userData) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: serviceAccountAuth });
    const { name, userId, email } = userData;
    const date = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Users!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[name || "N/A", userId, email, date]],
      },
    });
    console.log(`[Google Sheets] User ${email} logged successfully.`);
  } catch (error) {
    console.error("[Google Sheets Error] Logging failed:", error.message);
  }
};

/**
 * Start Gmail Watch for a user using Service Account delegation
 * Note: Service account must have Domain-Wide Delegation for this to work on any user email.
 */
const startGmailWatch = async (userEmail) => {
  try {
    // We impersonate the user using domain-wide delegation if configured
    const delegatedAuth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/gmail.readonly"],
      userEmail
    );

    const gmail = google.gmail({ version: "v1", auth: delegatedAuth });
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        labelIds: ["INBOX"],
        topicName: process.env.GMAIL_TOPIC_NAME,
      },
    });
    console.log(`[Gmail Watch] Started for ${userEmail}`);
    return response.data;
  } catch (error) {
    console.error(`[Gmail Watch Error] Failed for ${userEmail}:`, error.message);
    throw error;
  }
};

/**
 * Fetch and process banking emails using Service Account delegation
 */
const processNewEmails = async (userEmail, historyId) => {
  try {
    const delegatedAuth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/gmail.readonly"],
      userEmail
    );

    const gmail = google.gmail({ version: "v1", auth: delegatedAuth });
    const response = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
    });

    const history = response.data.history || [];
    const bankingKeywords = ["UPI", "Debited", "Ref No", "Account", "Transferred"];

    for (const record of history) {
      if (record.messagesAdded) {
        for (const msgObj of record.messagesAdded) {
          const message = await gmail.users.messages.get({
            userId: "me",
            id: msgObj.message.id,
          });

          const snippet = message.data.snippet || "";
          const foundKeywords = bankingKeywords.filter(kw => snippet.includes(kw));

          if (foundKeywords.length > 0) {
            console.log(`[Finance Engine] Found banking keywords for ${userEmail}`);
            // Further logic for parsing and storage...
          }
        }
      }
    }
  } catch (error) {
    console.error(`[Gmail Process Error] Failed for ${userEmail}:`, error.message);
  }
};

module.exports = {
  serviceAccountAuth,
  logUserToSheet,
  startGmailWatch,
  processNewEmails
};
