import { NextApiRequest, NextApiResponse } from "next";
import { Groq } from "groq-sdk";

const KEY = process.env.GROQ_API_KEY;

if (!KEY) {
  throw new Error("Missing Groq API Key. Ensure GROQ_API_KEY is set.");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method != "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { book } = req.body;
    const client = new Groq({ apiKey: KEY });

    const prompt = `Correct any spelling errors or user errors (like putting the wrong author) and generate the correct title of the book (with proper capitalizations), and the correct author. Decide whether this book is Non-Fiction, Fiction, or Textbook. If it is Non-Fiction, then generate 0. If it is Fiction, then generate 1. If it is Textbook, then generate 2. Then decide the genre of this book, and print it as a string. Be as vague as possible for the genre, but not vague enough for it to conflict with the category, meaning don't generate 'Non-Fiction', 'Fiction', or 'Textbook' as the genre. It should be something appropriate like 'Philosophy', 'Self Improvement', 'Fantasy', etc. Finally, write a two sentence brief summary of the book as a string. Split all three of these things with new lines. Example for the book 'The Myth of Sisyphus' by Albert Camus: The Myth of Sisyphus\nAlbert Camus\n0\nPhilosophy\nIn 'The Myth of Sisyphus,' Albert Camus explores the concept of absurdism, arguing that humanity's search for meaning in a seemingly meaningless world is inherently futile, yet it is in this futility that we find freedom and purpose. Through the metaphor of Sisyphus, who eternally pushes a boulder up a mountain only for it to roll back down, Camus posits that it is the act of living and persevering, not the outcome, that gives life its value and significance.[END OF EXAMPLE]. The book you are working with is: ${book.title} by ${book.author}. Only respond with the information requested. Don't introduce or conclude.`;

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate completion" });
  }
}
