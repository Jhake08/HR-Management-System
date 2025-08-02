"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TestTube, CheckCircle, AlertTriangle, Database, Upload, Info } from "lucide-react"
import { createGoogleSheetsSync, hasCredentials, getAuthMethod } from "@/lib/google-sheets-api"

export function SyncTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<string>("unknown")

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])

    const results: any[] = []
    const currentAuthMethod = getAuthMethod()
    setAuthMethod(currentAuthMethod)

    try {
      // Test 1: Check credentials
      results.push({
        name: "Credentials Check",
        status: hasCredentials() ? "success" : "error",
        message: hasCredentials() ? `API Key found (${currentAuthMethod} mode)` : "Missing credentials",
      })

      if (!hasCredentials()) {
        setTestResults(results)
        setIsLoading(false)
        return
      }

      const sheets = createGoogleSheetsSync()

      // Test 2: Connection test (read-only)
      try {
        const connected = await sheets.testConnection()
        results.push({
          name: "Connection Test",
          status: connected ? "success" : "error",
          message: connected ? "Successfully connected to Google Sheets (read access)" : "Failed to connect",
        })
      } catch (error) {
        results.push({
          name: "Connection Test",
          status: "error",
          message: `Connection failed: ${error}`,
        })
      }

      // Test 3: Write permissions check
      try {
        const hasWrite = await sheets.hasWritePermissions()
        results.push({
          name: "Write Permissions",
          status: hasWrite ? "success" : "warning",
          message: hasWrite ? "Full write access available" : "Read-only mode (API key limitation)",
        })
      } catch (error) {
        results.push({
          name: "Write Permissions",
          status: "warning",
          message: "Using read-only API key authentication",
        })
      }

      // Test 4: Simulated write test
      try {
        const testEmployee = {
          name: "Test Employee",
          tin: "123-456-789-000",
          sss: "12-3456789-0",
          position: "Test Position",
          basicPay: 25000,
          gcashNumber: "09123456789",
          id: "TEST001",
          hireDate: new Date().toISOString().split("T")[0],
        }

        await sheets.addEmployee(testEmployee)
        results.push({
          name: "Write Test",
          status: "success",
          message: "Data stored locally (simulated Google Sheets write)",
        })
      } catch (error) {
        results.push({
          name: "Write Test",
          status: "error",
          message: `Write test failed: ${error}`,
        })
      }

      // Test 5: Simulated attendance test
      try {
        const testAttendance = {
          date: new Date().toISOString().split("T")[0],
          employeeId: "TEST001",
          timeIn: "08:00:00",
          timeOut: "17:00:00",
          timeInPhoto: "test_photo_url",
          isLate: false,
          workHours: "8.00",
          hasNightDifferential: false,
        }

        await sheets.addAttendanceRecord(testAttendance)
        results.push({
          name: "Attendance Sync Test",
          status: "success",
          message: "Attendance data stored locally (simulated sync)",
        })
      } catch (error) {
        results.push({
          name: "Attendance Sync Test",
          status: "error",
          message: `Attendance sync failed: ${error}`,
        })
      }
    } catch (error) {
      results.push({
        name: "General Error",
        status: "error",
        message: `Unexpected error: ${error}`,
      })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <Info className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <TestTube className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Google Sheets Sync Test
          </CardTitle>
          <CardDescription>Test your Google Sheets integration and verify data sync</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Method Info */}
          {authMethod !== "unknown" && (
            <Alert variant={authMethod === "api_key" ? "default" : "destructive"}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Authentication Method:</strong>{" "}
                {authMethod === "api_key" ? "API Key (Read-Only)" : "OAuth2 (Full Access)"}
                {authMethod === "api_key" && (
                  <div className="mt-2 text-sm">
                    📝 <strong>Note:</strong> API keys only support reading data. Write operations are simulated and
                    stored locally. For real Google Sheets writing, you'd need OAuth2 or Service Account authentication.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={runTests} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <TestTube className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Test Google Sheets Integration
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Test Results:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(result.status) as any}>{result.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {testResults.some((r) => r.status === "success") && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 Integration test completed!{" "}
                {authMethod === "api_key"
                  ? "Data is being stored locally as a fallback."
                  : "Your Google Sheets integration is fully functional."}
              </AlertDescription>
            </Alert>
          )}

          {testResults.some((r) => r.status === "error") && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some tests failed. Please check your API key, spreadsheet ID, and sheet permissions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* OAuth2 Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Full Write Access</CardTitle>
          <CardDescription>Enable real Google Sheets writing with OAuth2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Limitation:</strong> API keys only allow reading from Google Sheets. Write operations
              (adding attendance, payroll data) are currently simulated.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">To Enable Real Writing:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Set up OAuth2 in Google Cloud Console</li>
              <li>Create service account credentials</li>
              <li>Share your Google Sheet with the service account email</li>
              <li>Update the authentication method in the code</li>
            </ol>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold mb-2">Current Demo Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ Read existing data from Google Sheets</li>
              <li>✅ Test connection and permissions</li>
              <li>✅ Simulate write operations with local storage</li>
              <li>✅ Full UI functionality for HR operations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
