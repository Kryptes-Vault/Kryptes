const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Standard playground or your redirect URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  try {
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error("Failed to create access token :(", err);
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "chitkullakshya@gmail.com", // Your Gmail address
        accessToken,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Transporter creation error:", error);
    throw error;
  }
};

/**
 * Send a verification code email
 */
const sendVerificationEmail = async (toEmail, verificationCode) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"Kryptex Security" <chitkullakshya@gmail.com>`,
      to: toEmail,
      subject: "Your Kryptex Verification Code",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #111;">
          <h2 style="color: #FF3B13;">Kryptex Zero-Knowledge Vault</h2>
          <p>You requested an access key for your vault. Use the following code to verify your identity:</p>
          <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FF3B13;">
            ${verificationCode}
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };
