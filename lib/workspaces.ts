import { ObjectId } from "mongodb"
import { getMongoDb, getCollection } from "./mongodb"
import type { Workspace, WorkspaceShare, Notification, Page } from "./db-types"
import { getUserById } from "./users"

// Kullanıcı için varsayılan workspace oluşturma
export async function createDefaultWorkspace(userId: string, userName?: string): Promise<Workspace | null> {
  try {
    console.log("Creating default workspace for user:", userId)
    const collection = await getCollection<Workspace>("workspaces")

    // Kullanıcı adına göre workspace adı oluştur - "Kullanıcı's Etude" formatında
    let workspaceName = "Etude"
    if (userName) {
      workspaceName = `${userName}'s Etude`
    } else {
      // Kullanıcı adı yoksa, e-posta adresinden al
      const user = await getUserById(userId)
      if (user && user.email) {
        const username = user.email.split("@")[0]
        const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1)
        workspaceName = `${formattedUsername}'s Etude`
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
export async function getWorkspacePages(workspaceId: string, userId: string): Promise<Page[]> {
  try {
    console.log("Getting pages for workspace:", workspaceId)
    const db = await getMongoDb()

    // Workspace'i bul
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })

    if (!workspace) {
      console.log("Workspace not found:", workspaceId)
      return []
    }

    // Kullanıcı workspace'in sahibi mi?
    const isOwner = workspace.ownerId.toString() === userId

    if (isOwner) {
      // Kullanıcı workspace'in sahibiyse, tüm sayfaları getir
      const pages = await db
        .collection("pages")
        .find({ workspaceId: new ObjectId(workspaceId) })
        .toArray()
      return pages as Page[]
    } else {
      // Kullanıcı workspace'in sahibi değilse, sadece paylaşılan sayfaları getir

      // Kullanıcının e-posta adresini al
      const user = await getUserById(userId)
      if (!user) {
        return []
      }

      // Kullanıcıyla paylaşılan sayfa ID'lerini bul
      const sharedPages = await db
        .collection("pageShares")
        .find({
          sharedWithEmail: user.email,
          status: "accepted",
          workspaceId: new ObjectId(workspaceId),
        })
        .toArray()

      const sharedPageIds = sharedPages.map((share) => share.pageId)

      if (sharedPageIds.length === 0) {
        return []
      }

      // Paylaşılan sayfaları getir
      const pages = await db
        .collection("pages")
        .find({
          _id: { $in: sharedPageIds },
        })
        .toArray()

      return pages as Page[]
    }
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

// Paylaşılan bir sayfanın workspace'ini kullanıcının workspace listesine ekle
export async function addSharedPageWorkspaceToUser(
  pageId: string,
  workspaceId: string,
  userEmail: string,
): Promise<boolean> {
  try {
    console.log("Adding shared page workspace to user:", userEmail)
    const db = await getMongoDb()

    // Workspace'i kontrol et
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })

    if (!workspace) {
      console.log("Workspace not found:", workspaceId)
      return false
    }

    // Sayfa paylaşımını kontrol et
    const pageShare = await db.collection("pageShares").findOne({
      pageId: new ObjectId(pageId),
      sharedWithEmail: userEmail,
      status: "accepted",
    })

    if (!pageShare) {
      console.log("Page share not found for user:", userEmail)
      return false
    }

    // Workspace zaten paylaşılmış mı kontrol et
    const existingWorkspaceShare = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail: userEmail,
    })

    if (existingWorkspaceShare) {
      // Zaten paylaşılmışsa, durumu güncelle
      if (existingWorkspaceShare.status !== "accepted") {
        await db.collection("workspaceShares").updateOne(
          { _id: existingWorkspaceShare._id },
          {
            $set: {
              status: "accepted",
              updatedAt: new Date(),
            },
          },
        )
      }
      return true
    }

    // Workspace'i kullanıcıyla paylaş
    const workspaceShare: WorkspaceShare = {
      workspaceId: new ObjectId(workspaceId),
      sharedByUserId: workspace.ownerId,
      sharedWithEmail: userEmail,
      accessLevel: "view", // Sadece görüntüleme izni ver
      status: "accepted", // Otomatik olarak kabul edilmiş
      createdAt: new Date(),
      sharedPageIds: [new ObjectId(pageId)], // Sadece paylaşılan sayfa
    }

    await db.collection("workspaceShares").insertOne(workspaceShare)

    return true
  } catch (error) {
    console.error("Error adding shared page workspace to user:", error)
    return false
  }
}

// Paylaşılan bir sayfayı workspace paylaşımına ekle
export async function addPageToWorkspaceShare(
  pageId: string,
  workspaceId: string,
  userEmail: string,
): Promise<boolean> {
  try {
    console.log("Adding page to workspace share:", pageId)
    const db = await getMongoDb()

    // Workspace paylaşımını bul
    const workspaceShare = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail: userEmail,
    })

    if (!workspaceShare) {
      console.log("Workspace share not found")
      return false
    }

    // Sayfa ID'sini ekle
    const sharedPageIds = workspaceShare.sharedPageIds || []
    const pageObjectId = new ObjectId(pageId)

    // Sayfa zaten eklenmiş mi kontrol et
    if (sharedPageIds.some((id) => id.toString() === pageObjectId.toString())) {
      return true
    }

    // Sayfa ID'sini ekle
    await db.collection("workspaceShares").updateOne(
      { _id: workspaceShare._id },
      {
        $set: {
          updatedAt: new Date(),
        },
        $push: {
          sharedPageIds: pageObjectId,
        },
      },
    )

    return true
  } catch (error) {
    console.error("Error adding page to workspace share:", error)
    return false
  }
}
