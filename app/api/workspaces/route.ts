import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getUserWorkspaces, createWorkspace } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await getUserWorkspaces(user._id as string)
    return NextResponse.json({ success: true, workspaces })
  } catch (error) {
    console.error("Error fetching workspaces:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, message: "Workspace name is required" }, { status: 400 })
    }

    const workspace = await createWorkspace({
      name: name.trim(),
      ownerId: user._id as any,
      createdAt: new Date(),
    })

    if (!workspace) {
      return NextResponse.json({ success: false, message: "Failed to create workspace" }, { status: 500 })
    }

    return NextResponse.json({ success: true, workspace }, { status: 201 })
  } catch (error) {
    console.error("Error creating workspace:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
