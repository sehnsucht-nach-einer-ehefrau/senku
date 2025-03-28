"use client";

import { useState } from "react";
import Book from "@/types/book";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

import YinYang from "@/public/images/yin-yang.png";
import GradCap from "@/public/images/graduate-cap.png";
import Fantasy from "@/public/images/fantasy.png";
import Image from "next/image";

interface BookDialogProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (bookId: number) => void;
  onUpdateStatus: (bookId: number, newStatus: number) => void;
}

export function BookDialog({
  book,
  isOpen,
  onClose,
  onDelete,
  onUpdateStatus,
}: BookDialogProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    book.status.toString(),
  );

  const getStatusText = (status: number) => {
    if (status == 0) {
      return "Currently Reading";
    } else if (status == 1) {
      return "Unread";
    } else if (status == 2) {
      return "Finished";
    }

    return "Unknown";
  };

  const getCategoryText = (category: number) => {
    if (category == 0) {
      return "Non-fiction";
    } else if (category == 1) {
      return "Fiction";
    } else if (category == 2) {
      return "Textbook";
    }

    return "Unknown";
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSave = () => {
    onUpdateStatus(book.id, Number.parseInt(selectedStatus));
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden scale-80 sm:scale-75 md:scale-100">
          <div className="flex flex-col md:flex-row">
            {/* Image on the left */}
            <div className="w-full md:w-1/3 bg-accent aspect-square">
              {book.category == 0 && (
                <div className="flex flex-col justify-center h-full items-center gap-4">
                  <Image
                    src={YinYang}
                    alt={`${book.category}`}
                    width={150}
                    height={150}
                  />
                  <p className="text-xl text-gray-500">{book.genre}</p>
                </div>
              )}
              {book.category == 1 && (
                <div className="flex flex-col justify-center h-full items-center gap-4">
                  <Image
                    src={Fantasy}
                    alt={`${book.category}`}
                    width={150}
                    height={150}
                  />
                  <p className="text-xl text-gray-500">{book.genre}</p>
                </div>
              )}
              {book.category == 2 && (
                <div className="flex flex-col justify-center h-full items-center gap-4">
                  <Image
                    src={GradCap}
                    alt={`${book.category}`}
                    width={150}
                    height={150}
                  />
                  <p className="text-xl text-gray-500">{book.genre}</p>
                </div>
              )}
              {book.category != 0 &&
                book.category != 1 &&
                book.category != 2 && (
                  <div className="flex flex-col justify-center h-full">
                    <h1 className="text-4xl text-gray-500 text-center">?</h1>
                    <p className="text-xl text-gray-500 text-center">
                      {book.genre}
                    </p>
                  </div>
                )}
            </div>

            {/* Content on the right */}
            <div className="w-full md:w-2/3 p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {book.title}
                </DialogTitle>
                {book.author && (
                  <p className="text-muted-foreground -mt-2 ml-1">
                    by {book.author}
                  </p>
                )}
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-sm font-medium">Status</h3>
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Currently Reading</SelectItem>
                      <SelectItem value="1">Unread</SelectItem>
                      <SelectItem value="2">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-sm font-medium">Category</h3>
                  <p>{getCategoryText(book.category)}</p>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-sm font-medium">Genre</h3>
                  <p>{book.genre}</p>
                </div>

                {book.description && (
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-sm font-medium">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {book.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  Delete
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{book.title}" from your collection.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(book.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
