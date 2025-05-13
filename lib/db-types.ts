import type { ObjectId } from "mongodb"

// Kullanıcı tipi
export interface User {
  _id?: string | ObjectId
  name?: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
  preferences?: UserPreferences
}

// Kullanıcı tercihleri
export interface UserPreferences {
  darkMode?: boolean
  autoSave?: boolean
  emailNotifications?: boolean
  reminderNotifications?: boolean
}

// Sayfa/Not tipi
export interface Page {
  _id?: string | ObjectId
  userId: string | ObjectId
  title: string
  content: string
  isFavorite: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Şablon tipi
export interface Template {
  _id?: string | ObjectId
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  thumbnail: string
  isFeatured: boolean
  isAIPowered: boolean
  isCustom: boolean
  userId?: string | ObjectId // Özel şablonlar için
  createdAt: Date
}

// Favori şablonlar için ilişki tablosu
export interface TemplateFavorite {
  _id?: string | ObjectId
  userId: string | ObjectId
  templateId: string | ObjectId
  createdAt: Date
}
