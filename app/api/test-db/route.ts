import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    // MongoDB bağlantısını test et
    const client = await clientPromise
    const db = client.db()

    // Bağlantı başarılı olduğunda
    return NextResponse.json(
      {
        success: true,
        message: "MongoDB bağlantısı başarılı",
        database: db.databaseName,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("MongoDB bağlantı hatası:", error)
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB bağlantı hatası",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
