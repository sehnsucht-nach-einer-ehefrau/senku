// utils/booksService.ts
import { getSheetsClient } from "./googleSheetsClient";
import Book from "@/types/book";
import { GaxiosError } from "gaxios"; // Import error type for better handling

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const SHEET_NAME = "Sheet1"; // Make sure this matches your sheet name

// Define a more informative return type for addBook
export interface AddBookResult {
  success: boolean;
  message: string;
  isDuplicate: boolean;
  // Optionally include the book ID if added, or existing ID if duplicate?
  // bookId?: number;
}

// Modified addBook function
export async function addBook(book: Book): Promise<AddBookResult> {
  // Basic validation
  if (!book || !book.title || !book.author) {
    return {
      success: false,
      message: "Invalid book data provided.",
      isDuplicate: false,
    };
  }

  try {
    const sheets = await getSheetsClient();
    // Fetch only Title (B) and Author (C) columns for the check - more efficient
    const checkRange = `${SHEET_NAME}!B:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: checkRange,
    });

    let exists = false;
    if (response.data.values) {
      // Correctly access title (index 0 of fetched B:C data) and author (index 1)
      exists = response.data.values.some((row) => {
        // Ensure row and expected elements exist before comparing
        const title = row?.[0];
        const author = row?.[1];
        return (
          title && // Check if title exists
          author && // Check if author exists
          title.trim().toLowerCase() === book.title.trim().toLowerCase() &&
          author.trim().toLowerCase() === book.author.trim().toLowerCase()
        );
      });
    }

    if (exists) {
      return {
        success: false,
        message: `Book "${book.title}" by ${book.author} already exists.`,
        isDuplicate: true,
      };
    }

    // If no duplicate, proceed to append
    const appendRange = `${SHEET_NAME}!A:G`; // Append to the full range
    const values = [
      [
        book.id,
        book.title.trim(), // Trim whitespace just in case
        book.author.trim(),
        book.status,
        book.category,
        book.genre,
        book.description,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: appendRange,
      valueInputOption: "USER_ENTERED", // Keeps formatting/types if possible
      insertDataOption: "INSERT_ROWS", // Recommended for appending
      requestBody: { values },
    });

    return {
      success: true,
      message: "Book added successfully.",
      isDuplicate: false,
    };
  } catch (error) {
    let message = "An error occurred while adding the book.";
    // Provide more specific feedback if possible
    if (error instanceof GaxiosError) {
      message = `Google Sheets API error: ${error.message}`;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message: message, isDuplicate: false };
  }
}

// --- Other functions (getBook, removeBook, fixBookId, etc.) ---
// Make sure getBook, removeBook, fixBookId, searchBooks, getLatestId are present here
export async function getBook(id: number): Promise<Book | null> {
  const sheets = await getSheetsClient();
  const range = `${SHEET_NAME}!A${id}:G${id}`; // Assuming ID corresponds to row number directly

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    // IMPORTANT: Check if the row corresponding to the ID actually exists
    // and if the first cell (ID cell) matches the requested ID.
    // This prevents issues if rows were deleted and IDs no longer match row numbers.
    if (
      !response.data.values ||
      response.data.values.length === 0 ||
      String(response.data.values[0][0]) !== String(id)
    ) {
      // You might want to search the whole sheet for the ID here if needed,
      // but for now, returning null is safer if the row isn't right.
      return null;
    }

    // Assuming the structure: ID, Title, Author, Status, Category, Genre, Description
    const [
      fetchedId,
      title,
      author,
      statusStr,
      categoryStr,
      genre,
      description,
    ] = response.data.values[0];

    // Perform type conversions safely
    const status = parseInt(statusStr, 10);
    const category = parseInt(categoryStr, 10);

    // Basic validation on parsed numbers
    if (isNaN(status) || isNaN(category)) {
      // Decide how to handle: return null, throw error, or return with defaults?
      return null; // Returning null is often safest
    }

    return {
      id: parseInt(fetchedId, 10), // Ensure ID is number
      title: title || "", // Default empty strings
      author: author || "",
      status: status,
      category: category,
      genre: genre || "Unknown",
      description: description || "No description",
    };
  } catch (error) {
    // Consider specific error handling (e.g., 404 from API)
    return null;
  }
}

export async function removeBook(row: number): Promise<void> {
  // Input validation: Ensure row number is positive
  if (row <= 0) {
    throw new Error("Invalid row number provided.");
  }

  const sheets = await getSheetsClient();
  const rowIndex = row - 1; // API uses 0-based indexing

  try {
    // Directly delete the specified row using batchUpdate
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming your sheet is the first one (index 0)
                dimension: "ROWS",
                startIndex: rowIndex, // 0-based start index (inclusive)
                endIndex: rowIndex + 1, // 0-based end index (exclusive)
              },
            },
          },
        ],
      },
    });

    // Call fixBookId AFTER the row deletion is confirmed.
    await fixBookId(row); // fixBookId should handle decrementing IDs of subsequent rows
  } catch (error: any) {
    throw error; // Re-throw
  }
}

export async function fixBookId(deletedRow: number): Promise<void> {
  if (deletedRow < 1) {
    return;
  }

  const sheets = await getSheetsClient();
  // Range starts from the row *after* the deletion and goes to the end of column A
  // If row 5 was deleted, we fetch A6:A
  const rangeToFetch = `${SHEET_NAME}!A${deletedRow}:A`; // Fetch from the deleted row onwards
  // We will update from the deleted row's position as well
  const rangeToUpdate = `${SHEET_NAME}!A${deletedRow}:A`;

  try {
    // 1. Get current IDs from the specified range downwards
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeToFetch,
      majorDimension: "ROWS",
    });

    const currentValues = getResponse.data.values;

    if (!currentValues || currentValues.length === 0) {
      return;
    }

    // 2. Prepare the new IDs starting from the deletedRow number
    const newValues: (string | number | null)[][] = [];
    let currentExpectedId = deletedRow; // The ID the first row *should* have now
    let updateRequired = false;

    for (let i = 0; i < currentValues.length; i++) {
      const currentRowData = currentValues[i];
      const currentIdStr = currentRowData?.[0];
      const currentIdNum = parseInt(currentIdStr, 10);

      // Check if the current ID matches the expected ID
      if (isNaN(currentIdNum) || currentIdNum !== currentExpectedId) {
        newValues.push([String(currentExpectedId)]); // Store as string
        updateRequired = true;
      } else {
        // ID is correct, push it as is (or leave it out of update if possible, but easier to push all)
        newValues.push([currentIdStr]);
      }
      currentExpectedId++; // Increment expected ID for the next row
    }

    // 3. Update the sheet with the new IDs *only if* an update is required
    if (updateRequired) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: rangeToUpdate, // Update starting from the deleted row's position
        valueInputOption: "USER_ENTERED", // Treat values as if user typed them
        requestBody: {
          values: newValues, // Provide the adjusted list of IDs
        },
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to fix book IDs: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function searchBooks(query: string): Promise<Book[]> {
  // Ensure query is a string
  if (typeof query !== "string") {
    return [];
  }

  const lowerCaseQuery = query.toLowerCase().trim();
  if (!lowerCaseQuery) return []; // Return empty if query is empty after trimming

  const sheets = await getSheetsClient();
  // Fetch all relevant columns A:G
  const range = `${SHEET_NAME}!A:G`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    if (!response.data.values) return [];

    const books: Book[] = [];
    for (const row of response.data.values) {
      // Basic check for a valid row structure (e.g., has at least title and author)
      if (!row || row.length < 3) continue;

      const [idStr, title, author, statusStr, categoryStr, genre, description] =
        row;

      // Check if title or author includes the query
      if (
        (title && title.toLowerCase().includes(lowerCaseQuery)) ||
        (author && author.toLowerCase().includes(lowerCaseQuery))
      ) {
        // Safely parse numbers, handle potential errors/NaN
        const id = parseInt(idStr, 10);
        const status = parseInt(statusStr, 10);
        const category = parseInt(categoryStr, 10);

        // Skip row if essential numeric fields are invalid
        if (isNaN(id) || isNaN(status) || isNaN(category)) {
          continue;
        }

        books.push({
          id: id,
          title: title || "",
          author: author || "",
          status: status,
          category: category,
          genre: genre || "Unknown",
          description: description || "No description",
        });
      }
    }
    return books;
  } catch (error) {
    return []; // Return empty array on error
  }
}

export async function getLatestId(): Promise<number> {
  try {
    const sheets = await getSheetsClient();
    // Fetch the entire ID column to accurately count rows with *any* data.
    // Fetching A:A might miss rows if A is empty but other columns have data.
    // Fetching a wider range like A:G and checking length is safer.
    // However, for simplicity assuming ID is always filled for a valid row:
    const range = `${SHEET_NAME}!A:A`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
      // Consider valueRenderOption: 'UNFORMATTED_VALUE' if needed
    });

    // The number of rows in the response is the count of existing entries.
    const numberOfRows = response.data.values ? response.data.values.length : 0;

    // The next ID (and row number) will be the current count + 1.
    const nextId = numberOfRows + 1;

    return nextId;
  } catch (error) {
    // Rethrow or return a sensible default? Returning 1 assumes an empty sheet on error.
    // Consider if rethrowing is better to signal a failure.
    // throw new Error(`Failed to get latest ID: ${error.message}`);
    return 1; // Default to 1 if sheet is empty or error occurs
  }
}
