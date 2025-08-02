"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { NotificationType } from "@/utils/notifications"

interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Date.now().toString()
    const newNotification = { ...notification, id }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-remove after duration
    const duration = notification.duration || 5000
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, duration)

    // Also show browser notification if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title || "HR System", {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              p-4 rounded-lg shadow-lg max-w-sm
              ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : notification.type === "error"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : notification.type === "warning"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                {notification.title && <div className="font-semibold mb-1">{notification.title}</div>}
                <div className="text-sm">{notification.message}</div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
