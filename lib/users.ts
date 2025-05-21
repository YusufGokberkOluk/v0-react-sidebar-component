import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getCollection } from "./mongodb"
import type { User } from "./db-types"
import { createDefaultWorkspace } from "./workspaces"

// Kullanıcı oluşturma
export async function createUser(userData: Omit<User, "_id">): Promise<User | null> {
  try {
    console.log("Creating user:", userData.email)
    const collection = await getCollection<User>("users")

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

      // Kullanıcı için varsayılan workspace oluştur
      const workspace = await createDefaultWorkspace(result.insertedId.toString(), userData.name)

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

// Kullanıcı girişi
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    console.log("Logging in user:", email)
    const collection = await getCollection<User>("users")
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

// Kullanıcıyı ID'ye göre getir
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log("Getting user by ID:", id)
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ _id: new ObjectId(id) })

    if (!user) {
      console.log("User not found with ID:", id)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// E-posta ile kullanıcı getir
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("Getting user by email:", email)
    const collection = await getCollection<User>("users")
    const user = await collection.findOne({ email })

    if (!user) {
      console.log("User not found with email:", email)
      return null
    }

    // Şifreyi çıkar ve kullanıcıyı döndür
    const { password, ...userWithoutPassword } = user as User
    return userWithoutPassword as User
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Kullanıcıyı güncelle
export async function updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
  try {
    console.log("Updating user with ID:", id)
    const collection = await getCollection<User>("users")

    // Şifre güncelleniyorsa, hashle
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    // updatedAt alanını güncelle
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.modifiedCount === 0) {
      console.log("User not found or no changes applied with ID:", id)
      return null
    }

    // Güncellenmiş kullanıcıyı getir
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
    console.log("Deleting user with ID:", id)
    const collection = await getCollection<User>("users")
    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      console.log("User not found with ID:", id)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}
