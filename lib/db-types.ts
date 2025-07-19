import type { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  email: string
  password: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  _id: ObjectId
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Share {
  _id: ObjectId
  pageId: string
  userId: string
  token: string
  accessLevel: "view" | "edit"
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  _id: ObjectId
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Invite {
  _id: ObjectId
  email: string
  token: string
  pageId: string
  invitedBy: string
  accessLevel: "view" | "edit"
  expiresAt: Date
  createdAt: Date
}
