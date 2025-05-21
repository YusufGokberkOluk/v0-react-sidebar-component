import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { shareWorkspace, checkWorkspaceAccess } from "@/lib/db"

// Workspace paylaşım API'si
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = params.id
    const { email, accessLevel } = await req.json()

    if (!email || !accessLevel) {
      return NextResponse.json({ success: false, message: "Email ve erişim seviyesi gereklidir" }, { status: 400 })
    }

    // Geçerli bir erişim seviyesi mi kontrol et
    if (accessLevel !== "view" && accessLevel !== "edit" && accessLevel !== "admin") {
      return NextResponse.json({ success: false, message: "Geçersiz erişim seviyesi" }, { status: 400 })
    }

    // Workspace erişim kontrolü
    const access = await checkWorkspaceAccess(workspaceId, userId)
    if (!access.hasAccess || access.accessLevel !== "owner") {
      return NextResponse.json({ success: false, message: "Bu workspace'i paylaşma yetkiniz yok" }, { status: 403 })
    }

    // Workspace'i paylaş
    const share = await shareWorkspace(workspaceId, userId, email, accessLevel)

    if (!share) {
      return NextResponse.json({ success: false, message: "Workspace paylaşılamadı" }, { status: 500 })
    }

    return NextResponse.json({ success: true, share }, { status: 201 })
  } catch (error) {
    console.error("Error sharing workspace:", error)
    return NextResponse.json({ success: false, message: "Workspace paylaşılırken bir hata oluştu" }, { status: 500 })
  }
}
