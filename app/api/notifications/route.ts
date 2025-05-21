import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Kullanıcının bildirimlerini getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bildirimlerini getir
    const notifications = await db
      .collection("notifications")
      .find({
        $or: [{ userId: new ObjectId(userId) }, { recipientEmail: user.email }],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      success: true,
      notifications: notifications.map((notification) => ({
        ...notification,
        _id: notification._id.toString(),
        userId: notification.userId ? notification.userId.toString() : undefined,
      })),
    })
  } catch (error) {
    console.error("Bildirimleri getirme hatası:", error)
    return NextResponse.json({ success: false, message: "Bildirimler getirilirken bir hata oluştu" }, { status: 500 })
  }
}

// Tüm bildirimleri okundu olarak işaretle
export async function PATCH(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcının bildirimlerini okundu olarak işaretle
    await db.collection("notifications").updateMany(
      {
        $or: [{ userId: new ObjectId(userId) }, { recipientEmail: user.email }],
        read: false,
      },
      {
        $set: { read: true },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Tüm bildirimler okundu olarak işaretlendi",
    })
  } catch (error) {
    console.error("Bildirimleri güncelleme hatası:", error)
    return NextResponse.json({ success: false, message: "Bildirimler güncellenirken bir hata oluştu" }, { status: 500 })
  }
}
