
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export async function getSheetsClient() {
  let auth;
  
  // Check if we have environment variable credentials (production/Vercel)
  if (process.env.GOOGLE_CREDENTIALS) {
    // Parse the credentials from the environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } 
  // Fallback to credentials file (development environment)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    auth = new GoogleAuth({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  // If neither is available, throw an error
  else {
    throw new Error("Google credentials not found. Please set either GOOGLE_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS environment variable.");
  }
  
  return google.sheets({ version: "v4", auth });
}
