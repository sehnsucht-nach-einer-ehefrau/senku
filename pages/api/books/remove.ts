import { NextApiRequest, NextApiResponse } from "next";
import { removeBook } from "@/utils/booksService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method == "DELETE") {
    const { row } = req.body;

    try {
      await removeBook(Number(row));
      return res.status(200).json({ message: "Book removed successfully!" });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
