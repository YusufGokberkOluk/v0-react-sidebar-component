import { type NextRequest, NextResponse } from "next/server"
import { getPageById, updatePage, deletePage } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Belirli bir sayfayı güncelle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id

    // Sayfanın var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const existingPage = await getPageById(pageId)
    if (!existingPage) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    if (existingPage.userId.toString() !== userId) {
      return NextResponse.json({ success: false, message: "Bu sayfayı düzenleme yetkiniz yok" }, { status: 403 })
    }

    // İstek gövdesini al
    const updateData = await req.json()

    // Sayfayı güncelle
    const updatedPage = await updatePage(pageId, updateData)

    if (!updatedPage) {
      return NextResponse.json({ success: false, message: "Sayfa güncellenemedi" }, { status: 500 })
    }

    return NextResponse.json({ success: true, page: updatedPage })
  } catch (error) {
    console.error("Error updating page:", error)
    return NextResponse.json({ success: false, message: "Sayfa güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

// Belirli bir sayfayı sil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id

    // Sayfanın var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const existingPage = await getPageById(pageId)
    if (!existingPage) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    if (existingPage.userId.toString() !== userId) {
      return NextResponse.json({ success: false, message: "Bu sayfayı silme yetkiniz yok" }, { status: 403 })
    }

    // Sayfayı sil
    const success = await deletePage(pageId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Sayfa silinemedi" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Sayfa başarıyla silindi" })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ success: false, message: "Sayfa silinirken bir hata oluştu" }, { status: 500 })
  }
}
