import { ObjectId } from "mongodb"
import { getCollection, getMongoDb } from "./mongodb"
import bcrypt from "bcryptjs"
import type { User, Page, Share, Notification } from "./db-types"

// --- User login -------------------------------------------------------------
export async function loginUser(email: string, password: string): Promise<User | null> {
  const users = await getCollection<User>("users")
  const user = await users.findOne({ email })
  if (!user) return null

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) return null

  // şifre alanını dışarı bırak
  const { password: _pw, ...userWithoutPassword } = user as User
  return userWithoutPassword as User
}

// --- Sayfa erişim kontrolü --------------------------------------------------
export async function checkPageAccess(
  pageId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "edit" | "view" }> {
  const db = await getMongoDb()

  // 1- Sayfa var mı?
  const page = await db.collection("pages").findOne({ _id: new ObjectId(pageId) })
  if (!page) return { hasAccess: false }

  // 2- Sahibi mi?
  if (page.userId.toString() === userIdOrEmail) {
    return { hasAccess: true, accessLevel: "owner" }
  }

  // 3- E-posta mı yoksa userId mi?
  let email = userIdOrEmail
  try {
    // userId ise kullanıcıyı getirip mail’ini al
    const user = await db.collection("users").findOne({ _id: new ObjectId(userIdOrEmail) })
    if (user) email = user.email
  } catch {
    /* gelen değer zaten e-posta */
  }

  // 4- Paylaşımları kontrol et
  const share = await db.collection("shares").findOne({
    pageId: new ObjectId(pageId),
    sharedWithEmail: email,
    status: "accepted",
  })

  if (share)
    return {
      hasAccess: true,
      accessLevel: share.accessLevel as "edit" | "view",
    }

  return { hasAccess: false }
}

// --- Favori sayfalar --------------------------------------------------------
export async function getUserFavoritePages(userId: string): Promise<Page[]> {
  const pages = await getCollection<Page>("pages")
  return (await pages.find({ userId, isFavorite: true }).sort({ updatedAt: -1 }).toArray()) as Page[]
}

// Kullanıcı işlemleri
export async function createUser(userData: Omit<User, "_id">) {
  try {
    const users = await getCollection<User>("users")

    // Email kontrolü
    const existingUser = await users.findOne({ email: userData.email })
    if (existingUser) {
      throw new Error("Bu email adresi zaten kullanılıyor")
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await users.insertOne(user)
    return { ...user, _id: result.insertedId }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    const users = await getCollection<User>("users")
    return await users.findOne({ email })
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    const users = await getCollection<User>("users")
    return await users.findOne({ _id: new ObjectId(userId) })
  } catch (error) {
    console.error("Error getting user by ID:", error)
    throw error
  }
}

export async function updateUser(userId: string, updateData: Partial<User>) {
  try {
    const users = await getCollection<User>("users")
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updateData, updatedAt: new Date() } },
    )
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    const users = await getCollection<User>("users")
    const result = await users.deleteOne({ _id: new ObjectId(userId) })
    return result.deletedCount > 0
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// Sayfa işlemleri
export async function createPage(pageData: Omit<Page, "_id">) {
  try {
    const pages = await getCollection<Page>("pages")
    const result = await pages.insertOne(pageData)
    return { ...pageData, _id: result.insertedId }
  } catch (error) {
    console.error("Error creating page:", error)
    throw error
  }
}

export async function getUserPages(userId: string) {
  try {
    const pages = await getCollection<Page>("pages")
    return await pages.find({ userId }).sort({ updatedAt: -1 }).toArray()
  } catch (error) {
    console.error("Error getting user pages:", error)
    throw error
  }
}

export async function getPageById(pageId: string) {
  try {
    const pages = await getCollection<Page>("pages")
    return await pages.findOne({ _id: new ObjectId(pageId) })
  } catch (error) {
    console.error("Error getting page by ID:", error)
    throw error
  }
}

export async function updatePage(pageId: string, updateData: Partial<Page>) {
  try {
    const pages = await getCollection<Page>("pages")
    const result = await pages.updateOne(
      { _id: new ObjectId(pageId) },
      { $set: { ...updateData, updatedAt: new Date() } },
    )
    if (result.modifiedCount > 0) {
      return await getPageById(pageId)
    }
    return null
  } catch (error) {
    console.error("Error updating page:", error)
    throw error
  }
}

export async function deletePage(pageId: string) {
  try {
    const pages = await getCollection<Page>("pages")
    const result = await pages.deleteOne({ _id: new ObjectId(pageId) })
    return result.deletedCount > 0
  } catch (error) {
    console.error("Error deleting page:", error)
    throw error
  }
}

export async function searchPages(userId: string, query: string) {
  try {
    const pages = await getCollection<Page>("pages")
    return await pages
      .find({
        userId,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      })
      .sort({ updatedAt: -1 })
      .toArray()
  } catch (error) {
    console.error("Error searching pages:", error)
    throw error
  }
}

export async function getPagesByTag(userId: string, tag: string) {
  try {
    const pages = await getCollection<Page>("pages")
    return await pages.find({ userId, tags: tag }).sort({ updatedAt: -1 }).toArray()
  } catch (error) {
    console.error("Error getting pages by tag:", error)
    throw error
  }
}

export async function getFavoritePages(userId: string) {
  try {
    const pages = await getCollection<Page>("pages")
    return await pages.find({ userId, isFavorite: true }).sort({ updatedAt: -1 }).toArray()
  } catch (error) {
    console.error("Error getting favorite pages:", error)
    throw error
  }
}

export async function getUserTags(userId: string) {
  try {
    const pages = await getCollection<Page>("pages")
    const result = await pages
      .aggregate([
        { $match: { userId } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()

    return result.map((item) => ({ tag: item._id, count: item.count }))
  } catch (error) {
    console.error("Error getting user tags:", error)
    throw error
  }
}

// Paylaşım işlemleri
export async function createShare(shareData: Omit<Share, "_id">) {
  try {
    const shares = await getCollection<Share>("shares")
    const result = await shares.insertOne(shareData)
    return { ...shareData, _id: result.insertedId }
  } catch (error) {
    console.error("Error creating share:", error)
    throw error
  }
}

export async function getShareById(shareId: string) {
  try {
    const shares = await getCollection<Share>("shares")
    return await shares.findOne({ _id: new ObjectId(shareId) })
  } catch (error) {
    console.error("Error getting share by ID:", error)
    throw error
  }
}

export async function getShareByToken(token: string) {
  try {
    const shares = await getCollection<Share>("shares")
    return await shares.findOne({ token })
  } catch (error) {
    console.error("Error getting share by token:", error)
    throw error
  }
}

export async function updateShare(shareId: string, updateData: Partial<Share>) {
  try {
    const shares = await getCollection<Share>("shares")
    const result = await shares.updateOne(
      { _id: new ObjectId(shareId) },
      { $set: { ...updateData, updatedAt: new Date() } },
    )
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error updating share:", error)
    throw error
  }
}

export async function deleteShare(shareId: string) {
  try {
    const shares = await getCollection<Share>("shares")
    const result = await shares.deleteOne({ _id: new ObjectId(shareId) })
    return result.deletedCount > 0
  } catch (error) {
    console.error("Error deleting share:", error)
    throw error
  }
}

// Bildirim işlemleri
export async function createNotification(notificationData: Omit<Notification, "_id">) {
  try {
    const notifications = await getCollection<Notification>("notifications")
    const result = await notifications.insertOne(notificationData)
    return { ...notificationData, _id: result.insertedId }
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const notifications = await getCollection<Notification>("notifications")
    return await notifications.find({ userId }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error("Error getting user notifications:", error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notifications = await getCollection<Notification>("notifications")
    const result = await notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true, updatedAt: new Date() } },
    )
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const notifications = await getCollection<Notification>("notifications")
    const result = await notifications.deleteOne({ _id: new ObjectId(notificationId) })
    return result.deletedCount > 0
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}
