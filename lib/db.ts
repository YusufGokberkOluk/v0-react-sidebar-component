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

// Derleme sırasında çalışmayı önlemek için yardımcı fonksiyon
async function getCollection(collectionName: string) {
  // Sadece gerçek derleme aşamasında atla
  if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
    console.log(`Skipping database access to ${collectionName} during build`)
    return {
      findOne: () => Promise.resolve(null),
      insertOne: () => Promise.resolve({ insertedId: new ObjectId() }),
      updateOne: () => Promise.resolve({ modifiedCount: 1 }),
      deleteOne: () => Promise.resolve({ deletedCount: 1 }),
    }
  }

  try {
    console.log(`Accessing collection: ${collectionName}`)
    const client = await clientPromise
    const db = client.db()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`${collectionName} koleksiyonuna erişim hatası:`, error)
    throw new Error(`Veritabanı bağlantı hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
  }
}

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    // Sadece gerçek derleme aşamasında atla
    if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
      console.log("Skipping database operation during build")
      return {} as User
    }

    console.log("Creating user:", userData.email)
    const collection = await getCollection("users")

    // E-posta adresinin zaten kullanımda olup olmadığını kontrol et
    try {
      const existingUser = await collection.findOne({ email: userData.email })
      if (existingUser) {
        console.log("Email already in use:", userData.email)
        return null // E-posta zaten kullanımda
      }
    } catch (error) {
      console.error("Error checking existing user:", error)
      // Hata durumunda devam et, kullanıcı oluşturmayı dene
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Kullanıcıyı oluştur
    try {
      const result = await collection.insertOne({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Oluşturulan kullanıcıyı döndür (şifre hariç)
      const newUser = await collection.findOne({ _id: result.insertedId })
      if (!newUser) return null

      // Şifreyi çıkar ve kullanıcıyı döndür
      const { password, ...userWithoutPassword } = newUser as User
      return userWithoutPassword as User
    } catch (insertError) {
      console.error("Error inserting new user:", insertError)
      return null
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return null // Hata durumunda null döndür
  }
}

// Kullanıcı kimliğine göre kullanıcıyı getir
export async function getUserById(id: string): Promise<User | null> {
  try {
    // Sadece gerçek derleme aşamasında atla
    if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
      console.log("Skipping database operation during build")
      return {} as User
    }

    console.log("Getting user by id:", id)
    const collection = await getCollection("users")
    const user = await collection.findOne({ _id: new ObjectId(id) })

    if (!user) {
      console.log("User not found with id:", id)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by id:", error)
    return null
  }
}

// Kullanıcıyı e-posta ve şifre ile getir (giriş için)
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // Sadece gerçek derleme aşamasında atla
    if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
      console.log("Skipping database operation during build")
      return {} as User
    }

    console.log("Logging in user:", email)
    const collection = await getCollection("users")
    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found with email:", email)
      return null
    }

    // Şifreyi karşılaştır
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      console.log("Invalid password for user:", email)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password: hashedPassword, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error logging in user:", error)
    return null
  }
}

// Kullanıcıyı güncelle
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    // Sadece gerçek derleme aşamasında atla
    if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
      console.log("Skipping database operation during build")
      return {} as User
    }

    console.log("Updating user with id:", id, "data:", userData)
    const collection = await getCollection("users")

    // Şifre güncelleniyorsa hashle
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...userData, updatedAt: new Date() } },
    )

    if (result.modifiedCount === 0) {
      console.log("User not found or no changes applied with id:", id)
      return null
    }

    // Güncellenmiş kullanıcıyı döndür
    const updatedUser = await collection.findOne({ _id: new ObjectId(id) })
    if (!updatedUser) return null

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = updatedUser as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// Kullanıcıyı sil
export async function deleteUser(id: string): Promise<boolean> {
  try {
    // Sadece gerçek derleme aşamasında atla
    if (process.env.NEXT_PHASE === "phase-production-build" && process.env.NODE_ENV === "production") {
      console.log("Skipping database operation during build")
      return true
    }

    console.log("Deleting user with id:", id)
    const collection = await getCollection("users")
    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      console.log("User not found with id:", id)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}
