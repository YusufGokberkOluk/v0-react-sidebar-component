import type { ObjectId } from "mongodb"

// Kullanıcı tipi tanımı
export interface User {
  _id?: string | ObjectId
  name?: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

// Sayfa tipi tanımı
export interface Page {
  _id?: string | ObjectId
  userId: string // Sayfanın sahibi olan kullanıcının ID'si
  title: string // Sayfa başlığı
  content: string // Sayfa içeriği
  tags: string[] // Etiketler
  isFavorite: boolean // Favori durumu
  createdAt: Date // Oluşturulma tarihi
  updatedAt: Date // Güncellenme tarihi
}

// Kullanıcı tercihleri tipi tanımı
export interface UserPreferences {
  viewMode?: "list" | "grid" // Görünüm modu
  theme?: "light" | "dark" // Tema
  autoSave?: boolean // Otomatik kaydetme
}

// Şablon tipi tanımı
export interface Template {
  _id?: string | ObjectId
  title: string
  description: string
  imageUrl: string
  content: string
  category: string
  createdAt: Date
}

// Şablon favorileri tipi tanımı
export interface TemplateFavorite {
  _id?: string | ObjectId
  userId: string
  templateId: string
  createdAt: Date
}
