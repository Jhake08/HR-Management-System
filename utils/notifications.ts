/**
 * Notification utility functions for the HR system
 */

export type NotificationType = "success" | "error" | "warning" | "info"

export interface NotificationOptions {
  type: NotificationType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
}

// Simple notification function for easy usage
export const showNotification = (message: string, type: NotificationType = "info", title?: string, duration = 5000) => {
  // For now, use browser alert as fallback
  // In a real app, this would integrate with a toast library
  const prefix = type === "error" ? "❌" : type === "success" ? "✅" : type === "warning" ? "⚠️" : "ℹ️"
  const displayMessage = title ? `${prefix} ${title}: ${message}` : `${prefix} ${message}`

  console.log(`[${type.toUpperCase()}]`, displayMessage)

  // Use browser notification if available and user has granted permission
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title || "HR System", {
      body: message,
      icon: "/favicon.ico",
    })
  } else {
    // Fallback to alert for critical messages
    if (type === "error") {
      alert(displayMessage)
    }
  }
}

// Notification manager class for more advanced usage
export class NotificationManager {
  private notifications: Map<string, NotificationOptions> = new Map()

  show(options: NotificationOptions): string {
    const id = Date.now().toString()
    this.notifications.set(id, options)

    showNotification(options.message, options.type, options.title, options.duration)

    // Auto-remove after duration (unless persistent)
    if (!options.persistent) {
      setTimeout(() => {
        this.notifications.delete(id)
      }, options.duration || 5000)
    }

    return id
  }

  remove(id: string): void {
    this.notifications.delete(id)
  }

  clear(): void {
    this.notifications.clear()
  }

  getAll(): NotificationOptions[] {
    return Array.from(this.notifications.values())
  }
}

// Convenience functions
export const notify = {
  success: (message: string, title?: string) => showNotification(message, "success", title),
  error: (message: string, title?: string) => showNotification(message, "error", title),
  warning: (message: string, title?: string) => showNotification(message, "warning", title),
  info: (message: string, title?: string) => showNotification(message, "info", title),
}

// Safe alert function that won't crash in SSR
export const safeAlert = (message: string) => {
  if (typeof window !== "undefined") {
    alert(message)
  } else {
    console.log("ALERT:", message)
  }
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Create a global notification manager instance
export const notificationManager = new NotificationManager()
