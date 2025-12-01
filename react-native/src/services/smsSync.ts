import { PermissionsAndroid } from "react-native";
import SmsAndroid from "react-native-get-sms-android";
import CryptoJS from "crypto-js";

export type TransactionType = "DEBIT" | "CREDIT";

export interface ParsedTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  date: string; // ISO timestamp
  source: string;
}

interface AndroidSms {
  _id?: number | string;
  body?: string;
  date?: number | string;
}

const MASTER_KEY = "USER_MASTER_PASSWORD_123";

const KEYWORD_REGEX = /(debited|credited|spent|inr|rs\.?|₹)/i;
const TYPE_REGEX = /\b(credited|credit|cr)\b/i;
const AMOUNT_REGEX = /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
const MERCHANT_REGEX = /\b(?:to|at|info)\s+([a-zA-Z0-9&._\- ]{2,})(?=\.|,|\son\s|\sref\b|\savl\b|\sbal\b|$)/i;

const normalizeMerchant = (value: string) =>
  value
    .replace(/\s{2,}/g, " ")
    .replace(/[.,;:\-\s]+$/, "")
    .trim();

export const requestReadSmsPermission = async (): Promise<boolean> => {
  const permission = PermissionsAndroid.PERMISSIONS.READ_SMS;

  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: "Allow secure SMS expense sync",
    message:
      "We read bank SMS locally on your phone to detect expenses. Messages are processed on-device and encrypted before storage.",
    buttonPositive: "Allow",
    buttonNegative: "Not now",
    buttonNeutral: "Ask later",
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const fetchInboxSmsLast30Days = (): Promise<AndroidSms[]> => {
  return new Promise((resolve, reject) => {
    const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const filter = {
      box: "inbox",
      minDate: thirtyDaysAgoMs,
      maxDate: Date.now(),
      indexFrom: 0,
      maxCount: 1000,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (failure: string) => reject(new Error(failure)),
      (_count: number, smsList: string) => {
        try {
          const parsed = JSON.parse(smsList) as AndroidSms[];
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      },
    );
  });
};

export const parseBankTransactions = (messages: AndroidSms[]): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];

  for (const msg of messages) {
    const body = (msg.body ?? "").replace(/\n/g, " ").trim();
    if (!body || !KEYWORD_REGEX.test(body)) {
      continue;
    }

    const amountMatch = body.match(AMOUNT_REGEX);
    if (!amountMatch) {
      continue;
    }

    const normalizedAmount = Number(amountMatch[1].replace(/,/g, ""));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      continue;
    }

    const isCredit = TYPE_REGEX.test(body);
    const type: TransactionType = isCredit ? "CREDIT" : "DEBIT";

    const merchantMatch = body.match(MERCHANT_REGEX);
    const merchant = normalizeMerchant(merchantMatch?.[1] ?? "Unknown Merchant");

    const timestamp = Number(msg.date ?? Date.now());
    const safeTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();

    transactions.push({
      id: String(msg._id ?? `${safeTimestamp}-${transactions.length}`),
      amount: normalizedAmount,
      type,
      merchant,
      date: new Date(safeTimestamp).toISOString(),
      source: body,
    });
  }

  return transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const encryptTransactions = (payload: ParsedTransaction[]): string => {
  const serialized = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(serialized, MASTER_KEY).toString();
};

export const decryptTransactions = (cipherText: string): ParsedTransaction[] => {
  const bytes = CryptoJS.AES.decrypt(cipherText, MASTER_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) {
    return [];
  }

  return JSON.parse(decrypted) as ParsedTransaction[];
};

export const syncBankTransactionsFromSms = async (): Promise<{
  encrypted: string;
  transactions: ParsedTransaction[];
}> => {
  const allowed = await requestReadSmsPermission();
  if (!allowed) {
    throw new Error("READ_SMS permission denied.");
  }

  const sms = await fetchInboxSmsLast30Days();
  const parsed = parseBankTransactions(sms);
  const encrypted = encryptTransactions(parsed);

  return {
    encrypted,
    transactions: decryptTransactions(encrypted),
  };
};
