import { NextResponse } from "next/server"
import { createIndexes } from "@/lib/create-indexes"

export async function GET() {
  try {
    const success = await createIndexes()

    if (success) {
      return NextResponse.json({ success: true, message: "Indexes created successfully" }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: "Failed to create indexes" }, { status: 500 })
    }
  } catch (error) {
    console.error("Create indexes error:", error)
    return NextResponse.json({ success: false, message: "Error creating indexes" }, { status: 500 })
  }
}
