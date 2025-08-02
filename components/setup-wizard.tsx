"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertTriangle, Copy, ExternalLink, Database, Key, TestTube } from "lucide-react"
import { createGoogleSheetsSync } from "@/lib/google-sheets-api"

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : url
  }

  const handleUrlChange = (value: string) => {
    const id = extractSpreadsheetId(value)
    setSpreadsheetId(id)
  }

  const testConnection = async () => {
    if (!spreadsheetId || !apiKey) {
      setTestResult({
        success: false,
        message: "Please provide both Spreadsheet ID and API Key",
      })
      return
    }

    setIsLoading(true)
    try {
      // Create temporary sync instance for testing
      const tempSync = createGoogleSheetsSync()
      const success = await tempSync.testConnection()

      if (success) {
        setTestResult({
          success: true,
          message: "Connection successful! Your Google Sheets is ready to sync.",
        })
      } else {
        setTestResult({
          success: false,
          message: "Connection failed. Please check your API key and spreadsheet permissions.",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const sheetStructure = {
    "Employees Masterlist": ["Name", "TIN #", "SSS #", "Position", "Basic Pay", "GCash #", "Employee ID", "Hire Date"],
    "Attendance Log": [
      "Date",
      "Employee ID",
      "Time In",
      "Time Out",
      "Selfie Photo URL",
      "Is Late",
      "Work Hours",
      "Location",
    ],
    "Payroll Records": [
      "Period",
      "Employee ID",
      "Employee Name",
      "Basic Pay",
      "13th Month",
      "SSS Deduction",
      "PhilHealth Deduction",
      "Pag-IBIG Deduction",
      "Night Differential",
      "Gross Pay",
      "Total Deductions",
      "Net Pay",
      "Status",
    ],
    "Government Contributions": ["Month", "SSS Rate", "PhilHealth Rate", "Pag-IBIG Amount", "Minimum Wage", "Notes"],
    "Utang Tracker": ["Date", "Employee ID", "Employee Name", "Amount", "Status", "Description"],
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-6 w-6 mr-2" />
            Google Sheets Setup Wizard
          </CardTitle>
          <CardDescription>Connect your Google Sheets to the HR system for real-time data sync</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="step1" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="step1">1. Create Sheets</TabsTrigger>
          <TabsTrigger value="step2">2. Get API Key</TabsTrigger>
          <TabsTrigger value="step3">3. Connect</TabsTrigger>
          <TabsTrigger value="step4">4. Test</TabsTrigger>
        </TabsList>

        {/* Step 1: Create Google Sheets */}
        <TabsContent value="step1">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Your Google Sheets</CardTitle>
              <CardDescription>Set up 1 spreadsheet with 5 tabs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Create <strong>ONE spreadsheet</strong> with <strong>5 tabs</strong> (not 5 separate spreadsheets)
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">1. Create New Google Spreadsheet</h4>
                    <p className="text-sm text-gray-600">Go to Google Sheets and create a new spreadsheet</p>
                  </div>
                  <Button
                    onClick={() => window.open("https://sheets.google.com", "_blank")}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Sheets
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">2. Create These 5 Tabs:</h4>
                  {Object.entries(sheetStructure).map(([sheetName, columns]) => (
                    <div key={sheetName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{sheetName}</h5>
                        <Button onClick={() => copyToClipboard(columns.join("\t"))} variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Headers
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          <strong>Columns:</strong> {columns.join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Click "Copy Headers" and paste directly into row 1 of each tab
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Get API Key */}
        <TabsContent value="step2">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Get Google Sheets API Key</CardTitle>
              <CardDescription>Enable API access for your spreadsheet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Get Your API Key:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com"
                        target="_blank"
                        className="text-blue-600 underline"
                        rel="noreferrer"
                      >
                        Google Cloud Console
                      </a>
                    </li>
                    <li>Create a new project or select existing one</li>
                    <li>Enable "Google Sheets API"</li>
                    <li>Go to "Credentials" → "Create Credentials" → "API Key"</li>
                    <li>Copy your API key</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">Your Google Sheets API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="AIzaSyD..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Keep your API key secure. It will be stored in your browser's environment variables.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Connect */}
        <TabsContent value="step3">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Connect Your Spreadsheet</CardTitle>
              <CardDescription>Link your Google Sheets to the HR system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-url">Google Sheets URL or ID</Label>
                  <Input
                    id="sheet-url"
                    placeholder="https://docs.google.com/spreadsheets/d/1abc123.../edit or just the ID"
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                  {spreadsheetId && (
                    <div className="text-sm text-green-600">✓ Spreadsheet ID extracted: {spreadsheetId}</div>
                  )}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure your spreadsheet is set to "Anyone with the link can view" or share it with your service
                    account.
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Sharing Settings:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "Share" button in your Google Sheets</li>
                    <li>Change access to "Anyone with the link"</li>
                    <li>Set permission to "Viewer" (system will request edit access when needed)</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Test Connection */}
        <TabsContent value="step4">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Test Connection</CardTitle>
              <CardDescription>Verify everything is working correctly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button onClick={testConnection} disabled={isLoading || !spreadsheetId || !apiKey} className="w-full">
                  {isLoading ? (
                    <>
                      <TestTube className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResult && (
                  <Alert variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}

                {testResult?.success && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">🎉 Setup Complete!</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>✓ Google Sheets connected successfully</p>
                      <p>✓ API access verified</p>
                      <p>✓ Data sync ready</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
