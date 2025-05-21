import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getWorkspacePages, checkWorkspaceAccess } from "@/lib/workspaces"

// Workspace sayfalarını getir
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
      return NextResponse.json({ success: false, message: "Bu çalışma alanına erişim yetkiniz yok" }, { status: 403 })
    }

    // Workspace sayfalarını getir
    const pages = await getWorkspacePages(workspaceId, userId)

    return NextResponse.json({
      success: true,
      pages: pages.map((page) => ({
        ...page,
        _id: page._id.toString(),
        userId: page.userId.toString(),
        workspaceId: page.workspaceId.toString(),
        createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
        updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Workspace sayfalarını getirme hatası:", error)
    return NextResponse.json(
      { success: false, message: "Workspace sayfaları getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}
