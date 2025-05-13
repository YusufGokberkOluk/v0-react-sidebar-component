import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getMongoDb } from "./mongodb"
import type { User, Page, UserPreferences } from "./db-types"

// Yardımcı fonksiyon
async function getCollection(collectionName: string) {
  try {
    console.log(`Accessing collection: ${collectionName}`)
    const db = await getMongoDb()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`${collectionName} koleksiyonuna erişim hatası:`, error)
    throw new Error(`Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
  }
}

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    console.log("Creating user:", userData.email)
    const collection = await getCollection("users")

    // E-posta adresinin benzersizliğini kontrol et
    const existingUser = await collection.findOne({ email: userData.email })
    if (existingUser) {
      console.log("Email already in use:", userData.email)
      return null
    }

    // Şifreyi şifrele
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const result = await collection.insertOne({
      ...userData,
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
    console.log("Logging in user:", email)
    const collection = await getCollection("users")

    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found:", email)
      return null
    }

    // Şifreyi karşılaştır
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

// Kullanıcı kimliğine göre kullanıcı getirme
export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log("Getting user by ID:", userId)
    const collection = await getCollection("users")

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
    console.log("Updating user:", userId)
    const collection = await getCollection("users")

    // updatedAt alanını güncelle
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

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
    console.log("Deleting user:", userId)
    const collection = await getCollection("users")

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
    console.log("Creating page:", pageData.title)
    const collection = await getCollection("pages")

    const result = await collection.insertOne({
      ...pageData,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    console.log("Getting pages for user:", userId)
    const collection = await getCollection("pages")

    const pages = await collection.find({ userId: userId }).toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user pages:", error)
    return []
  }
}

// Sayfa güncelleme
export async function updatePage(pageId: string, updateData: Partial<Page>): Promise<Page | null> {
  try {
    console.log("Updating page:", pageId)
    const collection = await getCollection("pages")

    // updatedAt alanını güncelle
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: new ObjectId(pageId) }, { $set: updateData })

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
    console.log("Deleting page:", pageId)
    const collection = await getCollection("pages")

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

// Kullanıcı tercihlerini güncelleme
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences | null> {
  try {
    console.log("Updating user preferences:", userId)
    const collection = await getCollection("users")

    const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { preferences: preferences } })

    if (result.modifiedCount === 0) {
      console.log("User not found or no changes applied with ID:", userId)
      return null
    }

    const updatedUser = await collection.findOne({ _id: new ObjectId(userId) })
    return updatedUser?.preferences as UserPreferences
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return null
  }
}

// Şablonu favorilere ekleme
export async function addTemplateToFavorites(userId: string, templateId: string): Promise<boolean> {
  try {
    console.log("Adding template to favorites:", userId, templateId)
    const collection = await getCollection("templateFavorites")

    const result = await collection.insertOne({
      userId: userId,
      templateId: templateId,
      createdAt: new Date(),
    })

    return result.acknowledged
  } catch (error) {
    console.error("Error adding template to favorites:", error)
    return false
  }
}

// Şablonu favorilerden çıkarma
export async function removeTemplateFromFavorites(userId: string, templateId: string): Promise<boolean> {
  try {
    console.log("Removing template from favorites:", userId, templateId)
    const collection = await getCollection("templateFavorites")

    const result = await collection.deleteOne({
      userId: userId,
      templateId: templateId,
    })

    return result.deletedCount > 0
  } catch (error) {
    console.error("Error removing template from favorites:", error)
    return false
  }
}

// Kullanıcının favori şablonlarını getirme
export async function getUserFavoriteTemplates(userId: string): Promise<string[]> {
  try {
    console.log("Getting favorite templates for user:", userId)
    const collection = await getCollection("templateFavorites")

    const favorites = await collection.find({ userId: userId }).toArray()

    // Extract templateIds from the favorites
    const templateIds = favorites.map((favorite) => (favorite as any).templateId) as string[]

    return templateIds
  } catch (error) {
    console.error("Error getting favorite templates:", error)
    return []
  }
}
