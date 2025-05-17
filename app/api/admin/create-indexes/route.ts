import { type NextRequest, NextResponse } from "next/server"
import { createIndexes } from "@/lib/create-indexes"

export async function POST(request: NextRequest) {
  try {
    // Bu endpoint'i sadece yetkili kullanıcılar çağırabilmeli
    // Gerçek uygulamada burada admin kontrolü yapılmalı

    const success = await createIndexes()

    if (success) {
      return NextResponse.json({ message: "Indexes created successfully" })
    } else {
      return NextResponse.json({ error: "Failed to create indexes" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in create-indexes endpoint:", error)
    return NextResponse.json({ error: "Failed to create indexes" }, { status: 500 })
  }
}
