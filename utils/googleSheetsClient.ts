
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export async function getSheetsClient() {
  try {
    let auth;
    
    // Check if we have individual credential fields (alternative approach)
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log("Using individual Google credential fields");
      const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix escaped newlines
        project_id: process.env.GOOGLE_PROJECT_ID
      };
      
      auth = new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    }
//     // Fallback to credentials file (development environment)
//     else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//       auth = new GoogleAuth({
//         keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
//         scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//       });
//     }
//     // If neither is available, throw an error
    else {
      throw new Error("Google credentials not found. Please set either GOOGLE_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS environment variable.");
    }
    
    return google.sheets({ version: "v4", auth });

  } catch (error) {
    console.error("Error creating Google Sheets client:", error);
    throw error;
  }
}
