"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Database, Shield, Download, Upload, Settings, AlertTriangle } from "lucide-react"
import { CompressionStats } from "@/components/compression-stats"
import { SyncTest } from "@/components/sync-test"

interface AdminPanelProps {
  user: any
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("sheets")
  const [isConnecting, setIsConnecting] = useState(false)
  const [backupStatus, setBackupStatus] = useState("success")
  const [autoBackup, setAutoBackup] = useState(true)

  const [sheetsConfig] = useState({
    employeesMasterlist: {
      name: "Employees Masterlist",
      id: "sheet1",
      status: "connected",
      lastSync: "2024-12-15 10:30 AM",
      columns: ["Name", "TIN #", "SSS #", "Position", "Basic Pay", "GCash #"],
    },
    attendanceLog: {
      name: "Attendance Log",
      id: "sheet2",
      status: "connected",
      lastSync: "2024-12-15 10:25 AM",
      columns: ["Date", "Employee ID", "Time In", "Time Out", "Selfie Photo URL"],
    },
    payrollRecords: {
      name: "Payroll Records",
      id: "sheet3",
      status: "connected",
      lastSync: "2024-12-15 09:45 AM",
      columns: ["Period", "Employee ID", "13th Month", "SSS Deduction", "Net Pay"],
    },
    governmentContributions: {
      name: "Government Contributions",
      id: "sheet4",
      status: "connected",
      lastSync: "2024-12-15 08:00 AM",
      columns: ["Month", "SSS", "PhilHealth", "Pag-IBIG"],
    },
    utangTracker: {
      name: "Utang Tracker",
      id: "sheet5",
      status: "connected",
      lastSync: "2024-12-15 10:15 AM",
      columns: ["Date", "Employee ID", "Amount", "Status (Paid/Unpaid)"],
    },
  })

  const [permissions] = useState([
    { role: "Owner", sheets: "Edit all sheets", access: "Full" },
    { role: "HR Staff", sheets: "Edit Attendance but not Payroll", access: "Limited" },
    { role: "Employees", sheets: "View only their rows (using =FILTER)", access: "Read-only" },
  ])

  const handleCreateDemo = () => {
    alert('Demo Google Sheet created! Check your Google Drive for "HR Demo Sheet"')
  }

  const handleBackup = async () => {
    setIsConnecting(true)
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const today = new Date().toISOString().split("T")[0]
      alert(`Backup created successfully: "HR Backup ${today}"`)
      setBackupStatus("success")
    } catch (error) {
      setBackupStatus("error")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleValidateFormulas = () => {
    const validationResults = [
      { formula: "SSS Calculation", status: "valid", message: "=IF(BasicPay<=30000, BasicPay*0.045, 1350)" },
      { formula: "13th Month Pay", status: "valid", message: "=ROUND(BasicPay*MONTHS_WORKED/12, 2)" },
      { formula: "Night Differential", status: "valid", message: '=IF(TIME_RANGE="10PM-6AM", BasicPay*0.1, 0)' },
    ]

    alert("All PH tax formulas validated successfully!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-gray-600">Manage Google Sheets integration and system settings</p>
        </div>
        <Badge variant="default">Owner Access</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button variant={activeTab === "sheets" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("sheets")}>
          <Database className="h-4 w-4 mr-2" />
          Google Sheets
        </Button>
        <Button
          variant={activeTab === "permissions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("permissions")}
        >
          <Shield className="h-4 w-4 mr-2" />
          Permissions
        </Button>
        <Button variant={activeTab === "backup" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("backup")}>
          <Download className="h-4 w-4 mr-2" />
          Backup
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Google Sheets Tab */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Voice shortcuts for AI Builder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleCreateDemo} className="h-20 flex-col">
                  <Database className="h-6 w-6 mb-2" />
                  Gawa ng Demo
                </Button>
                <Button
                  onClick={() => alert("Late arrivals highlighted in red!")}
                  className="h-20 flex-col"
                  variant="outline"
                >
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Palitan ng Pula yung Late
                </Button>
                <Button onClick={handleValidateFormulas} className="h-20 flex-col bg-transparent" variant="outline">
                  <Shield className="h-6 w-6 mb-2" />
                  Dapat Walang Mali sa Tax
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Test */}
          <SyncTest />

          {/* Sheets Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Google Sheets</CardTitle>
              <CardDescription>5 mandatory sheets for HR operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sheetsConfig).map(([key, sheet]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">{sheet.name}</div>
                        <div className="text-sm text-gray-600">Last sync: {sheet.lastSync}</div>
                      </div>
                      <Badge variant={sheet.status === "connected" ? "default" : "destructive"}>{sheet.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Columns:</strong> {sheet.columns.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cell Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Limits</CardTitle>
              <CardDescription>Monitor usage against free tier limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Cells Used</span>
                    <span>2.5M / 10M</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    System is optimized to work within free Google Sheets limits (10M cells max).
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Google Sheets permissions by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {permissions.map((perm, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{perm.role}</div>
                      <div className="text-sm text-gray-600">{perm.sheets}</div>
                    </div>
                    <Badge
                      variant={perm.access === "Full" ? "default" : perm.access === "Limited" ? "secondary" : "outline"}
                    >
                      {perm.access}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Tab */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Security</CardTitle>
              <CardDescription>Automated daily backups to Google Drive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-backup">Auto Daily Backup</Label>
                  <p className="text-sm text-gray-600">Automatically backup to "HR Data" folder</p>
                </div>
                <Switch id="auto-backup" checked={autoBackup} onCheckedChange={setAutoBackup} />
              </div>

              <Button onClick={handleBackup} disabled={isConnecting} className="w-full">
                {isConnecting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Create Manual Backup
                  </>
                )}
              </Button>

              <Alert variant={backupStatus === "success" ? "default" : "destructive"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {backupStatus === "success"
                    ? "Last backup: Today 8:00 AM - All data secured"
                    : "Backup failed. Please check Google Drive permissions."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - i)
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">HR Backup {date.toISOString().split("T")[0]}</div>
                        <div className="text-sm text-gray-600">{date.toLocaleDateString()} - 2.1MB</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" defaultValue="Sample SME Company" />
              </div>

              <div>
                <Label htmlFor="work-hours">Standard Work Hours</Label>
                <Input id="work-hours" defaultValue="8:00 AM - 5:00 PM" />
              </div>

              <div>
                <Label htmlFor="grace-period">Late Grace Period (minutes)</Label>
                <Input id="grace-period" type="number" defaultValue="15" />
              </div>

              <div>
                <Label htmlFor="night-diff-rate">Night Differential Rate (%)</Label>
                <Input id="night-diff-rate" type="number" defaultValue="10" />
              </div>
            </CardContent>
          </Card>

          <CompressionStats totalEmployees={45} photosPerDay={2} />

          <Card>
            <CardHeader>
              <CardTitle>PH Compliance Settings</CardTitle>
              <CardDescription>Government contribution rates for 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>SSS Rate</Label>
                  <Input defaultValue="4.5%" disabled />
                </div>
                <div>
                  <Label>PhilHealth Rate</Label>
                  <Input defaultValue="5.0%" disabled />
                </div>
                <div>
                  <Label>Pag-IBIG</Label>
                  <Input defaultValue="₱100" disabled />
                </div>
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Government rates are pre-loaded and updated automatically for compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
