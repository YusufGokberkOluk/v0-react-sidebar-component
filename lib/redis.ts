import { createClient } from "redis"

let client: ReturnType<typeof createClient> | null = null

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: REDIS_URL,
    })

    client.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    client.on("connect", () => {
      console.log("Redis connected successfully")
    })

    client.on("disconnect", () => {
      console.log("Redis disconnected")
    })

    await client.connect()
  }

  return client
}

export async function setCache(key: string, value: any, expireInSeconds = 3600) {
  try {
    const redis = await getRedisClient()
    const serializedValue = JSON.stringify(value)
    await redis.setEx(key, expireInSeconds, serializedValue)
    console.log(`Cache set for key: ${key}`)
  } catch (error) {
    console.error("Error setting cache:", error)
  }
}

export async function getCache(key: string) {
  try {
    const redis = await getRedisClient()
    const value = await redis.get(key)
    if (value) {
      console.log(`Cache hit for key: ${key}`)
      return JSON.parse(value)
    }
    console.log(`Cache miss for key: ${key}`)
    return null
  } catch (error) {
    console.error("Error getting cache:", error)
    return null
  }
}

export async function deleteCache(key: string) {
  try {
    const redis = await getRedisClient()
    await redis.del(key)
    console.log(`Cache deleted for key: ${key}`)
  } catch (error) {
    console.error("Error deleting cache:", error)
  }
}

export async function setCacheWithPattern(pattern: string) {
  try {
    const redis = await getRedisClient()
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(keys)
      console.log(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`)
    }
  } catch (error) {
    console.error("Error deleting cache pattern:", error)
  }
}

export async function incrementCounter(key: string, expireInSeconds = 3600) {
  try {
    const redis = await getRedisClient()
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, expireInSeconds)
    }
    return count
  } catch (error) {
    console.error("Error incrementing counter:", error)
    return 0
  }
}

export async function addToSet(key: string, value: string) {
  try {
    const redis = await getRedisClient()
    await redis.sAdd(key, value)
    console.log(`Added to set ${key}: ${value}`)
  } catch (error) {
    console.error("Error adding to set:", error)
  }
}

export async function removeFromSet(key: string, value: string) {
  try {
    const redis = await getRedisClient()
    await redis.sRem(key, value)
    console.log(`Removed from set ${key}: ${value}`)
  } catch (error) {
    console.error("Error removing from set:", error)
  }
}

export async function closeRedis() {
  try {
    if (client) {
      await client.quit()
      client = null
      console.log("Redis connection closed")
    }
  } catch (error) {
    console.error("Error closing Redis connection:", error)
  }
}
