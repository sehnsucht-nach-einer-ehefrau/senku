"use client";

import { useEffect, useState, useCallback } from "react";
import type { Book } from "@/types/book";
import BookCard from "@/components/book-card";
import { BookDialog } from "@/components/book-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon as ReloadIcon } from "lucide-react";
import BookForm from "@/pages/bookForm"; // Adjust path if needed
import { ModeToggle } from "@/components/mode-toggle"; // Adjust path if needed

// Import cn utility for merging Tailwind classes
import { cn } from "@/lib/utils";
// If you don't have cn:
// import clsx, { ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export default function BookGrid() {
  // --- State Hooks ---
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isProcessing, setIsProcessing] = useState(false); // For add/delete/update actions AND refetches
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Combined loading/processing state
  const isDisabled = isLoading || isProcessing;

  // --- Core Data Fetching Function ---
  const fetchBooks = useCallback(async (isRefetch = false) => {
    if (isRefetch) {
      setIsProcessing(true);
    } else {
      setIsLoading(true);
      if (isProcessing) setIsProcessing(false);
    }

    try {
      const response = await fetch("/api/books/getAll");
      if (!response.ok)
        throw new Error(`Failed to fetch books (${response.status})`);
      const data = await response.json();
      const booksWithNumericIds = (data.books || [])
        .map((book: any) => ({
          ...book,
          id: parseInt(String(book.id), 10),
          status: parseInt(String(book.status), 10),
          category: parseInt(String(book.category), 10),
        }))
        .filter((book: Book) => !isNaN(book.id));
      setBooks(booksWithNumericIds);
    } catch (error: any) {
      toast.error(`Could not load book collection: ${error.message}`);
      setBooks([]);
    } finally {
      if (isRefetch) {
        setIsProcessing(false);
      } else {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependency array minimal for fetch function itself

  // --- Effect Hooks ---
  // Initial fetch on component mount
  useEffect(() => {
    fetchBooks(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Filter books whenever the source 'books' state or filter criteria change
  useEffect(() => {
    // Don't filter unnecessarily during initial load
    if (isLoading) return;
    let filtered = books;
    if (filterStatus != null) {
      filtered = filtered.filter((book) => book.status == filterStatus);
    }
    if (filterCategory != null) {
      filtered = filtered.filter((book) => book.category == filterCategory);
    }
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(lowerCaseQuery) ||
          book.author.toLowerCase().includes(lowerCaseQuery),
      );
    }
    setFilteredBooks(filtered);
  }, [books, filterStatus, filterCategory, query, isLoading]); // Include isLoading

  // --- Memoized/Callback Hooks ---
  // handleAddBook: Triggered by BookForm's onBookAdded AFTER successful API call in BookForm
  const handleAddBook = useCallback(() => {
    toast.info("Refreshing book list...");
    fetchBooks(true);
  }, [fetchBooks]);

  // handleProcessingChange remains as originally intended
  const handleProcessingChange = useCallback((processing: boolean) => {
    setIsProcessing(processing);
  }, []);

  // Derived state (no change)
  const currentlyReadingBooks = books.filter((book) => book.status == 0);

  // --- Event Handlers & Helpers ---
  const handleBookClick = (book: Book) => {
    if (isDisabled) return;
    const currentBookData = books.find((b) => b.id === book.id);
    if (currentBookData) {
      setSelectedBook(currentBookData);
      setIsDialogOpen(true);
    } else {
      toast.warning("Book details might be outdated. Displaying cached info.");
      setSelectedBook(book);
      setIsDialogOpen(true);
    }
  };

  // --- handleDeleteBook (Refetch on Success) ---
  const handleDeleteBook = async (bookIdToDelete: number) => {
    if (bookIdToDelete == undefined || isNaN(bookIdToDelete) || isProcessing)
      return;

    const bookToDeleteDetails = books.find((book) => book.id == bookIdToDelete);
    const title = bookToDeleteDetails?.title || "the book";

    setIsProcessing(true);
    setIsDialogOpen(false);
    setSelectedBook(null);
    toast.info(`Deleting "${title}"...`);

    try {
      const response = await fetch("/api/books/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row: bookIdToDelete }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Server failed to delete book (status: ${response.status})`,
        );
      }

      toast.success(`"${title}" deleted successfully! Refreshing list...`);
      await fetchBooks(true);
    } catch (error: any) {
      toast.error(`Failed to delete "${title}". ${error.message || ""}`);
      setIsProcessing(false); // Ensure processing stops on error if fetch doesn't run
    }
    // fetchBooks will set isProcessing to false on success
  };

  // --- handleUpdateStatus (Corrected for Backend Logic) ---
  const handleUpdateStatus = async (
    bookIdToUpdate: number, // The ID known by the frontend when action initiated
    newStatus: number,
  ) => {
    if (
      bookIdToUpdate == undefined ||
      isNaN(bookIdToUpdate) ||
      newStatus == undefined ||
      isProcessing
    ) {
      return;
    }

    const bookToUpdate = books.find((book) => book.id == bookIdToUpdate);

    if (!bookToUpdate) {
      toast.error("Could not find book details to update. Please refresh.");
      setIsDialogOpen(false);
      setSelectedBook(null);
      return;
    }
    if (bookToUpdate.status == newStatus) {
      toast.info("Status is already set to the desired value.");
      setIsDialogOpen(false);
      setSelectedBook(null);
      return;
    }

    setIsProcessing(true); // Start the overall process
    setIsDialogOpen(false);
    setSelectedBook(null);
    toast.info(`Updating status for "${bookToUpdate.title}"...`);

    let newBookId: number | null = null; // To store the ID for the re-add step

    try {
      // --- Step 1: Delete the old entry ---
      const deleteResponse = await fetch("/api/books/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row: bookIdToUpdate }), // Use the ID known at the time
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed Step 1: Remove old book entry (status: ${deleteResponse.status})`,
        );
      }

      // --- Step 2: Get the NEW ID for the re-add ---
      // This should be called *after* delete and fixBookId have completed on the backend.
      const idResponse = await fetch("/api/books/get-latest-id");
      if (!idResponse.ok) {
        throw new Error(
          `Failed Step 2: Get latest ID (status: ${idResponse.status})`,
        );
      }
      newBookId = await idResponse.json();
      if (typeof newBookId !== "number" || isNaN(newBookId)) {
        throw new Error(
          `Failed Step 2: Received invalid new ID (${newBookId})`,
        );
      }

      // --- Step 3: Prepare the full book data for re-adding ---
      const bookDataToAdd: Book = {
        ...bookToUpdate, // Copy original data (title, author, etc.)
        id: newBookId, // Assign the NEW ID obtained from the backend
        status: newStatus, // Set the NEW status
      };

      // --- Step 4: Add the book back with the new ID and status ---
      const addResponse = await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookDataToAdd), // Send the complete object including the new ID
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({
          message: `Re-add failed with status ${addResponse.status}`,
        }));
        // Check for specific conflict status from your API
        if (addResponse.status === 409) {
          throw new Error(
            `Failed Step 4: Conflict detected on re-add. ${errorData.message || ""}`,
          );
        }
        throw new Error(
          `Failed Step 4: Re-add book (status: ${addResponse.status}). ${errorData.message || ""}`,
        );
      }

      // --- Step 5: Refetch the entire list on complete success ---
      toast.success(
        `Status updated for "${bookToUpdate.title}"! Refreshing list...`,
      );
      await fetchBooks(true); // Trigger refetch
    } catch (error: any) {
      toast.error(
        `Failed to update status for "${bookToUpdate.title}". ${error.message || "Unknown error"}. List might be inconsistent.`,
      );
      // Attempt refetch even on error to try and sync state
      await fetchBooks(true); // Use await here to ensure processing state is handled correctly by fetchBooks
    }
    // fetchBooks() handles setting isProcessing to false in its finally block.
  };

  // Render grid function (no changes needed)
  const renderBookGrid = (booksToRender: Book[], title: string) => (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
          isDisabled && "opacity-50 pointer-events-none",
        )}
      >
        {isLoading && !isProcessing ? ( // Show loading only on initial load within grid area
          <p className="col-span-full text-center text-gray-500">
            Loading books...
          </p>
        ) : booksToRender.length > 0 ? (
          booksToRender.map((book) => {
            if (book.id == undefined || isNaN(book.id)) {
              return null;
            }
            return (
              <BookCard
                key={`${book.id}-${book.title}-${book.author}`} // Key is fine
                book={book}
                onClick={() => handleBookClick(book)}
              />
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            {title == "Currently Reading"
              ? "No books being read currently."
              : "No books match the current filters."}
          </p>
        )}
      </div>
    </div>
  );

  // --- Initial Load UI --- (no changes needed)
  if (isLoading && !isProcessing) {
    // Show full overlay only on initial load
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <ReloadIcon className="h-6 w-6 animate-spin text-gray-600" />
        <span className="ml-3 text-lg text-gray-700">
          Loading Collection...
        </span>
      </div>
    );
  }

  // --- Main Render --- (no functional changes needed)
  return (
    <div className="p-4 md:p-8 relative">
      {/* Processing Overlay - Controlled by isProcessing */}
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 cursor-wait">
          <ReloadIcon className="h-5 w-5 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-700">Processing...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">
          Book Collection
        </h1>
        <div className="flex gap-4">
          <ModeToggle />

          <BookForm
            onBookAdded={handleAddBook} // Connects to the refetch logic
            onProcessingChange={handleProcessingChange}
            disabled={isProcessing} // Disable form during processing
          />
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={query}
        name="randomName123"
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title or author..."
        className="mb-4 p-2 border rounded w-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDisabled}
      />

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap justify-center sm:justify-start gap-2">
        <Button
          variant={filterStatus === 0 ? "default" : "outline"}
          onClick={() => setFilterStatus((fs) => (fs === 0 ? null : 0))}
          disabled={isDisabled}
        >
          {" "}
          Reading{" "}
        </Button>
        <Button
          variant={filterStatus === 1 ? "default" : "outline"}
          onClick={() => setFilterStatus((fs) => (fs === 1 ? null : 1))}
          disabled={isDisabled}
        >
          {" "}
          Unread{" "}
        </Button>
        <Button
          variant={filterStatus === 2 ? "default" : "outline"}
          onClick={() => setFilterStatus((fs) => (fs === 2 ? null : 2))}
          disabled={isDisabled}
        >
          {" "}
          Finished{" "}
        </Button>
        <div className="border-l border-gray-300 h-8 mx-2 hidden sm:block"></div>
        <Button
          variant={filterCategory === 0 ? "default" : "outline"}
          onClick={() => setFilterCategory((fc) => (fc === 0 ? null : 0))}
          disabled={isDisabled}
        >
          {" "}
          Non-fiction{" "}
        </Button>
        <Button
          variant={filterCategory === 1 ? "default" : "outline"}
          onClick={() => setFilterCategory((fc) => (fc === 1 ? null : 1))}
          disabled={isDisabled}
        >
          {" "}
          Fiction{" "}
        </Button>
        <Button
          variant={filterCategory === 2 ? "default" : "outline"}
          onClick={() => setFilterCategory((fc) => (fc === 2 ? null : 2))}
          disabled={isDisabled}
        >
          {" "}
          Textbook{" "}
        </Button>
        {(filterStatus !== null || filterCategory !== null || query !== "") && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterStatus(null);
              setFilterCategory(null);
              setQuery("");
            }}
            disabled={isDisabled}
          >
            {" "}
            Clear Filters{" "}
          </Button>
        )}
      </div>

      {/* Render Book Grids */}
      {renderBookGrid(currentlyReadingBooks, "Currently Reading")}
      {renderBookGrid(filteredBooks, "Full Collection")}

      {/* Book Dialog */}
      {selectedBook && (
        <BookDialog
          key={`${selectedBook.id}-${selectedBook.title}-${selectedBook.author}`}
          book={selectedBook}
          isOpen={isDialogOpen}
          onClose={() =>
            !isProcessing && (setIsDialogOpen(false), setSelectedBook(null))
          }
          onDelete={() => handleDeleteBook(selectedBook.id)}
          onUpdateStatus={(newStatus) =>
            handleUpdateStatus(selectedBook.id, newStatus)
          }
          isProcessing={isProcessing} // Pass processing state
        />
      )}
    </div>
  );
}
