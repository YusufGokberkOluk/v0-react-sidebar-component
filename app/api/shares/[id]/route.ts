import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { addSharedPageWorkspaceToUser } from "@/lib/workspaces"

// Paylaşım davetini kabul et
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const shareId = params.id
    const db = await getMongoDb()

    // Paylaşımı bul
    const share = await db.collection("pageShares").findOne({
      _id: new ObjectId(shareId),
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Paylaşım bulunamadı" }, { status: 404 })
    }

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu daveti kabul etme yetkisi var mı kontrol et
    if (user.email !== share.sharedWithEmail) {
      return NextResponse.json(
        { success: false, message: "Bu paylaşım davetini kabul etme yetkiniz yok" },
        { status: 403 },
      )
    }

    // Paylaşım durumunu güncelle
    await db.collection("pageShares").updateOne(
      { _id: new ObjectId(shareId) },
      {
        $set: {
          status: "accepted",
          updatedAt: new Date(),
        },
      },
    )

    // Sayfayı bul
    const page = await db.collection("pages").findOne({
      _id: share.pageId,
    })

    if (page && page.workspaceId) {
      // Paylaşılan sayfanın workspace'ini kullanıcının workspace listesine ekle
      await addSharedPageWorkspaceToUser(page._id.toString(), page.workspaceId.toString(), user.email)
    }

    return NextResponse.json({
      success: true,
      message: "Paylaşım daveti başarıyla kabul edildi",
    })
  } catch (error) {
    console.error("Paylaşım davetini kabul etme hatası:", error)
    return NextResponse.json(
      { success: false, message: "Paylaşım daveti kabul edilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

// Paylaşım davetini reddet
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const shareId = params.id
    const db = await getMongoDb()

    // Paylaşımı bul
    const share = await db.collection("pageShares").findOne({
      _id: new ObjectId(shareId),
    })

    if (!share) {
      return NextResponse.json({ success: false, message: "Paylaşım bulunamadı" }, { status: 404 })
    }

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu daveti reddetme yetkisi var mı kontrol et
    if (user.email !== share.sharedWithEmail && share.sharedByUserId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Bu paylaşım davetini reddetme yetkiniz yok" },
        { status: 403 },
      )
    }

    // Paylaşımı sil
    await db.collection("pageShares").deleteOne({ _id: new ObjectId(shareId) })

    return NextResponse.json({
      success: true,
      message: "Paylaşım daveti başarıyla reddedildi",
    })
  } catch (error) {
    console.error("Paylaşım davetini reddetme hatası:", error)
    return NextResponse.json(
      { success: false, message: "Paylaşım daveti reddedilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}
