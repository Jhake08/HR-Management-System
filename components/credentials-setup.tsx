"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Eye, EyeOff, Save, Key, Database, CheckCircle, AlertTriangle } from "lucide-react"

export function CredentialsSetup() {
  const [apiKey, setApiKey] = useState("")
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [activeMethod, setActiveMethod] = useState("browser")

  useEffect(() => {
    // Load existing credentials from localStorage
    const savedApiKey = localStorage.getItem("GOOGLE_SHEETS_API_KEY")
    const savedSpreadsheetId = localStorage.getItem("SPREADSHEET_ID")

    if (savedApiKey) setApiKey(savedApiKey)
    if (savedSpreadsheetId) setSpreadsheetId(savedSpreadsheetId)

    setIsSaved(!!(savedApiKey && savedSpreadsheetId))
  }, [])

  const saveCredentials = () => {
    if (!apiKey || !spreadsheetId) {
      alert("Please provide both API Key and Spreadsheet ID")
      return
    }

    // Save to localStorage (browser storage)
    localStorage.setItem("GOOGLE_SHEETS_API_KEY", apiKey)
    localStorage.setItem("SPREADSHEET_ID", spreadsheetId)

    setIsSaved(true)
    alert("Credentials saved successfully!")
  }

  const clearCredentials = () => {
    localStorage.removeItem("GOOGLE_SHEETS_API_KEY")
    localStorage.removeItem("SPREADSHEET_ID")
    setApiKey("")
    setSpreadsheetId("")
    setIsSaved(false)
    alert("Credentials cleared!")
  }

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : url
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-6 w-6 mr-2" />
            Configure API Credentials
          </CardTitle>
          <CardDescription>
            Set up your Google Sheets API key and Spreadsheet ID for data synchronization
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeMethod} onValueChange={setActiveMethod} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browser">Browser Storage</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* Browser Storage Method (Recommended for Demo) */}
        <TabsContent value="browser">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Method 1: Browser Storage (Recommended)</CardTitle>
              <CardDescription>
                Store credentials in your browser's local storage. Perfect for testing and demo purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best for:</strong> Testing, demos, and single-user setups. Credentials stay in your browser.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key-browser">Google Sheets API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key-browser"
                      type={showApiKey ? "text" : "password"}
                      placeholder="AIzaSyD..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spreadsheet-id-browser">Spreadsheet ID or URL</Label>
                  <Input
                    id="spreadsheet-id-browser"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or full URL"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(extractSpreadsheetId(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Paste the full Google Sheets URL or just the ID from the URL</p>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={saveCredentials} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Credentials
                  </Button>
                  <Button onClick={clearCredentials} variant="outline">
                    Clear
                  </Button>
                </div>

                {isSaved && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Credentials saved! The system will now use these for all Google Sheets operations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environment Variables Method */}
        <TabsContent value="env">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Method 2: Environment Variables (Production)</CardTitle>
              <CardDescription>
                Set up environment variables for production deployment. More secure for live systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best for:</strong> Production deployments, team environments, and enhanced security.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">For Vercel Deployment:</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">1. Go to your Vercel project settings</Label>
                      <div className="mt-1 p-3 bg-white border rounded font-mono text-sm">
                        Project Settings → Environment Variables
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">2. Add these variables:</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white border rounded">
                          <code className="text-sm">NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY</code>
                          <Button
                            onClick={() => copyToClipboard("NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY")}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border rounded">
                          <code className="text-sm">NEXT_PUBLIC_SPREADSHEET_ID</code>
                          <Button
                            onClick={() => copyToClipboard("NEXT_PUBLIC_SPREADSHEET_ID")}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">For Local Development:</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Create a .env.local file in your project root:</Label>
                      <div className="mt-1 p-3 bg-white border rounded font-mono text-sm">
                        <div>NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here</div>
                        <div>NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_here</div>
                      </div>
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            "NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here\nNEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_here",
                          )
                        }
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Template
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Never commit .env.local to version control. Add it to your .gitignore
                    file.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Method */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Method 3: Manual Code Entry</CardTitle>
              <CardDescription>
                Directly modify the code with your credentials. Only for testing purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This method is not secure for production. Use only for testing.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Edit lib/google-sheets-api.ts:</Label>
                  <div className="mt-1 p-4 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto">
                    <div>export const createGoogleSheetsSync = () =&gt; {`{`}</div>
                    <div className="ml-2">const config: GoogleSheetsConfig = {`{`}</div>
                    <div className="ml-4 text-yellow-400">spreadsheetId: "YOUR_SPREADSHEET_ID_HERE",</div>
                    <div className="ml-4 text-yellow-400">apiKey: "YOUR_API_KEY_HERE",</div>
                    <div className="ml-4">ranges: {`{`}</div>
                    <div className="ml-6">employees: "Employees Masterlist!A:H",</div>
                    <div className="ml-6">// ... other ranges</div>
                    <div className="ml-4">{`}`},</div>
                    <div className="ml-2">{`}`}</div>
                    <div>{`}`}</div>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(`spreadsheetId: "${spreadsheetId}",\napiKey: "${apiKey}",`)}
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={!apiKey || !spreadsheetId}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Your Values
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-blue-600" />
                <span>Google Sheets API Key</span>
              </div>
              <Badge variant={apiKey ? "default" : "destructive"}>{apiKey ? "✓ Configured" : "✗ Missing"}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-green-600" />
                <span>Spreadsheet ID</span>
              </div>
              <Badge variant={spreadsheetId ? "default" : "destructive"}>
                {spreadsheetId ? "✓ Configured" : "✗ Missing"}
              </Badge>
            </div>

            {apiKey && spreadsheetId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 All credentials configured! Your HR system is ready to sync with Google Sheets.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
