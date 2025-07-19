import { MongoClient, ServerApiVersion } from "mongodb"

// MongoDB URI - Atlas connection string
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://yusufgoluk:yusufgoluk04@cluster0.ayglxsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

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
    console.log("Connecting to MongoDB Atlas...")

    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    const client = new MongoClient(MONGODB_URI!, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    })

    // Connect the client to the server
    await client.connect()

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log("Pinged your deployment. You successfully connected to MongoDB!")

    return client
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
    return client.db("etude") // Veritabanı adını belirt
  } catch (error) {
    console.error("Error getting MongoDB database:", error)
    throw error
  }
}

// Koleksiyon erişimi için yardımcı fonksiyon
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
