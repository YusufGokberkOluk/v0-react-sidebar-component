import { getMongoDb } from "./mongodb"

export async function createIndexes() {
  try {
    console.log("Creating MongoDB indexes...")
    const db = await getMongoDb()

    // Users collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    // Pages collection indexes
    await db.collection("pages").createIndex({ userId: 1 })
    await db.collection("pages").createIndex({ title: "text", content: "text" })
    await db.collection("pages").createIndex({ userId: 1, isFavorite: 1 })
    await db.collection("pages").createIndex({ userId: 1, tags: 1 })

    console.log("MongoDB indexes created successfully")
    return true
  } catch (error) {
    console.error("Error creating MongoDB indexes:", error)
    return false
  }
}
