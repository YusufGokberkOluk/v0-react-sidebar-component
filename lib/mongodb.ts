// MongoDB bağlantı havuzu için iyileştirmeler
import { MongoClient, type MongoClientOptions } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined")
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const options: MongoClientOptions = {
  maxPoolSize: 10, // Bağlantı havuzu boyutu
  minPoolSize: 5, // Minimum bağlantı sayısı
  connectTimeoutMS: 10000, // Bağlantı zaman aşımı
  socketTimeoutMS: 45000, // Soket zaman aşımı
}

async function createMongoClient(): Promise<MongoClient> {
  try {
    console.log("Connecting to MongoDB...")
    const client = new MongoClient(MONGODB_URI!, options)
    return await client.connect()
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createMongoClient()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = createMongoClient()
}

export default clientPromise

export async function getMongoDb() {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("Error getting MongoDB database:", error)
    throw error
  }
}
