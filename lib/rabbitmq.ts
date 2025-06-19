import amqp from "amqplib"

let connection: amqp.Connection | null = null
let channel: amqp.Channel | null = null

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672"

export async function connectRabbitMQ() {
  try {
    if (!connection) {
      connection = await amqp.connect(RABBITMQ_URL)
      console.log("RabbitMQ connected successfully")

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err)
        connection = null
        channel = null
      })

      connection.on("close", () => {
        console.log("RabbitMQ connection closed")
        connection = null
        channel = null
      })
    }

    if (!channel) {
      channel = await connection.createChannel()
      console.log("RabbitMQ channel created successfully")
    }

    return { connection, channel }
  } catch (error) {
    console.error("RabbitMQ connection error:", error)
    throw error
  }
}

export async function publishMessage(queue: string, message: any) {
  try {
    const { channel } = await connectRabbitMQ()

    await channel.assertQueue(queue, { durable: true })

    const messageBuffer = Buffer.from(JSON.stringify(message))
    const sent = channel.sendToQueue(queue, messageBuffer, { persistent: true })

    if (sent) {
      console.log(`Message published to queue ${queue}:`, message)
    } else {
      console.warn(`Failed to publish message to queue ${queue}`)
    }

    return sent
  } catch (error) {
    console.error("Error publishing message:", error)
    throw error
  }
}

export async function consumeMessages(queue: string, callback: (message: any) => void) {
  try {
    const { channel } = await connectRabbitMQ()

    await channel.assertQueue(queue, { durable: true })

    channel.prefetch(1) // Process one message at a time

    await channel.consume(queue, (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString())
          callback(content)
          channel.ack(msg)
        } catch (error) {
          console.error("Error processing message:", error)
          channel.nack(msg, false, false) // Don't requeue failed messages
        }
      }
    })

    console.log(`Started consuming messages from queue: ${queue}`)
  } catch (error) {
    console.error("Error consuming messages:", error)
    throw error
  }
}

export async function closeRabbitMQ() {
  try {
    if (channel) {
      await channel.close()
      channel = null
    }
    if (connection) {
      await connection.close()
      connection = null
    }
    console.log("RabbitMQ connection closed")
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error)
  }
}
