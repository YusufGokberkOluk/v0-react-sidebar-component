// Mevcut importları koruyun ve gerekirse güncelleyin
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getMongoDb, getCollection } from "./mongodb"
import type { User, Page, PageShare, Notification, Workspace, WorkspaceShare } from "./db-types"
import { getUserById } from "./users"
import { createPage } from "./pages"
import { checkPageAccess } from "./pages"

// Mevcut fonksiyonları koruyun ve aşağıdaki yeni fonksiyonları ekleyin

// Kullanıcı için varsayılan workspace oluşturma
export async function createDefaultWorkspace(userId: string, userName?: string): Promise<Workspace | null> {
  try {
    console.log("Creating default workspace for user:", userId)
    const collection = await getCollection<Workspace>("workspaces")

    // Kullanıcı adına göre workspace adı oluştur
    let workspaceName = "My Workspace"
    if (userName) {
      workspaceName = `${userName}'s workspace`
    } else {
      // Kullanıcı adı yoksa, e-posta adresinden al
      const user = await getUserById(userId)
      if (user && user.email) {
        const username = user.email.split("@")[0]
        const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1)
        workspaceName = `${formattedUsername}'s workspace`
      }
    }

    const workspace: Workspace = {
      name: workspaceName,
      ownerId: new ObjectId(userId),
      isDefault: true,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(workspace)
    const newWorkspace = await collection.findOne({ _id: result.insertedId })
    return newWorkspace as Workspace
  } catch (error) {
    console.error("Error creating default workspace:", error)
    return null
  }
}

// Kullanıcının workspace'lerini getirme
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    console.log("Getting workspaces for user:", userId)
    const db = await getMongoDb()

    // Kullanıcının kendi workspace'leri
    const ownWorkspaces = await db
      .collection("workspaces")
      .find({ ownerId: new ObjectId(userId) })
      .toArray()

    // Kullanıcı bilgilerini al
    const user = await getUserById(userId)
    if (!user) {
      return ownWorkspaces as Workspace[]
    }

    // Kullanıcıyla paylaşılan workspace'ler
    const sharedWorkspaces = await db
      .collection("workspaceShares")
      .find({
        sharedWithEmail: user.email,
        status: "accepted",
      })
      .toArray()

    // Paylaşılan workspace ID'lerini al
    const sharedWorkspaceIds = sharedWorkspaces.map((share) => share.workspaceId)

    // Paylaşılan workspace'lerin detaylarını getir
    const sharedWorkspaceDetails =
      sharedWorkspaceIds.length > 0
        ? await db
            .collection("workspaces")
            .find({ _id: { $in: sharedWorkspaceIds } })
            .toArray()
        : []

    // Tüm workspace'leri birleştir
    return [...ownWorkspaces, ...sharedWorkspaceDetails] as Workspace[]
  } catch (error) {
    console.error("Error getting user workspaces:", error)
    return []
  }
}

// Workspace oluşturma
export async function createWorkspace(workspaceData: Omit<Workspace, "_id">): Promise<Workspace | null> {
  try {
    console.log("Creating workspace:", workspaceData.name)
    const collection = await getCollection<Workspace>("workspaces")
    const result = await collection.insertOne({
      ...workspaceData,
      createdAt: new Date(),
    })

    const newWorkspace = await collection.findOne({ _id: result.insertedId })
    return newWorkspace as Workspace
  } catch (error) {
    console.error("Error creating workspace:", error)
    return null
  }
}

// Workspace paylaşımı
export async function shareWorkspace(
  workspaceId: string,
  sharedByUserId: string,
  sharedWithEmail: string,
  accessLevel: "view" | "edit" | "admin",
): Promise<WorkspaceShare | null> {
  try {
    console.log("Sharing workspace:", workspaceId, "with:", sharedWithEmail)
    const db = await getMongoDb()

    // Workspace'in var olduğunu kontrol et
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })

    if (!workspace) {
      console.log("Workspace not found:", workspaceId)
      return null
    }

    // Paylaşım yapan kullanıcının workspace sahibi olduğunu kontrol et
    if (workspace.ownerId.toString() !== sharedByUserId) {
      console.log("User is not the owner of the workspace:", sharedByUserId)
      return null
    }

    // Zaten paylaşılmış mı kontrol et
    const existingShare = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail,
    })

    if (existingShare) {
      // Erişim seviyesini güncelle
      await db.collection("workspaceShares").updateOne(
        { _id: existingShare._id },
        {
          $set: {
            accessLevel,
            updatedAt: new Date(),
          },
        },
      )

      const updatedShare = await db.collection("workspaceShares").findOne({ _id: existingShare._id })

      return updatedShare as WorkspaceShare
    }

    // Yeni paylaşım oluştur
    const workspaceShare: WorkspaceShare = {
      workspaceId: new ObjectId(workspaceId),
      sharedByUserId: new ObjectId(sharedByUserId),
      sharedWithEmail,
      accessLevel,
      status: "pending",
      createdAt: new Date(),
    }

    const result = await db.collection("workspaceShares").insertOne(workspaceShare)

    // Paylaşım yapan kullanıcıyı bul
    const sharingUser = await getUserById(sharedByUserId)

    // Bildirim oluştur
    const notification: Notification = {
      recipientEmail: sharedWithEmail,
      type: "workspace_invitation",
      content: `${sharingUser?.name || "Bir kullanıcı"} sizinle "${workspace.name}" çalışma alanını paylaştı.`,
      link: `/app`,
      metadata: {
        workspaceId: workspaceId,
        senderId: sharedByUserId,
        senderName: sharingUser?.name,
      },
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    const newShare = await db.collection("workspaceShares").findOne({ _id: result.insertedId })

    return newShare as WorkspaceShare
  } catch (error) {
    console.error("Error sharing workspace:", error)
    return null
  }
}

// Workspace paylaşım davetini kabul etme
export async function acceptWorkspaceInvitation(shareId: string, userId: string): Promise<boolean> {
  try {
    console.log("Accepting workspace invitation:", shareId)
    const db = await getMongoDb()

    // Paylaşımı bul
    const share = await db.collection("workspaceShares").findOne({ _id: new ObjectId(shareId) })

    if (!share) {
      console.log("Workspace share not found:", shareId)
      return false
    }

    // Kullanıcıyı bul
    const user = await getUserById(userId)
    if (!user) {
      console.log("User not found:", userId)
      return false
    }

    // Kullanıcının bu daveti kabul etme yetkisi var mı kontrol et
    if (user.email !== share.sharedWithEmail) {
      console.log("User is not the recipient of the invitation:", userId)
      return false
    }

    // Paylaşım durumunu güncelle
    await db.collection("workspaceShares").updateOne(
      { _id: new ObjectId(shareId) },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      },
    )

    return true
  } catch (error) {
    console.error("Error accepting workspace invitation:", error)
    return false
  }
}

// Workspace'e göre sayfaları getirme
export async function getWorkspacePages(workspaceId: string): Promise<Page[]> {
  try {
    console.log("Getting pages for workspace:", workspaceId)
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ workspaceId: new ObjectId(workspaceId) }).toArray()

    return pages as Page[]
  } catch (error) {
    console.error("Error getting workspace pages:", error)
    return []
  }
}

// Workspace erişim kontrolü
export async function checkWorkspaceAccess(
  workspaceId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "admin" | "edit" | "view" }> {
  try {
    console.log("Checking workspace access for:", userIdOrEmail)
    const db = await getMongoDb()

    // Workspace bilgilerini getir
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })

    if (!workspace) {
      return { hasAccess: false }
    }

    // Kullanıcı workspace'in sahibi mi kontrol et
    if (workspace.ownerId.toString() === userIdOrEmail) {
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
    const share = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail: userEmail,
      status: "accepted",
    })

    if (share) {
      return { hasAccess: true, accessLevel: share.accessLevel as "admin" | "edit" | "view" }
    }

    return { hasAccess: false }
  } catch (error) {
    console.error("Error checking workspace access:", error)
    return { hasAccess: false }
  }
}

// Kullanıcı oluşturma fonksiyonunu güncelle
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    console.log("Creating user:", userData.email)
    const collection = await getCollection<User>("users")

    // E-posta adresinin zaten kullanımda olup olmadığını kontrol et
    try {
      const existingUser = await collection.findOne({ email: userData.email })
      if (existingUser) {
        console.log("Email already in use:", userData.email)
        return null // E-posta zaten kullanımda
      }
    } catch (error) {
      console.error("Error checking existing user:", error)
      // Hata durumunda devam et, kullanıcı oluşturmayı dene
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Kullanıcıyı oluştur
    try {
      const result = await collection.insertOne({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Oluşturulan kullanıcıyı döndür (şifre hariç)
      const newUser = await collection.findOne({ _id: result.insertedId })
      if (!newUser) return null

      // Kullanıcı için varsayılan workspace oluştur
      const workspace = await createDefaultWorkspace(result.insertedId.toString(), userData.name)

      // Varsayılan workspace için varsayılan sayfa oluştur
      if (workspace) {
        await createPage({
          title: "Ana Sayfa",
          content: "Hoş geldiniz! Bu sizin ana sayfanızdır. Buraya önemli notlar ekleyebilirsiniz.",
          tags: ["home", "important"],
          isFavorite: true,
          userId: result.insertedId,
          workspaceId: workspace._id as ObjectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Şifreyi çıkar ve kullanıcıyı döndür
      const { password, ...userWithoutPassword } = newUser as User
      return userWithoutPassword as User
    } catch (insertError) {
      console.error("Error inserting new user:", insertError)
      return null
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return null // Hata durumunda null döndür
  }
}

// Sayfa paylaşım fonksiyonunu güncelle
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
    const sharingUser = await getUserById(sharedByUserId)

    // Workspace bilgilerini getir
    const workspace = await db.collection("workspaces").findOne({ _id: page.workspaceId })

    // Bildirim oluştur
    const notification: Notification = {
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

    // Aynı zamanda workspace'i de paylaş
    if (workspace && workspace.ownerId.toString() === sharedByUserId) {
      // Workspace sahibiyse, workspace'i de paylaş
      await shareWorkspace(
        workspace._id.toString(),
        sharedByUserId,
        sharedWithEmail,
        accessLevel === "edit" ? "edit" : "view",
      )
    }

    const newShare = await db.collection("pageShares").findOne({ _id: result.insertedId })

    return newShare as PageShare
  } catch (error) {
    console.error("Error sharing page:", error)
    return null
  }
}

// Tüm fonksiyonları ilgili modüllerden export edelim
export * from "./users"
export * from "./pages"
export * from "./workspaces"
