import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Test DB API çağrıldı, NEXT_PHASE:", process.env.NEXT_PHASE)

    // MongoDB bağlantısını test et
    const client = await clientPromise
    const db = client.db()

    // Bağlantı başarılı olduğunda
    return NextResponse.json(
      {
        success: true,
        message: "MongoDB bağlantısı başarılı",
        database: db.databaseName,
        phase: process.env.NEXT_PHASE || "runtime",
        nodeEnv: process.env.NODE_ENV,
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
        phase: process.env.NEXT_PHASE || "runtime",
        nodeEnv: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
