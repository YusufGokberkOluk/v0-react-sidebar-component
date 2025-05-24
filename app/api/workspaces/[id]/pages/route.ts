import { type NextRequest, NextResponse } from "next/server"
import { getWorkspacePages, checkWorkspaceAccess } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Workspace'e ait sayfaları getir
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = params.id

    // Kullanıcının workspace'e erişim yetkisi var mı kontrol et
    const accessResult = await checkWorkspaceAccess(workspaceId, authResult.userId)
    if (!accessResult.hasAccess) {
      return NextResponse.json({ success: false, message: "Bu workspace'e erişim izniniz yok" }, { status: 403 })
    }

    // Workspace'e ait sayfaları getir
    const pages = await getWorkspacePages(workspaceId)

    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error getting workspace pages:", error)
    return NextResponse.json(
      { success: false, message: "Workspace sayfaları getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}
