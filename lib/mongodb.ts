import { MongoClient } from "mongodb"

// Derleme sırasında çalışmayı önlemek için kontrol
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI && process.env.NODE_ENV !== "production") {
  console.warn("MongoDB URI bulunamadı. Lütfen .env dosyanızı kontrol edin.")
}

// Derleme sırasında çalışmayı önlemek için global değişken
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Derleme sırasında çalışmayı önlemek için kontrol
if (process.env.NODE_ENV === "development") {
  // Development modunda global değişken kullan
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI || "")
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("MongoDB bağlantı hatası:", err)
      // Boş bir promise döndür, ama asla reject etme
      return new Promise<MongoClient>(() => {})
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  // Production modunda
  client = new MongoClient(MONGODB_URI || "")
  clientPromise = client.connect().catch((err) => {
    console.error("MongoDB bağlantı hatası:", err)
    // Boş bir promise döndür, ama asla reject etme
    return new Promise<MongoClient>(() => {})
  })
}

export default clientPromise
