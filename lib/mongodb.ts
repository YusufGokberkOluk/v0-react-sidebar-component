import { MongoClient } from "mongodb"

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI

// Hata kontrolü
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined")
}

// Global değişken tanımı
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Bağlantı fonksiyonu
async function createMongoClient(): Promise<MongoClient> {
  try {
    console.log("Connecting to MongoDB...")
    const client = new MongoClient(MONGODB_URI!)
    return await client.connect()
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

// Client promise'i oluştur
let clientPromise: Promise<MongoClient>

// Development modunda global değişkeni kullan
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createMongoClient()
  }
  clientPromise = global._mongoClientPromise
} else {
  // Production modunda
  clientPromise = createMongoClient()
}

export default clientPromise

// Yardımcı fonksiyon - DB'ye erişim için
export async function getMongoDb() {
  try {
    const client = await clientPromise
    return client.db()
  } catch (error) {
    console.error("Error getting MongoDB database:", error)
    throw error
  }
}

// Koleksiyon erişimi için yardımcı fonksiyon - Eksik olan fonksiyon
export async function getCollection<T>(collectionName: string) {
  try {
    console.log(`Accessing collection: ${collectionName}`)
    const db = await getMongoDb()
    return db.collection<T>(collectionName)
  } catch (error) {
    console.error(`${collectionName} koleksiyonuna erişim hatası:`, error)
    throw new Error(`Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
  }
}
