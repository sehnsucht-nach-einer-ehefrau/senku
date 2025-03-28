// pages/api/books/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { addBook, AddBookResult } from "@/utils/booksService"; // Import AddBookResult type
import type { Book } from "@/types/book";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddBookResult | { message: string }>, // Update response type
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // It's good practice to validate the incoming body shape
    const bookData = req.body as Book; // Assuming body matches Book structure

    // Add basic server-side validation
    if (
      !bookData ||
      typeof bookData.id !== "number" ||
      !bookData.title ||
      !bookData.author
    ) {
      return res.status(400).json({ message: "Invalid book data received." });
    }

    // Call the updated service function
    const result = await addBook(bookData);

    if (result.success) {
      // Successfully added
      return res.status(201).json(result); // 201 Created is appropriate
    } else if (result.isDuplicate) {
      // Duplicate detected
      return res.status(409).json(result); // 409 Conflict is standard for duplicates
    } else {
      // Other error during add operation
      return res.status(500).json(result); // 500 Internal Server Error
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      isDuplicate: false,
    });
  }
}
