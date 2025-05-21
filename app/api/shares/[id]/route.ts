import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Paylaşım davetini kabul et/reddet
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const shareId = params.id
    const { status } = await req.json()

    if (!status || (status !== "accepted" && status !== "rejected")) {
      return NextResponse.json(
        { success: false, message: "Geçerli bir durum belirtmelisiniz (accepted/rejected)" },
        { status: 400 },
      )
    }

    const db = await getMongoDb()

    // Paylaşımın var olduğunu kontrol et
    const share = await db.collection("pageShares").findOne({
      _id: new ObjectId(shareId),
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Paylaşım bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu paylaşımı kabul etme/reddetme yetkisi var mı kontrol et
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!currentUser || currentUser.email !== share.sharedWithEmail) {
      return NextResponse.json(
        { success: false, message: "Bu paylaşımı kabul etme/reddetme yetkiniz yok" },
        { status: 403 },
      )
    }

    // Paylaşım durumunu güncelle
    await db.collection("pageShares").updateOne(
      { _id: new ObjectId(shareId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: status === "accepted" ? "Paylaşım kabul edildi" : "Paylaşım reddedildi",
    })
  } catch (error) {
    console.error("Paylaşım güncelleme hatası:", error)
    return NextResponse.json({ success: false, message: "Paylaşım güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

// Paylaşımı sil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const shareId = params.id
    const db = await getMongoDb()

    // Paylaşımın var olduğunu kontrol et
    const share = await db.collection("pageShares").findOne({
      _id: new ObjectId(shareId),
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Paylaşım bulunamadı" }, { status: 404 })
    }

    // Sayfanın sahibi mi kontrol et
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(share.pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    const isOwner = page.userId.toString() === userId
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const isRecipient = currentUser && currentUser.email === share.sharedWithEmail

    if (!isOwner && !isRecipient) {
      return NextResponse.json({ success: false, message: "Bu paylaşımı silme yetkiniz yok" }, { status: 403 })
    }

    // Paylaşımı sil
    await db.collection("pageShares").deleteOne({ _id: new ObjectId(shareId) })

    return NextResponse.json({
      success: true,
      message: "Paylaşım başarıyla silindi",
    })
  } catch (error) {
    console.error("Paylaşım silme hatası:", error)
    return NextResponse.json({ success: false, message: "Paylaşım silinirken bir hata oluştu" }, { status: 500 })
  }
}
