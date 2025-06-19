import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getMongoDb, getCollection } from "./mongodb"
import type { User, Page, PageShare, Notification } from "./db-types"

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    console.log("Creating user:", userData.email)
    const collection = await getCollection<User>("users")

    // E-posta adresinin zaten kullanımda olup olmadığını kontrol et
    const existingUser = await collection.findOne({ email: userData.email })
    if (existingUser) {
      console.log("Email already in use:", userData.email)
      return null
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Kullanıcıyı oluştur
    const result = await collection.insertOne({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Oluşturulan kullanıcıyı döndür (şifre hariç)
    const newUser = await collection.findOne({ _id: result.insertedId })
    if (!newUser) return null

    // Yeni kullanıcı için varsayılan bir sayfa oluştur
    await createDefaultPage(result.insertedId.toString())

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = newUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

// Yeni kullanıcı için varsayılan sayfa oluşturma
async function createDefaultPage(userId: string): Promise<void> {
  try {
    console.log("Creating default page for user:", userId)
    await createPage({
      title: "Hoş Geldiniz!",
      content: "Bu sizin ilk sayfanız. Buraya notlarınızı yazabilirsiniz.",
      tags: ["welcome"],
      isFavorite: true,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating default page:", error)
  }
}

// Kullanıcı girişi
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    console.log("Logging in user:", email)
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found with email:", email)
      return null
    }

    // Şifreyi karşılaştır
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      console.log("Invalid password for user:", email)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password: hashedPassword, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error logging in user:", error)
    return null
  }
}

// Kullanıcıyı ID'ye göre getir
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log("Getting user by ID:", id)
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ _id: new ObjectId(id) })

    if (!user) {
      console.log("User not found with ID:", id)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Sayfa oluşturma
export async function createPage(pageData: Omit<Page, "_id">): Promise<Page | null> {
  try {
    console.log("Creating page:", pageData.title)
    const collection = await getCollection<Page>("pages")
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
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ userId }).sort({ updatedAt: -1 }).toArray()
    console.log("Found pages:", pages.length)
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user pages:", error)
    return []
  }
}

// Sayfa ID'sine göre sayfa getirme
export async function getPageById(pageId: string): Promise<Page | null> {
  try {
    console.log("Getting page by ID:", pageId)
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
    console.log("Updating page with ID:", pageId)
    const collection = await getCollection<Page>("pages")

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
    console.log("Deleting page with ID:", pageId)
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

// Diğer fonksiyonlar...
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ email })
    if (!user) return null
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
  try {
    const collection = await getCollection<User>("users")
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }
    updateData.updatedAt = new Date()
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })
    if (result.modifiedCount === 0) return null
    const updatedUser = await collection.findOne({ _id: new ObjectId(id) })
    if (!updatedUser) return null
    const { password, ...userWithoutPassword } = updatedUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const db = await getMongoDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) return false
    await db.collection("pages").deleteMany({ userId: id })
    await db.collection("pageShares").deleteMany({
      $or: [{ sharedByUserId: new ObjectId(id) }, { sharedWithEmail: user.email }],
    })
    await db.collection("notifications").deleteMany({
      $or: [{ userId: new ObjectId(id) }, { recipientEmail: user.email }],
    })
    const userResult = await db.collection("users").deleteOne({ _id: new ObjectId(id) })
    return userResult.deletedCount > 0
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

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

export async function searchPages(userId: string, query: string): Promise<Page[]> {
  try {
    const collection = await getCollection<Page>("pages")
    const pages = await collection
      .find({
        userId,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      })
      .toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error searching pages:", error)
    return []
  }
}

export async function deleteAllUserPages(userId: string): Promise<boolean> {
  try {
    const collection = await getCollection<Page>("pages")
    await collection.deleteMany({ userId })
    return true
  } catch (error) {
    console.error("Error deleting all pages for user:", error)
    return false
  }
}

export async function checkPageAccess(
  pageId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "edit" | "view" }> {
  try {
    const db = await getMongoDb()
    const page = await db.collection("pages").findOne({ _id: new ObjectId(pageId) })
    if (!page) return { hasAccess: false }
    if (page.userId.toString() === userIdOrEmail) {
      return { hasAccess: true, accessLevel: "owner" }
    }
    return { hasAccess: false }
  } catch (error) {
    console.error("Error checking page access:", error)
    return { hasAccess: false }
  }
}

export async function getPageShares(pageId: string): Promise<PageShare[]> {
  try {
    const db = await getMongoDb()
    const shares = await db
      .collection("pageShares")
      .find({ pageId: new ObjectId(pageId) })
      .toArray()
    return shares as PageShare[]
  } catch (error) {
    console.error("Error getting page shares:", error)
    return []
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const db = await getMongoDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user) return []
    const notifications = await db
      .collection("notifications")
      .find({
        $or: [{ userId: new ObjectId(userId) }, { recipientEmail: user.email }],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()
    return notifications as Notification[]
  } catch (error) {
    console.error("Error getting user notifications:", error)
    return []
  }
}
