import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { getMongoDb, getCollection } from "./mongodb"
import type { User, Page, PageShare, Notification, Workspace } from "./db-types"

// Kullanıcı için varsayılan workspace oluşturma
export async function createDefaultWorkspace(userId: string, userName?: string): Promise<Workspace | null> {
  try {
    console.log("Creating default workspace for user:", userId)
    const collection = await getCollection<Workspace>("workspaces")

    // Kullanıcı adına göre workspace adı oluştur
    let workspaceName = "My Workspace"
    if (userName) {
      workspaceName = `${userName}'s etude`
    } else {
      // Kullanıcı adı yoksa, e-posta adresinden al
      const user = await getUserById(userId)
      if (user && user.email) {
        const username = user.email.split("@")[0]
        const formattedUsername = username.charAt(0).toUpperCase() + username.slice(1)
        workspaceName = `${formattedUsername}'s etude`
      }
    }

    const workspace: Workspace = {
      name: workspaceName,
      ownerId: new ObjectId(userId),
      isDefault: true,
      createdAt: new Date(),
    }

    const result = await collection.insertOne(workspace)
    const newWorkspace = await collection.findOne({ _id: result.insertedId })
    return newWorkspace as Workspace
  } catch (error) {
    console.error("Error creating default workspace:", error)
    return null
  }
}

// Kullanıcının workspace'lerini getirme
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    console.log("Getting workspaces for user:", userId)
    const db = await getMongoDb()

    // Kullanıcının kendi workspace'leri
    const ownWorkspaces = await db
      .collection("workspaces")
      .find({ ownerId: new ObjectId(userId) })
      .toArray()

    // Kullanıcı bilgilerini al
    const user = await getUserById(userId)
    if (!user) {
      return ownWorkspaces as Workspace[]
    }

    // Kullanıcıyla paylaşılan workspace'ler
    const sharedWorkspaces = await db
      .collection("workspaceShares")
      .find({
        sharedWithEmail: user.email,
        status: "accepted",
      })
      .toArray()

    // Paylaşılan workspace ID'lerini al
    const sharedWorkspaceIds = sharedWorkspaces.map((share) => share.workspaceId)

    // Paylaşılan workspace'lerin detaylarını getir
    const sharedWorkspaceDetails =
      sharedWorkspaceIds.length > 0
        ? await db
            .collection("workspaces")
            .find({ _id: { $in: sharedWorkspaceIds } })
            .toArray()
        : []

    // Tüm workspace'leri birleştir
    return [...ownWorkspaces, ...sharedWorkspaceDetails] as Workspace[]
  } catch (error) {
    console.error("Error getting user workspaces:", error)
    return []
  }
}

// Workspace oluşturma
export async function createWorkspace(workspaceData: Omit<Workspace, "_id">): Promise<Workspace | null> {
  try {
    console.log("Creating workspace:", workspaceData.name)
    const collection = await getCollection<Workspace>("workspaces")
    const result = await collection.insertOne({
      ...workspaceData,
      createdAt: new Date(),
    })

    const newWorkspace = await collection.findOne({ _id: result.insertedId })
    return newWorkspace as Workspace
  } catch (error) {
    console.error("Error creating workspace:", error)
    return null
  }
}

// Workspace erişim kontrolü fonksiyonunu ekle
export async function checkWorkspaceAccess(
  workspaceId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "member" }> {
  try {
    console.log("Checking workspace access for:", userIdOrEmail)
    const db = await getMongoDb()

    // Workspace bilgilerini getir
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) })

    if (!workspace) {
      return { hasAccess: false }
    }

    // Kullanıcı workspace'in sahibi mi kontrol et
    if (workspace.ownerId.toString() === userIdOrEmail) {
      return { hasAccess: true, accessLevel: "owner" }
    }

    // Kullanıcı ID mi yoksa e-posta mı kontrol et
    let userEmail: string

    try {
      // Eğer ObjectId ise, kullanıcı ID'si olarak kabul et
      new ObjectId(userIdOrEmail)

      // Kullanıcıyı bul
      const user = await db.collection("users").findOne({ _id: new ObjectId(userIdOrEmail) })

      if (!user) {
        return { hasAccess: false }
      }

      userEmail = user.email
    } catch (e) {
      // ObjectId değilse, e-posta olarak kabul et
      userEmail = userIdOrEmail
    }

    // Workspace paylaşım kontrolü
    const share = await db.collection("workspaceShares").findOne({
      workspaceId: new ObjectId(workspaceId),
      sharedWithEmail: userEmail,
      status: "accepted",
    })

    if (share) {
      return { hasAccess: true, accessLevel: "member" }
    }

    return { hasAccess: false }
  } catch (error) {
    console.error("Error checking workspace access:", error)
    return { hasAccess: false }
  }
}

// Workspace'e göre sayfaları getirme
export async function getWorkspacePages(workspaceId: string): Promise<Page[]> {
  try {
    console.log("Getting pages for workspace:", workspaceId)
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ workspaceId: new ObjectId(workspaceId) }).toArray()

    return pages as Page[]
  } catch (error) {
    console.error("Error getting workspace pages:", error)
    return []
  }
}

// Kullanıcı oluşturma fonksiyonunu güncelle
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

      // Kullanıcı için varsayılan workspace oluştur - "Kullanıcı's etude" formatında
      const workspace = await createDefaultWorkspace(result.insertedId.toString(), userData.name)

      // Varsayılan workspace için varsayılan sayfa oluştur
      if (workspace) {
        await createPage({
          title: "Ana Sayfa",
          content: "Hoş geldiniz! Bu sizin ana sayfanızdır. Buraya önemli notlar ekleyebilirsiniz.",
          tags: ["home", "important"],
          isFavorite: true,
          userId: result.insertedId,
          workspaceId: workspace._id as ObjectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

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

    // Kullanıcının tüm sayfalarını da sil
    await deleteAllUserPages(id)

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Sayfa oluşturma
export async function createPage(pageData: Omit<Page, "_id">): Promise<Page | null> {
  try {
    console.log("Creating page:", pageData.title)
    const collection = await getCollection<Page>("pages")
    const result = await collection.insertOne({
      ...pageData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const newPage = await collection.findOne({ _id: result.insertedId })
    return newPage as Page
  } catch (error) {
    console.error("Error creating page:", error)
    return null
  }
}

// Kullanıcının tüm sayfalarını getirme
export async function getUserPages(userId: string): Promise<Page[]> {
  try {
    console.log("Getting pages for user:", userId)
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ userId }).toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user pages:", error)
    return []
  }
}

// Sayfa ID'sine göre sayfa getirme
export async function getPageById(pageId: string): Promise<Page | null> {
  try {
    console.log("Getting page by ID:", pageId)
    const collection = await getCollection<Page>("pages")
    const page = await collection.findOne({ _id: new ObjectId(pageId) })
    return page as Page
  } catch (error) {
    console.error("Error getting page by ID:", error)
    return null
  }
}

// Sayfa güncelleme
export async function updatePage(pageId: string, updateData: Partial<Page>): Promise<Page | null> {
  try {
    console.log("Updating page with ID:", pageId)
    const collection = await getCollection<Page>("pages")

    // updatedAt alanını güncelle
    updateData.updatedAt = new Date()

    const result = await collection.updateOne({ _id: new ObjectId(pageId) }, { $set: updateData })

    if (result.modifiedCount === 0) {
      console.log("Page not found or no changes applied with ID:", pageId)
      return null
    }

    const updatedPage = await collection.findOne({ _id: new ObjectId(pageId) })
    return updatedPage as Page
  } catch (error) {
    console.error("Error updating page:", error)
    return null
  }
}

// Sayfa silme
export async function deletePage(pageId: string): Promise<boolean> {
  try {
    console.log("Deleting page with ID:", pageId)
    const collection = await getCollection<Page>("pages")
    const result = await collection.deleteOne({ _id: new ObjectId(pageId) })

    if (result.deletedCount === 0) {
      console.log("Page not found with ID:", pageId)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting page:", error)
    return false
  }
}

// Kullanıcının favori sayfalarını getirme
export async function getUserFavoritePages(userId: string): Promise<Page[]> {
  try {
    console.log("Getting favorite pages for user:", userId)
    const collection = await getCollection<Page>("pages")
    const pages = await collection.find({ userId, isFavorite: true }).toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error getting user favorite pages:", error)
    return []
  }
}

// Sayfa arama
export async function searchPages(userId: string, query: string): Promise<Page[]> {
  try {
    console.log("Searching pages for user:", userId, "with query:", query)
    const collection = await getCollection<Page>("pages")
    const pages = await collection
      .find({
        userId,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
        ],
      })
      .toArray()
    return pages as Page[]
  } catch (error) {
    console.error("Error searching pages:", error)
    return []
  }
}

// Kullanıcının tüm sayfalarını silme
export async function deleteAllUserPages(userId: string): Promise<boolean> {
  try {
    console.log("Deleting all pages for user:", userId)
    const collection = await getCollection<Page>("pages")
    const result = await collection.deleteMany({ userId })
    console.log(`Deleted ${result.deletedCount} pages for user:`, userId)
    return true
  } catch (error) {
    console.error("Error deleting all pages for user:", error)
    return false
  }
}

// Sayfa erişim kontrolü
export async function checkPageAccess(
  pageId: string,
  userIdOrEmail: string,
): Promise<{ hasAccess: boolean; accessLevel?: "owner" | "edit" | "view" }> {
  try {
    console.log("Checking page access for:", userIdOrEmail)
    const db = await getMongoDb()

    // Sayfa bilgilerini getir
    const page = await db.collection("pages").findOne({ _id: new ObjectId(pageId) })

    if (!page) {
      return { hasAccess: false }
    }

    // Kullanıcı sayfanın sahibi mi kontrol et
    if (page.userId.toString() === userIdOrEmail) {
      return { hasAccess: true, accessLevel: "owner" }
    }

    // Kullanıcı ID mi yoksa e-posta mı kontrol et
    let userEmail: string

    try {
      // Eğer ObjectId ise, kullanıcı ID'si olarak kabul et
      new ObjectId(userIdOrEmail)

      // Kullanıcıyı bul
      const user = await db.collection("users").findOne({ _id: new ObjectId(userIdOrEmail) })

      if (!user) {
        return { hasAccess: false }
      }

      userEmail = user.email
    } catch (e) {
      // ObjectId değilse, e-posta olarak kabul et
      userEmail = userIdOrEmail
    }

    // Paylaşım kontrolü
    const share = await db.collection("pageShares").findOne({
      pageId: new ObjectId(pageId),
      sharedWithEmail: userEmail,
      status: "accepted",
    })

    if (share) {
      return { hasAccess: true, accessLevel: share.accessLevel as "edit" | "view" }
    }

    return { hasAccess: false }
  } catch (error) {
    console.error("Error checking page access:", error)
    return { hasAccess: false }
  }
}

// Sayfa paylaşımlarını getir
export async function getPageShares(pageId: string): Promise<PageShare[]> {
  try {
    console.log("Getting shares for page:", pageId)
    const db = await getMongoDb()

    const shares = await db
      .collection("pageShares")
      .find({ pageId: new ObjectId(pageId) })
      .toArray()

    return shares as PageShare[]
  } catch (error) {
    console.error("Error getting page shares:", error)
    return []
  }
}

// Kullanıcının bildirimlerini getir
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    console.log("Getting notifications for user:", userId)
    const db = await getMongoDb()

    // Kullanıcıyı bul
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return []
    }

    // Kullanıcının bildirimlerini getir
    const notifications = await db
      .collection("notifications")
      .find({
        $or: [{ userId: new ObjectId(userId) }, { recipientEmail: user.email }],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return notifications as Notification[]
  } catch (error) {
    console.error("Error getting user notifications:", error)
    return []
  }
}

// Workspace ile ilgili fonksiyonları export edelim
export * from "./users"
export * from "./pages"
