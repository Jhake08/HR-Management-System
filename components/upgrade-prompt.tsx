"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Upload, Database, ExternalLink, CheckCircle } from "lucide-react"

interface UpgradePromptProps {
  onUpgrade?: () => void
  showInline?: boolean
}

export function UpgradePrompt({ onUpgrade, showInline = false }: UpgradePromptProps) {
  const [authMethod, setAuthMethod] = useState<string>("none")
  const [localDataCount, setLocalDataCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [oauthConfigured, setOauthConfigured] = useState(false)
  const [oauthAuthenticated, setOauthAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication status
    const updateAuthStatus = () => {
      // Check OAuth first (PRIORITY)
      const clientId = localStorage.getItem("GOOGLE_CLIENT_ID")
      const clientSecret = localStorage.getItem("GOOGLE_CLIENT_SECRET")
      const isAuthenticated = localStorage.getItem("oauth_authenticated") === "true"

      setOauthConfigured(!!(clientId && clientSecret))
      setOauthAuthenticated(isAuthenticated)

      if (clientId && clientSecret && isAuthenticated) {
        setAuthMethod("oauth2")
        return
      }

      // Check API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
      if (apiKey && apiKey.startsWith("AIza")) {
        setAuthMethod("api_key")
        return
      }

      setAuthMethod("none")
    }

    updateAuthStatus()

    // Count local data that needs migration
    let count = 0
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("attendance-") || key.startsWith("payroll-") || key.startsWith("sheets_data_")) {
        const data = localStorage.getItem(key)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            count += Array.isArray(parsed) ? parsed.length : 1
          } catch (e) {
            count += 1
          }
        }
      }
    })
    setLocalDataCount(count)

    // Listen for localStorage changes to update status in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "oauth_authenticated" || e.key === "GOOGLE_CLIENT_ID" || e.key === "GOOGLE_CLIENT_SECRET") {
        updateAuthStatus()
      }
    }

    // Listen for focus events (when user switches back to this tab)
    const handleFocus = () => {
      updateAuthStatus()
    }

    // Listen for custom events from other components
    const handleAuthUpdate = () => {
      updateAuthStatus()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("oauth-status-changed", handleAuthUpdate)

    // Also check periodically for changes in the same tab
    const interval = setInterval(updateAuthStatus, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("oauth-status-changed", handleAuthUpdate)
      clearInterval(interval)
    }
  }, [])

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Use window.open instead of router.push to avoid navigation issues
      window.open("/oauth-setup", "_blank")
    }
  }

  const handleMigrateClick = () => {
    window.open("/data-migration", "_blank")
  }

  // Don't show upgrade prompt if OAuth is fully configured and authenticated
  if (authMethod === "oauth2" && oauthConfigured && oauthAuthenticated) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900">OAuth2 Activated!</CardTitle>
                <CardDescription className="text-green-700">
                  Real-time Google Sheets sync is now enabled
                </CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Full Access
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-100">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 <strong>Success!</strong> Your HR system now has full Google Sheets write access. All attendance,
              payroll, and employee data will sync in real-time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const UpgradeCard = () => (
    <Card className={`border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 ${showInline ? "" : "mb-6"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Shield className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-orange-900">
                {oauthConfigured && !oauthAuthenticated ? "Complete OAuth2 Authentication" : "Upgrade to Full Access"}
              </CardTitle>
              <CardDescription className="text-orange-700">
                {oauthConfigured && !oauthAuthenticated
                  ? "OAuth2 configured - authenticate to enable real-time sync"
                  : "Enable real-time Google Sheets sync with OAuth2"}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {authMethod === "api_key" ? "Read-Only Mode" : oauthConfigured ? "Authentication Needed" : "Demo Mode"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">OAuth2 Configuration</span>
              <Badge variant={oauthConfigured ? "default" : "destructive"}>
                {oauthConfigured ? "✓ Done" : "✗ Needed"}
              </Badge>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Google Authentication</span>
              <Badge variant={oauthAuthenticated ? "default" : "destructive"}>
                {oauthAuthenticated ? "✓ Done" : "✗ Needed"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">Current Limitations</h4>
            <ul className="text-sm space-y-1 text-orange-800">
              <li>• Data stored locally only</li>
              <li>• No real-time Google Sheets sync</li>
              <li>• Limited to single device</li>
              <li>• Risk of data loss</li>
            </ul>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">With OAuth2 Upgrade</h4>
            <ul className="text-sm space-y-1 text-green-800">
              <li>• Real-time Google Sheets sync</li>
              <li>• Multi-device access</li>
              <li>• Automatic backups</li>
              <li>• Team collaboration</li>
            </ul>
          </div>
        </div>

        {localDataCount > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>{localDataCount} records</strong> stored locally can be migrated to Google Sheets after upgrade.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-3">
          <Button onClick={handleUpgradeClick} className="flex-1 bg-orange-600 hover:bg-orange-700">
            <Shield className="h-4 w-4 mr-2" />
            <ExternalLink className="h-4 w-4 mr-1" />
            {oauthConfigured && !oauthAuthenticated ? "Complete Authentication" : "Setup OAuth2"}
          </Button>

          {localDataCount > 0 && (
            <Button
              onClick={handleMigrateClick}
              variant="outline"
              className="border-blue-300 text-blue-700 bg-transparent"
            >
              <Upload className="h-4 w-4 mr-2" />
              <ExternalLink className="h-4 w-4 mr-1" />
              Migrate Data
            </Button>
          )}
        </div>

        {!showDetails && (
          <Button
            onClick={() => setShowDetails(true)}
            variant="ghost"
            size="sm"
            className="w-full text-orange-700 hover:text-orange-800"
          >
            Show upgrade details
          </Button>
        )}

        {showDetails && (
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="font-semibold mb-3">{oauthConfigured ? "Complete Authentication:" : "Upgrade Process:"}</h4>
            <div className="space-y-2 text-sm">
              {!oauthConfigured ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                      1
                    </div>
                    <span>Set up OAuth2 credentials in Google Cloud Console</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                      2
                    </div>
                    <span>Configure Client ID and Client Secret</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                      3
                    </div>
                    <span>Authenticate with Google (one-time)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-600">
                      4
                    </div>
                    <span>Enjoy real-time Google Sheets sync!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-600">
                      ✓
                    </div>
                    <span>OAuth2 credentials configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600">
                      2
                    </div>
                    <span>Click "Authenticate with Google" to complete setup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-600">
                      3
                    </div>
                    <span>Enjoy real-time Google Sheets sync!</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return showInline ? <UpgradeCard /> : <UpgradeCard />
}
