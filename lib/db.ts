import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getMongoDb } from "./mongodb"
import type { User, Page } from "./db-types"

async function getCollection<T>(collectionName: string) {
  const db = await getMongoDb()
  return db.collection<T>(collectionName)
}

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    const { password, ...rest } = userData
    const hashedPassword = await bcrypt.hash(password, 10)

    const collection = await getCollection<User>("users")
    const result = await collection.insertOne({
      ...rest,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const newUser = await collection.findOne({ _id: result.insertedId })
    return newUser as User
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

// Kullanıcı girişi
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found:", email)
      return null
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      console.log("Invalid password for user:", email)
      return null
    }

    return user as User
  } catch (error) {
    console.error("Error logging in user:", error)
    return null
  }
}

// Kullanıcı ID'sine göre kullanıcı getirme
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    return user as User
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Kullanıcı güncelleme
export async function updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
  try {
    const collection = await getCollection<User>("users")

    // Şifre güncellemesi yapılıyorsa, şifreyi hash'le
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updateData, updatedAt: new Date() } },
    )

    if (result.modifiedCount === 0) {
      console.log("User not found or no changes applied with ID:", userId)
      return null
    }

    const updatedUser = await collection.findOne({ _id: new ObjectId(userId) })
    return updatedUser as User
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// Kullanıcı silme
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const collection = await getCollection<User>("users")
    const result = await collection.deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      console.log("User not found with ID:", userId)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Sayfa oluşturma
export async function createPage(pageData: Omit<Page, "_id">): Promise<Page | null> {
  try {
    const collection = await getCollection<Page>("pages")
    const result = await collection.insertOne({
      ...pageData,
    })

    const newPage = await collection.findOne({ _id: result.insertedId })
    return newPage as Page
  } catch (error) {
    console.error("Error creating page:", error)
    return null
  }
}

// Kullanıcının tüm sayfalarını getirme
export async function getUserPages(userId: string): Promise<Page[]> {
  try {
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ userId }).toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user pages:", error)
    return []
  }
}

// Sayfa ID'sine göre sayfa getirme
export async function getPageById(pageId: string): Promise<Page | null> {
  try {
    const collection = await getCollection<Page>("pages")
    const page = await collection.findOne({ _id: new ObjectId(pageId) })
    return page as Page
  } catch (error) {
    console.error("Error getting page by ID:", error)
    return null
  }
}

// Sayfa güncelleme
export async function updatePage(pageId: string, updateData: Partial<Page>): Promise<Page | null> {
  try {
    const collection = await getCollection<Page>("pages")
    const result = await collection.updateOne(
      { _id: new ObjectId(pageId) },
      { $set: { ...updateData, updatedAt: new Date() } },
    )

    if (result.modifiedCount === 0) {
      console.log("Page not found or no changes applied with ID:", pageId)
      return null
    }

    const updatedPage = await collection.findOne({ _id: new ObjectId(pageId) })
    return updatedPage as Page
  } catch (error) {
    console.error("Error updating page:", error)
    return null
  }
}

// Sayfa silme
export async function deletePage(pageId: string): Promise<boolean> {
  try {
    const collection = await getCollection<Page>("pages")
    const result = await collection.deleteOne({ _id: new ObjectId(pageId) })

    if (result.deletedCount === 0) {
      console.log("Page not found with ID:", pageId)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting page:", error)
    return false
  }
}

// Kullanıcının favori sayfalarını getirme
export async function getUserFavoritePages(userId: string): Promise<Page[]> {
  try {
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ userId, isFavorite: true }).toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user favorite pages:", error)
    return []
  }
}

// Sayfa arama
export async function searchPages(userId: string, query: string): Promise<Page[]> {
  try {
    const collection = await getCollection<Page>("pages")
    const pages = await collection
      .find({
        userId,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { tags: { $in: [query] } }, // Etiketlerde tam eşleşme
        ],
      })
      .toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error searching pages:", error)
    return []
  }
}

// Kullanıcının tüm sayfalarını silme
export async function deleteAllUserPages(userId: string): Promise<boolean> {
  try {
    const collection = await getCollection<Page>("pages")
    const result = await collection.deleteMany({ userId })

    console.log(`Deleted ${result.deletedCount} pages for user ID: ${userId}`)
    return true
  } catch (error) {
    console.error("Error deleting all pages for user:", error)
    return false
  }
}
