import { publishMessage } from "./rabbitmq"

export interface NotificationMessage {
  type: "user_registered" | "page_created" | "page_shared" | "user_invited"
  userId: string
  email: string
  data: any
  timestamp: Date
}

export async function publishNotification(notification: NotificationMessage) {
  try {
    await publishMessage("notifications", notification)
    console.log("Notification published:", notification.type)
  } catch (error) {
    console.error("Error publishing notification:", error)
  }
}

export async function sendWelcomeEmail(userId: string, email: string, name?: string) {
  const notification: NotificationMessage = {
    type: "user_registered",
    userId,
    email,
    data: { name },
    timestamp: new Date(),
  }

  await publishNotification(notification)
}

export async function notifyPageCreated(userId: string, pageId: string, title: string) {
  const notification: NotificationMessage = {
    type: "page_created",
    userId,
    email: "", // Will be filled by the consumer
    data: { pageId, title },
    timestamp: new Date(),
  }

  await publishNotification(notification)
}

export async function notifyPageShared(
  sharedByUserId: string,
  sharedWithEmail: string,
  pageId: string,
  pageTitle: string,
) {
  const notification: NotificationMessage = {
    type: "page_shared",
    userId: sharedByUserId,
    email: sharedWithEmail,
    data: { pageId, pageTitle },
    timestamp: new Date(),
  }

  await publishNotification(notification)
}

export async function notifyUserInvited(invitedByUserId: string, invitedEmail: string, workspaceId: string) {
  const notification: NotificationMessage = {
    type: "user_invited",
    userId: invitedByUserId,
    email: invitedEmail,
    data: { workspaceId },
    timestamp: new Date(),
  }

  await publishNotification(notification)
}
