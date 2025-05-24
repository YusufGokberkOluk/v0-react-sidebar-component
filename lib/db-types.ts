import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  _id?: ObjectId
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: ObjectId
  workspaceId: ObjectId // Workspace ID'sini ekledik
  createdAt: Date
  updatedAt: Date
}

export interface PageShare {
  _id?: ObjectId
  pageId: ObjectId
  workspaceId: ObjectId
  sharedByUserId: ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

export interface Notification {
  _id?: ObjectId
  userId?: ObjectId
  recipientEmail: string
  type: "share_invitation" | "workspace_invitation" | "system"
  content: string
  link: string
  metadata?: {
    pageId?: string
    workspaceId?: string
    senderId?: string
    senderName?: string
  }
  read: boolean
  createdAt: Date
  readAt?: Date
}

// Workspace tipini ekleyelim
export interface Workspace {
  _id?: ObjectId
  name: string
  ownerId: ObjectId
  isDefault?: boolean
  createdAt: Date
  updatedAt?: Date
}

// Workspace paylaşımı için tip
export interface WorkspaceShare {
  _id?: ObjectId
  workspaceId: ObjectId
  sharedByUserId: ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit" | "admin"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}
