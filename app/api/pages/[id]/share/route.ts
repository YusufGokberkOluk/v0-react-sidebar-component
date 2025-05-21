import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getUserByEmail } from "@/lib/db"
import { addSharedPageWorkspaceToUser } from "@/lib/workspaces"
import type { PageShare, Notification } from "@/lib/db-types"

// Sayfa paylaşım API'si
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id
    const { email, accessLevel } = await req.json()

    if (!email || !accessLevel) {
      return NextResponse.json({ success: false, message: "Email ve erişim seviyesi gereklidir" }, { status: 400 })
    }

    // Geçerli bir erişim seviyesi mi kontrol et
    if (accessLevel !== "view" && accessLevel !== "edit") {
      return NextResponse.json({ success: false, message: "Geçersiz erişim seviyesi" }, { status: 400 })
    }

    const db = await getMongoDb()

    // Sayfanın var olduğunu ve kullanıcıya ait olduğunu kontrol et
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Sayfanın sahibi mi kontrol et
    if (page.userId.toString() !== userId) {
      // Sayfanın sahibi değilse, paylaşım yetkisi var mı kontrol et
      const sharePermission = await db.collection("pageShares").findOne({
        pageId: new ObjectId(pageId),
        sharedWithEmail: email,
        accessLevel: "edit",
        status: "accepted",
      })

      if (!sharePermission) {
        return NextResponse.json({ success: false, message: "Bu sayfayı paylaşma yetkiniz yok" }, { status: 403 })
      }
    }

    // Kullanıcının kendisiyle paylaşmasını engelle
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (currentUser && currentUser.email === email) {
      return NextResponse.json({ success: false, message: "Sayfayı kendinizle paylaşamazsınız" }, { status: 400 })
    }

    // Zaten paylaşılmış mı kontrol et
    const existingShare = await db.collection("pageShares").findOne({
      pageId: new ObjectId(pageId),
      sharedWithEmail: email,
    })

    if (existingShare) {
      // Erişim seviyesini güncelle
      await db.collection("pageShares").updateOne(
        { _id: existingShare._id },
        {
          $set: {
            accessLevel,
            updatedAt: new Date(),
          },
        },
      )

      return NextResponse.json({
        success: true,
        message: "Paylaşım erişim seviyesi güncellendi",
        share: {
          ...existingShare,
          accessLevel,
        },
      })
    }

    // Yeni paylaşım oluştur
    const newShare: PageShare = {
      pageId: new ObjectId(pageId),
      sharedByUserId: new ObjectId(userId),
      sharedWithEmail: email,
      accessLevel,
      status: "pending",
      createdAt: new Date(),
      workspaceId: page.workspaceId, // Workspace ID'sini ekle
    }

    const result = await db.collection("pageShares").insertOne(newShare)

    // Bildirim oluştur
    const notification: Notification = {
      recipientEmail: email,
      type: "share_invitation",
      content: `${currentUser?.name || "Bir kullanıcı"} sizinle "${page.title}" sayfasını paylaştı.`,
      link: `/app?page=${pageId}`,
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    // Davet edilen kullanıcı sistemde kayıtlı mı kontrol et
    const invitedUser = await getUserByEmail(email)

    // Paylaşılan sayfanın workspace'ini kullanıcının workspace listesine ekle
    if (invitedUser) {
      await addSharedPageWorkspaceToUser(pageId, page.workspaceId.toString(), email)
    }

    // E-posta gönderme işlemi burada yapılabilir (gerçek uygulamada)
    // Bu örnekte sadece simüle ediyoruz
    console.log(`E-posta gönderildi: ${email} kullanıcısı "${page.title}" sayfasına davet edildi.`)

    return NextResponse.json({
      success: true,
      message: "Sayfa başarıyla paylaşıldı",
      share: {
        _id: result.insertedId,
        ...newShare,
      },
    })
  } catch (error) {
    console.error("Sayfa paylaşım hatası:", error)
    return NextResponse.json({ success: false, message: "Sayfa paylaşılırken bir hata oluştu" }, { status: 500 })
  }
}

// Sayfa paylaşımlarını getir
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const pageId = params.id
    const db = await getMongoDb()

    // Sayfanın var olduğunu kontrol et
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Sayfanın sahibi mi veya paylaşım yetkisi var mı kontrol et
    const isOwner = page.userId.toString() === userId

    if (!isOwner) {
      const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })

      if (!currentUser) {
        return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
      }

      const hasAccess = await db.collection("pageShares").findOne({
        pageId: new ObjectId(pageId),
        sharedWithEmail: currentUser.email,
        status: "accepted",
      })

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: "Bu sayfanın paylaşımlarını görüntüleme yetkiniz yok" },
          { status: 403 },
        )
      }
    }

    // Sayfa paylaşımlarını getir
    const shares = await db
      .collection("pageShares")
      .find({ pageId: new ObjectId(pageId) })
      .toArray()

    return NextResponse.json({
      success: true,
      shares: shares.map((share) => ({
        ...share,
        _id: share._id.toString(),
        pageId: share.pageId.toString(),
        sharedByUserId: share.sharedByUserId.toString(),
        workspaceId: share.workspaceId ? share.workspaceId.toString() : undefined,
      })),
    })
  } catch (error) {
    console.error("Paylaşımları getirme hatası:", error)
    return NextResponse.json({ success: false, message: "Paylaşımlar getirilirken bir hata oluştu" }, { status: 500 })
  }
}
