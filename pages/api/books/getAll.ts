import { NextApiRequest, NextApiResponse } from "next";
import { getSheetsClient } from "@/utils/googleSheetsClient"; // Import your custom client
import Book from "@/types/book";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  
  try {
    // Use your custom client that handles credentials properly
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A1:G",
    });
    
    const rows = response.data.values;
    if (!rows)
      return res.status(200).json({ error: "No books found", books: [] });
    
    // Add console.log to debug data
    console.log(`Found ${rows.length} rows of data`);
    
    const books: Book[] = rows.map((row) => ({
      id: parseInt(row[0]) || 1,
      title: row[1] || "",
      author: row[2] || "",
      status: parseInt(row[3]) || 0,
      category: parseInt(row[4]) || 0,
      genre: row[5] || "",
      description: row[6] || "",
    }));
    
    res.status(200).json({ books });
  } catch (error) {
    console.error("Error in getAll API:", error);
    res.status(500).json({ error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" });
  }
}
