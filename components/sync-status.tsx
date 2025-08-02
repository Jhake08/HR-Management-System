"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, CheckCircle, AlertTriangle, Database, Clock } from "lucide-react"
import { createGoogleSheetsSync } from "@/lib/google-sheets-api"

interface SyncStatusProps {
  isConnected: boolean
}

export function SyncStatus({ isConnected }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    employees: { lastSync: "2024-12-15 10:30 AM", status: "success", count: 45 },
    attendance: { lastSync: "2024-12-15 10:25 AM", status: "syncing", count: 1250 },
    payroll: { lastSync: "2024-12-15 09:45 AM", status: "success", count: 180 },
    contributions: { lastSync: "2024-12-15 08:00 AM", status: "success", count: 12 },
    utang: { lastSync: "2024-12-15 10:15 AM", status: "success", count: 8 },
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  const handleManualSync = async () => {
    if (!isConnected) return

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      const sheets = createGoogleSheetsSync()

      // Simulate sync progress
      const syncSteps = [
        { name: "employees", label: "Employees Masterlist" },
        { name: "attendance", label: "Attendance Log" },
        { name: "payroll", label: "Payroll Records" },
        { name: "contributions", label: "Government Contributions" },
        { name: "utang", label: "Utang Tracker" },
      ]

      for (let i = 0; i < syncSteps.length; i++) {
        const step = syncSteps[i]
        setSyncProgress((i / syncSteps.length) * 100)

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Update status
        setSyncStatus((prev) => ({
          ...prev,
          [step.name]: {
            ...prev[step.name as keyof typeof prev],
            lastSync: new Date().toLocaleString(),
            status: "success",
          },
        }))
      }

      setSyncProgress(100)
      setTimeout(() => {
        setIsSyncing(false)
        setSyncProgress(0)
      }, 500)
    } catch (error) {
      console.error("Sync failed:", error)
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "syncing":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Google Sheets Sync Status
              </CardTitle>
              <CardDescription>Real-time synchronization with your HR data</CardDescription>
            </div>
            <Button onClick={handleManualSync} disabled={!isConnected || isSyncing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Google Sheets not connected. Please complete the setup wizard first.</AlertDescription>
            </Alert>
          )}

          {isSyncing && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Syncing data...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(syncStatus).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <div className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div className="text-sm text-gray-600">
                      {status.count} records • Last sync: {status.lastSync}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusColor(status.status) as any}>{status.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Sync</div>
              <div className="text-sm text-gray-600">Automatically sync every 5 minutes</div>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Real-time Updates</div>
              <div className="text-sm text-gray-600">Push changes immediately</div>
            </div>
            <Badge variant="default">Active</Badge>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All changes are automatically synced to Google Sheets. Manual sync available for immediate updates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
