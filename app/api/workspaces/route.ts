import { type NextRequest, NextResponse } from "next/server"
import { getUserWorkspaces, createWorkspace } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

// GET: Kullanıcının workspace'lerini getir
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await getUserWorkspaces(user._id.toString())

    return NextResponse.json({ success: true, workspaces })
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch workspaces" }, { status: 500 })
  }
}

// POST: Yeni workspace oluştur
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, message: "Workspace name is required" }, { status: 400 })
    }

    const workspace = await createWorkspace({
      name,
      ownerId: user._id,
      isDefault: false,
      createdAt: new Date(),
    })

    if (!workspace) {
      return NextResponse.json({ success: false, message: "Failed to create workspace" }, { status: 500 })
    }

    return NextResponse.json({ success: true, workspace })
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json({ success: false, message: "Failed to create workspace" }, { status: 500 })
  }
}
