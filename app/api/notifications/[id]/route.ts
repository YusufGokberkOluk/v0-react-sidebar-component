import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Bildirimi okundu olarak işaretle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id
    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Bildirimi bul
    const notification = await db.collection("notifications").findOne({
      _id: new ObjectId(notificationId),
    })

    if (!notification) {
      return NextResponse.json({ success: false, message: "Bildirim bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu bildirimi işaretleme yetkisi var mı kontrol et
    if (
      notification.userId &&
      notification.userId.toString() !== userId &&
      notification.recipientEmail !== user.email
    ) {
      return NextResponse.json({ success: false, message: "Bu bildirimi işaretleme yetkiniz yok" }, { status: 403 })
    }

    // Bildirimi okundu olarak işaretle
    await db.collection("notifications").updateOne({ _id: new ObjectId(notificationId) }, { $set: { read: true } })

    return NextResponse.json({
      success: true,
      message: "Bildirim okundu olarak işaretlendi",
    })
  } catch (error) {
    console.error("Bildirim güncelleme hatası:", error)
    return NextResponse.json({ success: false, message: "Bildirim güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

// Bildirimi sil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const notificationId = params.id
    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Bildirimi bul
    const notification = await db.collection("notifications").findOne({
      _id: new ObjectId(notificationId),
    })

    if (!notification) {
      return NextResponse.json({ success: false, message: "Bildirim bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bu bildirimi silme yetkisi var mı kontrol et
    if (
      notification.userId &&
      notification.userId.toString() !== userId &&
      notification.recipientEmail !== user.email
    ) {
      return NextResponse.json({ success: false, message: "Bu bildirimi silme yetkiniz yok" }, { status: 403 })
    }

    // Bildirimi sil
    await db.collection("notifications").deleteOne({ _id: new ObjectId(notificationId) })

    return NextResponse.json({
      success: true,
      message: "Bildirim başarıyla silindi",
    })
  } catch (error) {
    console.error("Bildirim silme hatası:", error)
    return NextResponse.json({ success: false, message: "Bildirim silinirken bir hata oluştu" }, { status: 500 })
  }
}
