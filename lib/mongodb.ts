import { MongoClient } from "mongodb"

// MongoDB URI'yi kontrol et
const MONGODB_URI = process.env.MONGODB_URI

// Global değişken tanımı
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Bağlantı fonksiyonu
async function createMongoClient() {
  // Sadece gerçek derleme aşamasında atla
  if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
    console.log("Skipping MongoDB connection during build")
    return Promise.resolve({} as MongoClient)
  }

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  try {
    console.log("Connecting to MongoDB...")
    const client = new MongoClient(MONGODB_URI)
    return client.connect()
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

// Client promise'i oluştur
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // Development modunda global değişkeni kullan
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createMongoClient()
  }
  clientPromise = global._mongoClientPromise
} else {
  // Production modunda
  clientPromise = createMongoClient()
}

export default clientPromise
