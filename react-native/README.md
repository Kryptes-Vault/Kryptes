# React Native Android: Local SMS Expense Sync (Zero-Knowledge)

This module implements the feature request directly:

1. Android `READ_SMS` permission setup
2. SMS inbox fetching for last 30 days
3. Regex-based transaction parser
4. AES encryption using `crypto-js`
5. UI screen with `Sync Bank Data` + decrypted transaction list

## Install dependencies in your RN app

- `react-native-get-sms-android`
- `crypto-js`

## Android permission

Add this line to your RN app's `android/app/src/main/AndroidManifest.xml` above `<application>`:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
```

A copy is also provided in:

- `react-native/android/AndroidManifest.permission.snippet.xml`

## Files

- `react-native/src/services/smsSync.ts`
  - `requestReadSmsPermission()`
  - `fetchInboxSmsLast30Days()`
  - `parseBankTransactions()`
  - `encryptTransactions()` / `decryptTransactions()`
  - `syncBankTransactionsFromSms()`

- `react-native/src/screens/BankSmsTrackerScreen.tsx`
  - Button: **Sync Bank Data**
  - Runs permission → fetch → parse → encrypt
  - Logs encrypted payload to console
  - Displays decrypted transactions in a FlatList UI

## Integration

Copy these files into your React Native project and import:

```ts
import BankSmsTrackerScreen from "./src/screens/BankSmsTrackerScreen";
```

Then render `BankSmsTrackerScreen` in your navigation stack or root screen.

## Security note

The master key is a placeholder (`USER_MASTER_PASSWORD_123`) per request.
For production, derive keys securely from user credentials and never hardcode secrets.
