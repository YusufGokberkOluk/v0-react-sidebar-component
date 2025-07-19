import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Davet bilgilerini getir
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    const db = await getMongoDb()

    // Token ile paylaşımı bul
    const share = await db.collection("pageShares").findOne({
      inviteToken: token,
      status: "pending",
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Geçersiz veya süresi dolmuş davet linki" }, { status: 404 })
    }

    // Sayfa bilgilerini getir
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(share.pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Paylaşan kullanıcı bilgilerini getir
    const sharedByUser = await db.collection("users").findOne({
      _id: new ObjectId(share.sharedByUserId),
    })

    return NextResponse.json({
      success: true,
      invite: {
        pageTitle: page.title,
        sharedByName: sharedByUser?.name || sharedByUser?.email || "Bilinmeyen kullanıcı",
        sharedWithEmail: share.sharedWithEmail,
        accessLevel: share.accessLevel,
        createdAt: share.createdAt,
      },
    })
  } catch (error) {
    console.error("Davet bilgilerini getirme hatası:", error)
    return NextResponse.json(
      { success: false, message: "Davet bilgileri getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

// Daveti kabul et
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    const token = params.token
    const db = await getMongoDb()

    // Mevcut kullanıcıyı getir
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Token ile paylaşımı bul
    const share = await db.collection("pageShares").findOne({
      inviteToken: token,
      status: "pending",
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Geçersiz veya süresi dolmuş davet linki" }, { status: 404 })
    }

    // Davet edilen e-posta ile giriş yapan kullanıcının e-postası eşleşiyor mu?
    if (share.sharedWithEmail !== currentUser.email) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu davet ${share.sharedWithEmail} adresine gönderilmiş. Lütfen doğru hesapla giriş yapın.`,
        },
        { status: 403 },
      )
    }

    // Sayfa bilgilerini getir
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(share.pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Paylaşımı kabul et
    await db.collection("pageShares").updateOne(
      { _id: share._id },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Davet başarıyla kabul edildi",
      pageId: share.pageId.toString(),
      pageTitle: page.title,
      accessLevel: share.accessLevel,
    })
  } catch (error) {
    console.error("Davet kabul etme hatası:", error)
    return NextResponse.json({ success: false, message: "Davet kabul edilirken bir hata oluştu" }, { status: 500 })
  }
}

// Daveti reddet
export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Giriş yapmanız gerekiyor" }, { status: 401 })
    }

    const token = params.token
    const db = await getMongoDb()

    // Mevcut kullanıcıyı getir
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Token ile paylaşımı bul
    const share = await db.collection("pageShares").findOne({
      inviteToken: token,
      status: "pending",
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Geçersiz veya süresi dolmuş davet linki" }, { status: 404 })
    }

    // Davet edilen e-posta ile giriş yapan kullanıcının e-postası eşleşiyor mu?
    if (share.sharedWithEmail !== currentUser.email) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu davet ${share.sharedWithEmail} adresine gönderilmiş. Lütfen doğru hesapla giriş yapın.`,
        },
        { status: 403 },
      )
    }

    // Paylaşımı reddet
    await db.collection("pageShares").updateOne(
      { _id: share._id },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Davet reddedildi",
    })
  } catch (error) {
    console.error("Davet reddetme hatası:", error)
    return NextResponse.json({ success: false, message: "Davet reddedilirken bir hata oluştu" }, { status: 500 })
  }
}
