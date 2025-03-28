import { NextApiRequest, NextApiResponse } from "next";
import { getBook } from "@/utils/booksService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method === "GET") {
    const book = await getBook(Number(id));
    if (!book) return res.status(404).json({ error: "Book not found" });
    return res.status(200).json(book);
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
