import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { getUserByEmail } from "@/lib/db"

// Kullanıcının workspace davetlerini getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await getUserByEmail(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bekleyen workspace davetlerini getir
    const invitations = await db
      .collection("workspaceShares")
      .find({
        sharedWithEmail: user.email,
        status: "pending",
      })
      .toArray()

    // Workspace bilgilerini getir
    const workspaceIds = invitations.map((invitation) => invitation.workspaceId)
    const workspaces =
      workspaceIds.length > 0
        ? await db
            .collection("workspaces")
            .find({ _id: { $in: workspaceIds } })
            .toArray()
        : []

    // Davet eden kullanıcıların bilgilerini getir
    const userIds = invitations.map((invitation) => invitation.sharedByUserId)
    const users =
      userIds.length > 0
        ? await db
            .collection("users")
            .find({ _id: { $in: userIds } })
            .project({ _id: 1, name: 1, email: 1 })
            .toArray()
        : []

    // Davetleri zenginleştir
    const enrichedInvitations = invitations.map((invitation) => {
      const workspace = workspaces.find((w) => w._id.toString() === invitation.workspaceId.toString())
      const user = users.find((u) => u._id.toString() === invitation.sharedByUserId.toString())

      return {
        ...invitation,
        _id: invitation._id.toString(),
        workspaceId: invitation.workspaceId.toString(),
        sharedByUserId: invitation.sharedByUserId.toString(),
        workspace: workspace
          ? {
              _id: workspace._id.toString(),
              name: workspace.name,
            }
          : null,
        sharedBy: user
          ? {
              _id: user._id.toString(),
              name: user.name,
              email: user.email,
            }
          : null,
      }
    })

    return NextResponse.json({ success: true, invitations: enrichedInvitations })
  } catch (error) {
    console.error("Error fetching workspace invitations:", error)
    return NextResponse.json(
      { success: false, message: "Workspace davetleri getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}
