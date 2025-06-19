import { createClient } from "redis"

let client: ReturnType<typeof createClient> | null = null
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

/** Singleton redis client getter */
export async function getRedisClient() {
  if (!client) {
    client = createClient({ url: REDIS_URL })

    client.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    await client.connect()
  }
  return client
}

export async function getCache(key: string) {
  try {
    const redis = await getRedisClient()
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error("Redis get error:", error)
    return null // Redis hatası durumunda null döndür
  }
}

export async function setCache(key: string, value: any, expireInSeconds = 3600) {
  try {
    const redis = await getRedisClient()
    await redis.setEx(key, expireInSeconds, JSON.stringify(value))
  } catch (error) {
    console.error("Redis set error:", error)
    // Hata durumunda sessizce devam et
  }
}

export async function deleteCache(key: string) {
  try {
    const redis = await getRedisClient()
    await redis.del(key)
    console.log(`Cache deleted for key: ${key}`)
  } catch (error) {
    console.error("Redis delete error:", error)
  }
}
