import { ObjectId } from "mongodb"
import { getMongoDb, getCollection } from "./mongodb"
import type { Page, PageShare } from "./db-types"
import { getUserByEmail } from "./users"

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

// Sayfa paylaşımı
export async function sharePage(
  pageId: string,
  sharedByUserId: string,
  sharedWithEmail: string,
  accessLevel: "view" | "edit",
): Promise<PageShare | null> {
  try {
    console.log("Sharing page:", pageId, "with:", sharedWithEmail)
    const db = await getMongoDb()

    // Sayfanın var olduğunu kontrol et
    const page = await db.collection("pages").findOne({ _id: new ObjectId(pageId) })

    if (!page) {
      console.log("Page not found:", pageId)
      return null
    }

    // Paylaşım yapan kullanıcının sayfaya erişim yetkisi var mı kontrol et
    const access = await checkPageAccess(pageId, sharedByUserId)
    if (!access.hasAccess || (access.accessLevel !== "owner" && access.accessLevel !== "edit")) {
      console.log("User does not have permission to share the page:", sharedByUserId)
      return null
    }

    // Zaten paylaşılmış mı kontrol et
    const existingShare = await db.collection("pageShares").findOne({
      pageId: new ObjectId(pageId),
      sharedWithEmail,
    })

    if (existingShare) {
      // Erişim seviyesini güncelle
      await db.collection("pageShares").updateOne(
        { _id: existingShare._id },
        {
          $set: {
            accessLevel,
            updatedAt: new Date(),
          },
        },
      )

      const updatedShare = await db.collection("pageShares").findOne({ _id: existingShare._id })

      return updatedShare as PageShare
    }

    // Yeni paylaşım oluştur
    const pageShare: PageShare = {
      pageId: new ObjectId(pageId),
      workspaceId: page.workspaceId,
      sharedByUserId: new ObjectId(sharedByUserId),
      sharedWithEmail,
      accessLevel,
      status: "pending",
      createdAt: new Date(),
    }

    const result = await db.collection("pageShares").insertOne(pageShare)

    // Paylaşım yapan kullanıcıyı bul
    const sharingUser = await getUserByEmail(sharedByUserId)

    // Workspace bilgilerini getir
    const workspace = await db.collection("workspaces").findOne({ _id: page.workspaceId })

    // Bildirim oluştur
    const notification = {
      recipientEmail: sharedWithEmail,
      type: "share_invitation",
      content: `${sharingUser?.name || "Bir kullanıcı"} sizinle "${page.title}" sayfasını paylaştı.`,
      link: `/app?page=${pageId}`,
      metadata: {
        workspaceId: workspace ? workspace._id.toString() : undefined,
        pageId: pageId,
        senderId: sharedByUserId,
        senderName: sharingUser?.name,
      },
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    const newShare = await db.collection("pageShares").findOne({ _id: result.insertedId })

    return newShare as PageShare
  } catch (error) {
    console.error("Error sharing page:", error)
    return null
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
