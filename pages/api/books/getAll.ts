import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import Book from "@/types/book";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method != "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A1:G",
    });

    const rows = response.data.values;

    if (!rows)
      return res.status(200).json({ error: "No books found", books: [] });

    const books: Book[] = rows.map((row) => ({
      id: row[0] || 1,
      title: row[1] || "",
      author: row[2] || "",
      status: row[3] || 0,
      category: row[4] || 0,
      genre: row[5] || "",
      description: row[6] || "",
    }));

    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
