import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { acceptWorkspaceInvitation } from "@/lib/db"

// Workspace davetini kabul et
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const invitationId = params.id
    const { status } = await req.json()

    if (!status || (status !== "accepted" && status !== "rejected")) {
      return NextResponse.json(
        { success: false, message: "Geçerli bir durum belirtmelisiniz (accepted/rejected)" },
        { status: 400 },
      )
    }

    // Daveti kabul et veya reddet
    const success = await acceptWorkspaceInvitation(invitationId, userId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Davet işlenemedi" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: status === "accepted" ? "Davet kabul edildi" : "Davet reddedildi",
    })
  } catch (error) {
    console.error("Error processing workspace invitation:", error)
    return NextResponse.json({ success: false, message: "Davet işlenirken bir hata oluştu" }, { status: 500 })
  }
}
