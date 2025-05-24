import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getWorkspacePages, checkWorkspaceAccess } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const workspaceId = params.id

    // Workspace erişim kontrolü
    const access = await checkWorkspaceAccess(workspaceId, user._id as string)
    if (!access.hasAccess) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const pages = await getWorkspacePages(workspaceId)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error fetching workspace pages:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
