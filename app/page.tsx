"use client"

import { useState } from "react"
import { Dashboard } from "@/components/dashboard"
import { EmployeePortal } from "@/components/employee-portal"
import { AdminPanel } from "@/components/admin-panel"
import { TimeTracking } from "@/components/time-tracking"
import { PayrollSystem } from "@/components/payroll-system"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { SyncTest } from "@/components/sync-test"
import { DataMigration } from "@/components/data-migration"

type View = "dashboard" | "employees" | "admin" | "time-tracking" | "payroll" | "sync-test" | "data-migration"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("dashboard")

  // Mock user data
  const user = {
    name: "Admin User",
    role: "Owner",
    email: "admin@company.com",
  }

  const renderView = () => {
    switch (currentView) {
      case "employees":
        return <EmployeePortal />
      case "admin":
        return <AdminPanel />
      case "time-tracking":
        return <TimeTracking />
      case "payroll":
        return <PayrollSystem />
      case "sync-test":
        return <SyncTest />
      case "data-migration":
        return <DataMigration />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">PH HR System</h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentView !== "dashboard" && (
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  ← Back to Dashboard
                </button>
              )}
              <div className="text-sm text-gray-600">Welcome, {user.name}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === "dashboard" && <UpgradePrompt />}
          {renderView()}
        </div>
      </main>
    </div>
  )
}
