export default class Book {
  public id: number = 1;
  public title: string = "";
  public author: string = "";
  public status: number = 1;
  public category: number = 0;
  public genre: string = "";
  public description: string = "";

  constructor(
    id: number,
    title: string,
    author: string,
    status: number,
    category: number,
    genre: string,
    description: string,
  ) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.status = status;
    this.category = category;
    this.genre = genre;
    this.description = description;
  }
}
