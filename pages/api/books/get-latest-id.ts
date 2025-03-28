import { NextApiRequest, NextApiResponse } from "next";
import { getLatestId } from "@/utils/booksService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method == "GET") {
    const id = await getLatestId();

    if (!id) return res.status(404).json({ error: "Latest id not found" });
    return res.status(200).json(id);
  }

  res.status(405).json({ error: "Method Not Allowed" });
}
