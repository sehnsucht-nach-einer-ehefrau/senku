"use client";

import type { Book } from "@/types/book";
import YinYang from "@/public/images/yin-yang.png";
import GradCap from "@/public/images/graduate-cap.png";
import Fantasy from "@/public/images/fantasy.png";
import Image from "next/image";

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div
      className="bg-card rounded-xl shadow-lg p-4 flex flex-col items-center cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div className="w-full h-48 bg-accent rounded-xl flex justify-center items-center text-4xl text-gray-500">
        {book.category == 0 && (
          <Image src={YinYang} alt={book.category} width={100} height={100} />
        )}
        {book.category == 1 && (
          <Image src={Fantasy} alt={book.category} width={100} height={100} />
        )}
        {book.category == 2 && (
          <Image src={GradCap} alt={book.category} width={100} height={100} />
        )}
        {book.category != 0 && book.category != 1 && book.category != 2 && (
          <h1 className="text-4xl text-gray-500">?</h1>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-center line-clamp-2">
        {book.title}
      </h3>
    </div>
  );
}
