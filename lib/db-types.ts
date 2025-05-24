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
  createdAt: Date
  updatedAt: Date
}

// Yeni eklenen paylaşım tipi
export interface PageShare {
  _id?: string | ObjectId
  pageId: string | ObjectId
  sharedByUserId: string | ObjectId
  sharedWithEmail: string
  accessLevel: "view" | "edit"
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

// Yeni eklenen bildirim tipi
export interface Notification {
  _id?: string | ObjectId
  userId?: string | ObjectId
  recipientEmail: string
  type: "share_invitation" | "message" | "document" | "mention" | "reminder" | "error"
  content: string
  link?: string
  read: boolean
  createdAt: Date
}
