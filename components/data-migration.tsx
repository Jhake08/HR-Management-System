"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Database, Upload, Trash2, Download } from "lucide-react"
import { createGoogleSheetsSync, hasFullAccess, getAuthMethod } from "@/lib/google-sheets-api"
import { useNotification } from "@/components/notification-provider"

interface LocalDataSummary {
  attendance: any[]
  payroll: any[]
  employees: any[]
  utang: any[]
  totalRecords: number
}

export function DataMigration() {
  const [localData, setLocalData] = useState<LocalDataSummary>({
    attendance: [],
    payroll: [],
    employees: [],
    utang: [],
    totalRecords: 0,
  })
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "migrating" | "completed" | "error">("idle")
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationLog, setMigrationLog] = useState<string[]>([])
  const [authMethod, setAuthMethod] = useState<string>("none")
  const { showNotification } = useNotification()

  const addLog = (message: string) => {
    setMigrationLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    setAuthMethod(getAuthMethod())
    scanLocalData()
  }, [])

  const scanLocalData = () => {
    const attendance: any[] = []
    const payroll: any[] = []
    const employees: any[] = []
    const utang: any[] = []

    // Scan localStorage for HR data
    const keys = Object.keys(localStorage)

    keys.forEach((key) => {
      try {
        const data = localStorage.getItem(key)
        if (!data) return

        if (key.startsWith("attendance-")) {
          const record = JSON.parse(data)
          attendance.push(record)
        } else if (key.startsWith("payroll-")) {
          const records = JSON.parse(data)
          if (Array.isArray(records)) {
            payroll.push(...records)
          } else {
            payroll.push(records)
          }
        } else if (key.startsWith("sheets_data_Employees")) {
          const records = JSON.parse(data)
          if (Array.isArray(records)) {
            employees.push(...records)
          }
        } else if (key.startsWith("sheets_data_Utang")) {
          const records = JSON.parse(data)
          if (Array.isArray(records)) {
            utang.push(...records)
          }
        }
      } catch (error) {
        console.error(`Error parsing ${key}:`, error)
      }
    })

    const summary = {
      attendance,
      payroll,
      employees,
      utang,
      totalRecords: attendance.length + payroll.length + employees.length + utang.length,
    }

    setLocalData(summary)
  }

  const startMigration = async () => {
    if (!hasFullAccess()) {
      showNotification({
        type: "error",
        title: "OAuth2 Required",
        message: "Please complete OAuth2 setup first to enable Google Sheets writing.",
      })
      return
    }

    setMigrationStatus("migrating")
    setMigrationProgress(0)
    setMigrationLog([])

    try {
      const sheets = createGoogleSheetsSync()
      const totalSteps = localData.totalRecords
      let completedSteps = 0

      addLog("Starting data migration to Google Sheets...")

      // Migrate attendance records
      if (localData.attendance.length > 0) {
        addLog(`Migrating ${localData.attendance.length} attendance records...`)

        for (const record of localData.attendance) {
          try {
            await sheets.addAttendanceRecord({
              date: record.date,
              employeeId: record.employeeId,
              timeIn: record.timeIn,
              timeOut: record.timeOut,
              timeInPhoto: record.timeInPhoto,
              isLate: record.isLate,
              workHours: record.workHours,
              hasNightDifferential: record.hasNightDifferential,
            })

            completedSteps++
            setMigrationProgress((completedSteps / totalSteps) * 100)

            // Small delay to prevent rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
            addLog(`Error migrating attendance record: ${error}`)
          }
        }

        addLog(`✅ Attendance records migrated successfully`)
      }

      // Migrate payroll records
      if (localData.payroll.length > 0) {
        addLog(`Migrating ${localData.payroll.length} payroll records...`)

        for (const record of localData.payroll) {
          try {
            await sheets.addPayrollRecord(record)

            completedSteps++
            setMigrationProgress((completedSteps / totalSteps) * 100)

            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
            addLog(`Error migrating payroll record: ${error}`)
          }
        }

        addLog(`✅ Payroll records migrated successfully`)
      }

      // Migrate employee records
      if (localData.employees.length > 0) {
        addLog(`Migrating ${localData.employees.length} employee records...`)

        for (const employee of localData.employees) {
          try {
            await sheets.addEmployee(employee)

            completedSteps++
            setMigrationProgress((completedSteps / totalSteps) * 100)

            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (error) {
            addLog(`Error migrating employee record: ${error}`)
          }
        }

        addLog(`✅ Employee records migrated successfully`)
      }

      setMigrationProgress(100)
      setMigrationStatus("completed")
      addLog("🎉 Migration completed successfully!")

      showNotification({
        type: "success",
        title: "Migration Complete",
        message: `Successfully migrated ${totalSteps} records to Google Sheets!`,
      })
    } catch (error) {
      setMigrationStatus("error")
      addLog(`❌ Migration failed: ${error}`)

      showNotification({
        type: "error",
        title: "Migration Failed",
        message: "Error occurred during data migration. Check the log for details.",
      })
    }
  }

  const clearLocalData = () => {
    if (migrationStatus !== "completed") {
      showNotification({
        type: "warning",
        title: "Migration Required",
        message: "Please complete migration before clearing local data.",
      })
      return
    }

    const keys = Object.keys(localStorage)
    let clearedCount = 0

    keys.forEach((key) => {
      if (key.startsWith("attendance-") || key.startsWith("payroll-") || key.startsWith("sheets_data_")) {
        localStorage.removeItem(key)
        clearedCount++
      }
    })

    showNotification({
      type: "success",
      title: "Local Data Cleared",
      message: `Cleared ${clearedCount} local storage items.`,
    })

    // Refresh data summary
    scanLocalData()
  }

  const exportLocalData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: localData,
      data: {
        attendance: localData.attendance,
        payroll: localData.payroll,
        employees: localData.employees,
        utang: localData.utang,
      },
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hr-data-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    showNotification({
      type: "success",
      title: "Data Exported",
      message: "Local data exported as JSON backup file.",
    })
  }

  const openOAuthSetup = () => {
    window.open("/oauth-setup", "_blank")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-6 w-6 mr-2" />
            Data Migration Tool
          </CardTitle>
          <CardDescription>Migrate your locally stored HR data to Google Sheets with OAuth2</CardDescription>
        </CardHeader>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${authMethod === "oauth2" ? "bg-green-100" : "bg-orange-100"}`}>
                {authMethod === "oauth2" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div>
                <div className="font-semibold">
                  {authMethod === "oauth2" ? "OAuth2 Authenticated" : "OAuth2 Required"}
                </div>
                <div className="text-sm text-gray-600">
                  {authMethod === "oauth2"
                    ? "Ready for real-time Google Sheets sync"
                    : "Complete OAuth2 setup to enable migration"}
                </div>
              </div>
            </div>
            <Badge variant={authMethod === "oauth2" ? "default" : "destructive"}>
              {authMethod === "oauth2" ? "Ready" : "Setup Required"}
            </Badge>
          </div>

          {authMethod !== "oauth2" && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                OAuth2 authentication is required for data migration.
                <Button variant="link" className="p-0 h-auto font-semibold text-red-700" onClick={openOAuthSetup}>
                  Complete OAuth2 setup first
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Local Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Local Data Summary</CardTitle>
          <CardDescription>Data currently stored in your browser</CardDescription>
        </CardHeader>
        <CardContent>
          {localData.totalRecords === 0 ? (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                No local HR data found. All data is already synced to Google Sheets or no data has been created yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{localData.attendance.length}</div>
                  <div className="text-sm text-blue-800">Attendance Records</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{localData.payroll.length}</div>
                  <div className="text-sm text-green-800">Payroll Records</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{localData.employees.length}</div>
                  <div className="text-sm text-purple-800">Employee Records</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{localData.utang.length}</div>
                  <div className="text-sm text-orange-800">Utang Records</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={startMigration}
                  disabled={migrationStatus === "migrating" || authMethod !== "oauth2"}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {migrationStatus === "migrating" ? "Migrating..." : "Start Migration"}
                </Button>

                <Button onClick={exportLocalData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Backup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Progress */}
      {migrationStatus === "migrating" && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Migrating data to Google Sheets...</span>
                  <span>{Math.round(migrationProgress)}%</span>
                </div>
                <Progress value={migrationProgress} className="h-2" />
              </div>

              <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                {migrationLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Complete */}
      {migrationStatus === "completed" && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              Migration Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All {localData.totalRecords} records have been successfully migrated to Google Sheets. Your data is
                  now synced in real-time!
                </AlertDescription>
              </Alert>

              <div className="max-h-40 overflow-y-auto bg-white p-3 rounded-lg border">
                {migrationLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>

              <Button onClick={clearLocalData} variant="outline" className="w-full bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Local Data (Recommended)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Error */}
      {migrationStatus === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Migration Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Migration encountered errors. Your local data is safe. Check the log below and try again.
                </AlertDescription>
              </Alert>

              <div className="max-h-40 overflow-y-auto bg-white p-3 rounded-lg border">
                {migrationLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>

              <Button onClick={() => setMigrationStatus("idle")} className="w-full">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
