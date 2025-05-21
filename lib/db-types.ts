import type { ObjectId } from "mongodb"

export interface User {
  _id?: string | ObjectId
  name?: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Page {
  _id?: string | ObjectId
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: string | ObjectId
  workspaceId: string | ObjectId // Workspace ID'si eklendi
  createdAt: Date
  updatedAt: Date
}

// Workspace modeli eklendi
export interface Workspace {
  _id?: string | ObjectId
  name: string
  ownerId: string | ObjectId
  isDefault: boolean
  createdAt: Date
  updatedAt?: Date
}

// Workspace paylaşımı için model eklendi
export interface WorkspaceShare {
  _id?: string | ObjectId
  workspaceId: string | ObjectId
  sharedByUserId: string | ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit" | "admin"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

export interface PageShare {
  _id?: string | ObjectId
  pageId: string | ObjectId
  workspaceId: string | ObjectId // Workspace ID'si eklendi
  sharedByUserId: string | ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

export interface Notification {
  _id?: string | ObjectId
  userId?: string | ObjectId
  recipientEmail: string
  type: "share_invitation" | "workspace_invitation" | "message" | "document" | "mention" | "reminder" | "error"
  content: string
  link?: string
  metadata?: {
    workspaceId?: string
    pageId?: string
    senderId?: string
    senderName?: string
  }
  read: boolean
  createdAt: Date
}
