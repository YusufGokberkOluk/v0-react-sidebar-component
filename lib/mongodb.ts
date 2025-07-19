import { MongoClient, type Db } from "mongodb"

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://yusufgoluk:yusufgoluk04@cluster0.ayglxsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

let client: MongoClient
let db: Db

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    console.log("Connected to MongoDB")
  }

  if (!db) {
    db = client.db("etude") // Veritabanı adı
  }

  return { client, db }
}

export async function getMongoDb(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}

export async function getCollection<T = any>(name: string) {
  const database = await getMongoDb()
  return database.collection<T>(name)
}
