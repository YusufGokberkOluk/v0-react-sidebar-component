import { ObjectId } from "mongodb"
import { getMongoDb } from "./mongodb"
import type { WorkspaceShare } from "./db-types"

// Paylaşılan sayfa için workspace'i kullanıcıya ekle
export async function addSharedPageWorkspaceToUser(
  pageId: string,
  workspaceId: string,
  userEmail: string,
): Promise<boolean> {
  try {
    console.log("Adding shared page workspace to user:", userEmail)
    const db = await getMongoDb()

    // Zaten paylaşılmış mı kontrol et
    const existingShare = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail: userEmail,
    })

    if (existingShare) {
      // Zaten paylaşılmış, güncelleme yapmaya gerek yok
      return true
    }

    // Workspace bilgilerini getir
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })
    if (!workspace) {
      return false
    }

    // Workspace sahibini bul
    const owner = await db.collection("users").findOne({ _id: workspace.ownerId })
    if (!owner) {
      return false
    }

    // Yeni paylaşım oluştur - sadece görüntüleme izni ver
    const workspaceShare: WorkspaceShare = {
      workspaceId: new ObjectId(workspaceId),
      sharedByUserId: workspace.ownerId,
      sharedWithEmail: userEmail,
      accessLevel: "view", // Sadece görüntüleme izni
      status: "accepted", // Otomatik kabul et
      createdAt: new Date(),
    }

    await db.collection("workspaceShares").insertOne(workspaceShare)

    return true
  } catch (error) {
    console.error("Error adding shared page workspace to user:", error)
    return false
  }
}
