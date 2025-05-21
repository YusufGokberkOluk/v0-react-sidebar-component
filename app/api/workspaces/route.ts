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

// Yeni workspace oluştur - Bu endpoint'i kaldırabiliriz veya sadece admin için tutabiliriz
// Kullanıcılar sadece default workspace'i kullanacak
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

    // Kullanıcının zaten bir default workspace'i var mı kontrol et
    const existingWorkspaces = await getUserWorkspaces(userId)
    if (existingWorkspaces.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Kullanıcı zaten bir workspace'e sahip. Sadece bir workspace kullanabilirsiniz.",
          workspace: existingWorkspaces[0],
        },
        { status: 400 },
      )
    }

    // Workspace oluştur
    const workspace = await createWorkspace({
      name,
      ownerId: userId,
      isDefault: true, // Her zaman default olarak ayarla
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
