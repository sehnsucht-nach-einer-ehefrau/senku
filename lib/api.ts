export async function getBookDetails(bookKey: string) {
  const response = await fetch(`https://openlibrary.org${bookKey}.json`);
  return response.json();
}

export async function generateGroqContent(prompt: string) {
  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
