import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getWorkspacePages, checkWorkspaceAccess } from "@/lib/db"

// Workspace'in sayfalarını getir
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = params.id

    // Workspace erişim kontrolü
    const access = await checkWorkspaceAccess(workspaceId, userId)
    if (!access.hasAccess) {
      return NextResponse.json({ success: false, message: "Bu workspace'e erişim yetkiniz yok" }, { status: 403 })
    }

    // Workspace'in sayfalarını getir
    const pages = await getWorkspacePages(workspaceId)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error fetching workspace pages:", error)
    return NextResponse.json(
      { success: false, message: "Workspace sayfaları getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}
