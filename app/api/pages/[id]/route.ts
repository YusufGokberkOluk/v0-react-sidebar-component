import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getPageById, updatePage, deletePage, checkPageAccess } from "@/lib/db"
import { getCache, setCache, deleteCache } from "@/lib/redis"

// Belirli bir sayfayı getir
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id
    const cacheKey = `page:${pageId}`
    const cachedPage = await getCache(cacheKey)

    if (cachedPage) {
      return NextResponse.json({ success: true, page: cachedPage, accessLevel: cachedPage.accessLevel })
    }

    // Sayfanın var olduğunu kontrol et
    const page = await getPageById(pageId)
    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Erişim kontrolü
    const access = await checkPageAccess(pageId, userId)
    if (!access.hasAccess) {
      return NextResponse.json({ success: false, message: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 })
    }

    await setCache(cacheKey, { ...page, accessLevel: access.accessLevel }, 600) // 10 minutes cache

    return NextResponse.json({ success: true, page, accessLevel: access.accessLevel })
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json({ success: false, message: "Sayfa getirilirken bir hata oluştu" }, { status: 500 })
  }
}

// Belirli bir sayfayı güncelle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id

    // Erişim kontrolü
    const access = await checkPageAccess(pageId, userId)
    if (!access.hasAccess) {
      return NextResponse.json({ success: false, message: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 })
    }

    // Düzenleme yetkisi kontrolü
    if (access.accessLevel !== "owner" && access.accessLevel !== "edit") {
      return NextResponse.json({ success: false, message: "Bu sayfayı düzenleme yetkiniz yok" }, { status: 403 })
    }

    // İstek gövdesini al
    const updateData = await req.json()

    // Sayfayı güncelle
    const updatedPage = await updatePage(pageId, updateData)

    if (!updatedPage) {
      return NextResponse.json({ success: false, message: "Sayfa güncellenemedi" }, { status: 500 })
    }

    await deleteCache(`page:${pageId}`)
    await deleteCache(`user_pages:${userId}`)

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

    // Erişim kontrolü
    const access = await checkPageAccess(pageId, userId)
    if (!access.hasAccess || access.accessLevel !== "owner") {
      return NextResponse.json({ success: false, message: "Bu sayfayı silme yetkiniz yok" }, { status: 403 })
    }

    // Sayfayı sil
    const success = await deletePage(pageId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Sayfa silinemedi" }, { status: 500 })
    }

    await deleteCache(`page:${pageId}`)
    await deleteCache(`user_pages:${userId}`)

    return NextResponse.json({ success: true, message: "Sayfa başarıyla silindi" })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ success: false, message: "Sayfa silinirken bir hata oluştu" }, { status: 500 })
  }
}
