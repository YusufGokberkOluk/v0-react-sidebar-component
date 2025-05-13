import { getMongoDb } from "./mongodb"

export async function createIndexes(): Promise<boolean> {
  try {
    const db = await getMongoDb()

    // Example: Create an index on the 'email' field of the 'users' collection
    const usersCollection = db.collection("users")
    await usersCollection.createIndex({ email: 1 }, { unique: true })

    // Example: Create an index on the 'userId' field of the 'pages' collection
    const pagesCollection = db.collection("pages")
    await pagesCollection.createIndex({ userId: 1 })

    // Example: Create an index on the 'templateId' field of the 'templateFavorites' collection
    const templateFavoritesCollection = db.collection("templateFavorites")
    await templateFavoritesCollection.createIndex({ templateId: 1 })

    console.log("Indexes created successfully")
    return true
  } catch (error) {
    console.error("Error creating indexes:", error)
    return false
  }
}
