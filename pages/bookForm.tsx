"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Book from "@/types/book";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCwIcon as ReloadIcon, PlusIcon } from "lucide-react";
// Assuming AddBookResult is exported from your service file
import { AddBookResult } from "@/utils/booksService";

interface BookFormProps {
  onBookAdded: (newBook: Book) => void;
  onProcessingChange?: (isProcessing: boolean) => void; // Callback for parent
}

export default function BookForm({
  onBookAdded,
  onProcessingChange,
}: BookFormProps) {
  const [formData, setFormData] = useState<{ title: string; author: string }>({
    title: "",
    author: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Notify parent component about submission state changes
  useEffect(() => {
    onProcessingChange?.(isSubmitting);
  }, [isSubmitting, onProcessingChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      toast.error("Please enter both title and author.");
      return;
    }
    setIsSubmitting(true); // <-- Set submitting state START

    let completeNewBookData: Book | null = null;

    try {
      // --- 1. Get the next available ID ---
      const metadataResponse = await fetch("/api/books/get-latest-id");
      if (!metadataResponse.ok) throw new Error("Failed to get latest ID");
      const nextId = await metadataResponse.json();

      const book_base_info = {
        id: nextId,
        title: formData.title.trim(),
        author: formData.author.trim(),
        status: 1, // Default status: Unread
      };

      // --- 2. Call AI API (Groq) ---
      toast.info("Generating book details...");
      const groqResponse = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: book_base_info }),
      });
      if (!groqResponse.ok) throw new Error("AI generation failed");

      const groqData = await groqResponse.json();
      const completion = groqData.choices[0]?.message?.content || "";
      const split_completion = completion.split("\n");

      // Construct the full book object
      completeNewBookData = {
        id: book_base_info.id,
        title: split_completion[0] || book_base_info.title,
        author: split_completion[1] || book_base_info.author,
        status: book_base_info.status,
        category: Number(split_completion[2] || 0),
        genre: split_completion[3] || "Unknown",
        description: split_completion[4] || "No description available",
      };

      // --- 3. Attempt to add book via API ---
      toast.info("Saving book...");
      const addResponse = await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeNewBookData),
      });

      // --- 4. Handle API Response ---
      const addResult: AddBookResult = await addResponse.json();

      if (addResponse.ok) {
        toast.success(addResult.message || "Book added successfully!");
        if (completeNewBookData) {
          onBookAdded(completeNewBookData); // Call callback
        } else {
          toast.info("Book added, but data mismatch. UI might update shortly.");
        }
        setFormData({ title: "", author: "" }); // Reset form
        setOpen(false); // Close dialog
      } else if (addResponse.status === 409) {
        toast.error(addResult.message || "This book already exists.");
        // Keep dialog open and form filled
      } else {
        throw new Error(
          addResult.message || `Submission failed: ${addResponse.status}`,
        );
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "There was an error adding the book. Please try again.",
      );
      // Keep dialog open on error
    } finally {
      setIsSubmitting(false); // <-- Set submitting state END
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* The button's interactability is controlled by the parent's overlay */}
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Book</DialogTitle>
          <DialogDescription>
            Enter title and author. Additional details will be generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="The Myth of Sisyphus"
              autoComplete="off"
              required
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting} // Input disabled based on internal state
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              name="author"
              placeholder="Albert Camus"
              required
              autoComplete="off"
              value={formData.author}
              onChange={handleChange}
              disabled={isSubmitting} // Input disabled based on internal state
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Book"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
