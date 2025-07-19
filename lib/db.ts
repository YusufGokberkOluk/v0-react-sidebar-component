import { ObjectId } from "mongodb"
import { getCollection, getMongoDb } from "./mongodb"
import bcrypt from "bcryptjs"
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
      return null // E-posta zaten kullanımda
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
      title: "Ana Sayfa",
      content: "Hoş geldiniz! Bu sizin ana sayfanızdır. Buraya önemli notlar ekleyebilirsiniz.",
      tags: ["home", "important"],
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

// E-posta ile kullanıcı getir
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("Getting user by email:", email)
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found with email:", email)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Kullanıcıyı güncelle
export async function updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
  try {
    console.log("Updating user with ID:", id)
    const collection = await getCollection<User>("users")

    // Şifre güncelleniyorsa, hashle
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    // updatedAt alanını güncelle
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.modifiedCount === 0) {
      console.log("User not found or no changes applied with ID:", id)
      return null
    }

    // Güncellenmiş kullanıcıyı getir
    const updatedUser = await collection.findOne({ _id: new ObjectId(id) })
    if (!updatedUser) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = updatedUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// Kullanıcıyı ve tüm verilerini sil
export async function deleteUser(id: string): Promise<boolean> {
  try {
    console.log("Deleting user with ID:", id)
    const db = await getMongoDb()

    // Önce kullanıcının var olup olmadığını kontrol et
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) {
      console.log("User not found with ID:", id)
      return false
    }

    // 1. Kullanıcının tüm sayfalarını sil
    const pagesResult = await db.collection("pages").deleteMany({ userId: id })
    console.log(`Deleted ${pagesResult.deletedCount} pages for user:`, id)

    // 2. Kullanıcının tüm sayfa paylaşımlarını sil
    const sharesResult = await db.collection("pageShares").deleteMany({
      $or: [{ sharedByUserId: new ObjectId(id) }, { sharedWithEmail: user.email }],
    })
    console.log(`Deleted ${sharesResult.deletedCount} page shares for user:`, id)

    // 3. Kullanıcının tüm bildirimlerini sil
    const notificationsResult = await db.collection("notifications").deleteMany({
      $or: [{ userId: new ObjectId(id) }, { recipientEmail: user.email }],
    })
    console.log(`Deleted ${notificationsResult.deletedCount} notifications for user:`, id)

    // 4. Son olarak kullanıcıyı sil
    const userResult = await db.collection("users").deleteOne({ _id: new ObjectId(id) })

    if (userResult.deletedCount === 0) {
      console.log("Failed to delete user with ID:", id)
      return false
    }

    console.log("Successfully deleted user and all associated data:", id)
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

// Kullanıcının favori sayfalarını getirme
export async function getUserFavoritePages(userId: string): Promise<Page[]> {
  try {
    console.log("Getting favorite pages for user:", userId)
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
    console.log("Searching pages for user:", userId, "with query:", query)
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

// Kullanıcının tüm sayfalarını silme
export async function deleteAllUserPages(userId: string): Promise<boolean> {
  try {
    console.log("Deleting all pages for user:", userId)
    const collection = await getCollection<Page>("pages")
    const result = await collection.deleteMany({ userId })
    console.log(`Deleted ${result.deletedCount} pages for user:`, userId)
    return true
  } catch (error) {
    console.error("Error deleting all pages for user:", error)
    return false
  }
}

// Sayfa erişim kontrolü
export async function checkPageAccess(
  pageId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "edit" | "view" }> {
  try {
    console.log("Checking page access for:", userIdOrEmail)
    const db = await getMongoDb()

    // Sayfa bilgilerini getir
    const page = await db.collection("pages").findOne({ _id: new ObjectId(pageId) })

    if (!page) {
      return { hasAccess: false }
    }

    // Kullanıcı sayfanın sahibi mi kontrol et
    if (page.userId.toString() === userIdOrEmail) {
      return { hasAccess: true, accessLevel: "owner" }
    }

    // Kullanıcı ID mi yoksa e-posta mı kontrol et
    let userEmail: string

    try {
      // Eğer ObjectId ise, kullanıcı ID'si olarak kabul et
      new ObjectId(userIdOrEmail)

      // Kullanıcıyı bul
      const user = await db.collection("users").findOne({ _id: new ObjectId(userIdOrEmail) })

      if (!user) {
        return { hasAccess: false }
      }

      userEmail = user.email
    } catch (e) {
      // ObjectId değilse, e-posta olarak kabul et
      userEmail = userIdOrEmail
    }

    // Paylaşım kontrolü
    const share = await db.collection("pageShares").findOne({
      pageId: new ObjectId(pageId),
      sharedWithEmail: userEmail,
      status: "accepted",
    })

    if (share) {
      return { hasAccess: true, accessLevel: share.accessLevel as "edit" | "view" }
    }

    return { hasAccess: false }
  } catch (error) {
    console.error("Error checking page access:", error)
    return { hasAccess: false }
  }
}

// Sayfa paylaşımlarını getir
export async function getPageShares(pageId: string): Promise<PageShare[]> {
  try {
    console.log("Getting shares for page:", pageId)
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

// Kullanıcının bildirimlerini getir
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    console.log("Getting notifications for user:", userId)
    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return []
    }

    // Kullanıcının bildirimlerini getir
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
