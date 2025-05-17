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
