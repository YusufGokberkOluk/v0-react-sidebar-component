import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { createWorkspace, getUserWorkspaces } from "@/lib/db"

// Kullanıcının workspace'lerini getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının workspace'lerini getir
    const workspaces = await getUserWorkspaces(userId)
    return NextResponse.json({ success: true, workspaces })
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json({ success: false, message: "Workspace'ler getirilirken bir hata oluştu" }, { status: 500 })
  }
}

// Yeni workspace oluştur
export async function POST(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // İstek gövdesini al
    const { name, isDefault } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, message: "Workspace adı gereklidir" }, { status: 400 })
    }

    // Workspace oluştur
    const workspace = await createWorkspace({
      name,
      ownerId: userId,
      isDefault: isDefault || false,
      createdAt: new Date(),
    })

    if (!workspace) {
      return NextResponse.json({ success: false, message: "Workspace oluşturulamadı" }, { status: 500 })
    }

    return NextResponse.json({ success: true, workspace }, { status: 201 })
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json({ success: false, message: "Workspace oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}
