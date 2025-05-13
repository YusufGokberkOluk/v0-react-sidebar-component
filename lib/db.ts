import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// Kullanıcı tipi tanımı
export interface User {
  _id?: string | ObjectId
  name?: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db()

    // E-posta adresinin zaten kullanımda olup olmadığını kontrol et
    const existingUser = await db.collection("users").findOne({ email: userData.email })
    if (existingUser) {
      return null // E-posta zaten kullanımda
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Kullanıcıyı oluştur
    const result = await db.collection("users").insertOne({
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Oluşturulan kullanıcıyı döndür (şifre hariç)
    const newUser = await db.collection("users").findOne({ _id: result.insertedId })
    if (!newUser) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = newUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Kullanıcı girişi
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db()

    // Kullanıcıyı bul
    const user = (await db.collection("users").findOne({ email })) as User | null
    if (!user) return null

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error logging in user:", error)
    throw error
  }
}

// Kullanıcı bilgilerini güncelleme
export async function updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db()

    // Şifre güncellenmişse hashle
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10)
    }

    // Kullanıcıyı güncelle
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...userData,
          updatedAt: new Date(),
        },
      },
    )

    // Güncellenmiş kullanıcıyı döndür
    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!updatedUser) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = updatedUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Kullanıcı silme
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const client = await clientPromise
    const db = client.db()

    const result = await db.collection("users").deleteOne({ _id: new ObjectId(userId) })
    return result.deletedCount === 1
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// Kullanıcı bilgilerini getirme
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db()

    const user = (await db.collection("users").findOne({ _id: new ObjectId(userId) })) as User | null
    if (!user) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

// E-posta ile kullanıcı bilgilerini getirme
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db()

    const user = (await db.collection("users").findOne({ email })) as User | null
    if (!user) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}
