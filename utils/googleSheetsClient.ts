// utils/googleSheetsClient.ts
import { google } from "googleapis";

export async function getSheetsClient() {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
