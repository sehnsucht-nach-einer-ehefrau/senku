import { NextApiRequest, NextApiResponse } from "next";
import { searchBooks } from "@/utils/booksService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method == "GET") {
    const { query } = req.query;

    const books = await searchBooks(query as string);
    return res.status(200).json(books);
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
