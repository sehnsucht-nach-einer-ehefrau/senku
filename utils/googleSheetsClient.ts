import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export async function getSheetsClient() {
  // Parse the credentials from the environment variable
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS as string);

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
