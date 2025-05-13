import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

export async function GET() {
  console.log("Test DB API called")

  try {
    // MongoDB bağlantısını test et
    const db = await getMongoDb()

    // Bağlantı başarılı olduğunda
    return NextResponse.json(
      {
        success: true,
        message: "MongoDB bağlantısı başarılı",
        database: db.databaseName,
        nodeEnv: process.env.NODE_ENV || "unknown",
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
        nodeEnv: process.env.NODE_ENV || "unknown",
      },
      { status: 500 },
    )
  }
}
