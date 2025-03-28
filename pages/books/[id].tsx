// pages/books/[id].tsx
import { GetServerSideProps } from "next";
import Book from "@/types/book";
import { getBook } from "@/utils/booksService";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    const book = await getBook(Number(id));
    return { props: { book } };
  } catch (error) {
    return { notFound: true };
  }
};

export default function BookPage({ book }: { book: Book }) {
  return (
    <div>
      <h1>{book.title}</h1>
      <p>By {book.author}</p>
    </div>
  );
}
