"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, AlertTriangle, ExternalLink, FileText, Cloud } from "lucide-react"

export function EnvSetupGuide() {
  const [apiKey, setApiKey] = useState("")
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : url
  }

  const handleSpreadsheetChange = (value: string) => {
    const id = extractSpreadsheetId(value)
    setSpreadsheetId(id)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const generateEnvContent = () => {
    return `# Google Sheets API Configuration for PH HR System
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=${apiKey}
NEXT_PUBLIC_SPREADSHEET_ID=${spreadsheetId}

# Generated on: ${new Date().toLocaleString()}
# Keep this file secure and never commit to version control`
  }

  const generateVercelCommands = () => {
    return `# Run these commands in your terminal (one at a time)
vercel env add NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
# When prompted, enter: ${apiKey}

vercel env add NEXT_PUBLIC_SPREADSHEET_ID  
# When prompted, enter: ${spreadsheetId}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-6 w-6 mr-2" />
            Method 2: Environment Variables Setup
          </CardTitle>
          <CardDescription>
            Configure your credentials using environment variables for secure production deployment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Enter Your Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Enter Your Credentials</CardTitle>
          <CardDescription>First, let's collect your API key and Spreadsheet ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Sheets API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIzaSyD..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Get this from{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                className="text-blue-600 underline"
                rel="noreferrer"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheet-id">Google Sheets URL or ID</Label>
            <Input
              id="spreadsheet-id"
              placeholder="https://docs.google.com/spreadsheets/d/1abc123.../edit or just the ID"
              onChange={(e) => handleSpreadsheetChange(e.target.value)}
            />
            {spreadsheetId && <div className="text-sm text-green-600">✓ Spreadsheet ID extracted: {spreadsheetId}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Local Development Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Step 2: Local Development Setup
          </CardTitle>
          <CardDescription>Create .env.local file for local development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> The .env.local file should be in your project's root directory (same level as
              package.json)
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">1. Create .env.local file</Label>
              <Badge variant="secondary">Required</Badge>
            </div>

            <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
              <pre className="whitespace-pre-wrap">{generateEnvContent()}</pre>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => copyToClipboard(generateEnvContent())}
                disabled={!apiKey || !spreadsheetId}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy .env.local Content
              </Button>
              {showSuccess && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied!
                </div>
              )}
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              After creating the file, restart your development server (npm run dev) to load the new environment
              variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 3: Vercel Production Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Step 3: Vercel Production Setup
          </CardTitle>
          <CardDescription>Configure environment variables for production deployment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: Vercel Dashboard */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Method A: Vercel Dashboard
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Vercel project dashboard</li>
                <li>Navigate to Settings → Environment Variables</li>
                <li>Add these two variables:</li>
              </ol>

              <div className="mt-3 space-y-2">
                <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                  <div className="font-semibold">Variable Name:</div>
                  <div>NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY</div>
                  <div className="font-semibold mt-1">Value:</div>
                  <div className="break-all">{apiKey || "your_api_key_here"}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded font-mono text-xs">
                  <div className="font-semibold">Variable Name:</div>
                  <div>NEXT_PUBLIC_SPREADSHEET_ID</div>
                  <div className="font-semibold mt-1">Value:</div>
                  <div className="break-all">{spreadsheetId || "your_spreadsheet_id_here"}</div>
                </div>
              </div>

              <Button
                onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
                variant="outline"
                size="sm"
                className="mt-3 w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Vercel Dashboard
              </Button>
            </div>

            {/* Method B: Vercel CLI */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Method B: Vercel CLI</h4>
              <p className="text-sm text-gray-600 mb-3">Run these commands in your terminal:</p>

              <div className="p-3 bg-gray-900 text-green-400 rounded font-mono text-xs">
                <pre className="whitespace-pre-wrap">{generateVercelCommands()}</pre>
              </div>

              <Button
                onClick={() => copyToClipboard(generateVercelCommands())}
                disabled={!apiKey || !spreadsheetId}
                variant="outline"
                size="sm"
                className="mt-3 w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy CLI Commands
              </Button>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              After adding environment variables to Vercel, redeploy your application to apply the changes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 4: Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 4: Verify Setup</CardTitle>
          <CardDescription>Check if your environment variables are working</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Local Development</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Create .env.local file</li>
                <li>✓ Add your credentials</li>
                <li>✓ Restart dev server</li>
                <li>✓ Test the connection</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2">Production Deployment</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Add env vars to Vercel</li>
                <li>✓ Redeploy application</li>
                <li>✓ Test live connection</li>
                <li>✓ Monitor sync status</li>
              </ul>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Once setup is complete, your HR system will automatically use these environment variables for all Google
              Sheets operations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Never commit .env.local to version control!</strong> It's already added to .gitignore.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✅ Do:</h4>
                <ul className="space-y-1">
                  <li>• Use environment variables for production</li>
                  <li>• Keep API keys secure</li>
                  <li>• Restrict API key permissions</li>
                  <li>• Monitor API usage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">❌ Don't:</h4>
                <ul className="space-y-1">
                  <li>• Commit credentials to Git</li>
                  <li>• Share API keys publicly</li>
                  <li>• Use production keys in development</li>
                  <li>• Ignore security warnings</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
