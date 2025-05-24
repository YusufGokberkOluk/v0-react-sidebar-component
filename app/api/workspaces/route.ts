import { type NextRequest, NextResponse } from "next/server"
import { getUserWorkspaces, createWorkspace } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Kullanıcının workspace'lerini getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının workspace'lerini getir
    const workspaces = await getUserWorkspaces(authResult.userId)

    return NextResponse.json({ success: true, workspaces })
  } catch (error) {
    console.error("Error getting workspaces:", error)
    return NextResponse.json({ success: false, message: "Workspace'ler getirilirken bir hata oluştu" }, { status: 500 })
  }
}

// Yeni workspace oluştur
export async function POST(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // İstek gövdesini al
    const { name } = await req.json()

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, message: "Workspace adı gereklidir" }, { status: 400 })
    }

    // Yeni workspace oluştur
    const workspace = await createWorkspace({
      name,
      ownerId: new ObjectId(authResult.userId),
      createdAt: new Date(),
    })

    if (!workspace) {
      return NextResponse.json({ success: false, message: "Workspace oluşturulurken bir hata oluştu" }, { status: 500 })
    }

    return NextResponse.json({ success: true, workspace }, { status: 201 })
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json({ success: false, message: "Workspace oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}
