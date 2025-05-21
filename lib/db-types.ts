import type { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  _id: ObjectId
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: ObjectId
  workspaceId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  _id: ObjectId
  name: string
  ownerId: ObjectId
  isDefault: boolean
  createdAt: Date
}

export interface WorkspaceShare {
  _id?: ObjectId
  workspaceId: ObjectId
  sharedByUserId: ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit" | "admin"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
  sharedPageIds?: ObjectId[] // Paylaşılan sayfa ID'leri
}

export interface PageShare {
  _id?: ObjectId
  pageId: ObjectId
  workspaceId?: ObjectId
  sharedByUserId: ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

export interface Notification {
  _id?: ObjectId
  recipientEmail: string
  type: "share_invitation" | "workspace_invitation" | "system"
  content: string
  link: string
  metadata?: {
    workspaceId?: string
    pageId?: string
    senderId?: string
    senderName?: string
  }
  read: boolean
  createdAt: Date
  readAt?: Date
}
