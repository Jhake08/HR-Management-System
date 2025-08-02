"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, ExternalLink, Key, Shield, Zap, Copy, Eye, EyeOff } from "lucide-react"
import { showNotification } from "@/utils/notifications"

interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function OAuthSetup() {
  const [config, setConfig] = useState<OAuthConfig>({
    clientId: "",
    clientSecret: "",
    redirectUri: `${typeof window !== "undefined" ? window.location.origin : ""}/oauth/callback`,
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if OAuth is already configured
    const savedConfig = localStorage.getItem("oauth_config")
    const oauthConfigured = localStorage.getItem("oauth_configured") === "true"
    const accessToken = localStorage.getItem("oauth_access_token")

    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
        setIsConfigured(oauthConfigured)
        setIsAuthenticated(!!accessToken && oauthConfigured)
      } catch (error) {
        console.error("Error parsing saved OAuth config:", error)
      }
    }

    // Update redirect URI based on current origin
    if (typeof window !== "undefined") {
      setConfig((prev) => ({
        ...prev,
        redirectUri: `${window.location.origin}/oauth/callback`,
      }))
    }
  }, [])

  const handleSaveCredentials = () => {
    if (!config.clientId.trim() || !config.clientSecret.trim()) {
      showNotification("Please fill in all required fields", "error")
      return
    }

    try {
      // Save configuration
      localStorage.setItem("oauth_config", JSON.stringify(config))
      localStorage.setItem("oauth_configured", "true")

      setIsConfigured(true)
      showNotification("OAuth credentials saved successfully!", "success")

      // Dispatch events for real-time updates
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("oauth-status-changed"))
    } catch (error) {
      console.error("Error saving OAuth config:", error)
      showNotification("Failed to save OAuth credentials", "error")
    }
  }

  const handleAuthenticate = async () => {
    if (!isConfigured) {
      showNotification("Please save your OAuth credentials first", "error")
      return
    }

    setIsLoading(true)

    try {
      // Create OAuth URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
      })

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

      // Open in new window instead of using router.push to avoid blob URL conflicts
      const authWindow = window.open(authUrl, "_blank", "width=500,height=600")

      if (!authWindow) {
        throw new Error("Failed to open authentication window. Please check your popup blocker.")
      }

      showNotification("Opening Google authentication...", "info")

      // Listen for the authentication completion
      const checkAuth = setInterval(() => {
        const token = localStorage.getItem("oauth_access_token")
        if (token) {
          setIsAuthenticated(true)
          clearInterval(checkAuth)
          setIsLoading(false)
          showNotification("Successfully authenticated with Google!", "success")

          // Dispatch events for real-time updates
          window.dispatchEvent(new Event("storage"))
          window.dispatchEvent(new CustomEvent("oauth-status-changed"))
        }
      }, 1000)

      // Clean up interval after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth)
        setIsLoading(false)
      }, 300000)
    } catch (error) {
      console.error("Authentication error:", error)
      showNotification(error instanceof Error ? error.message : "Authentication failed", "error")
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    try {
      // Clear OAuth tokens
      localStorage.removeItem("oauth_access_token")
      localStorage.removeItem("oauth_refresh_token")
      localStorage.removeItem("oauth_token_expires")

      setIsAuthenticated(false)
      showNotification("Successfully logged out from Google", "success")

      // Dispatch events for real-time updates
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("oauth-status-changed"))
    } catch (error) {
      console.error("Logout error:", error)
      showNotification("Failed to logout", "error")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showNotification("Copied to clipboard!", "success")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            OAuth2 Setup Status
          </CardTitle>
          <CardDescription>Current status of your OAuth2 configuration and authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Credentials</p>
                  <p className="text-sm text-muted-foreground">Client ID & Secret</p>
                </div>
              </div>
              {isConfigured ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Authentication</p>
                  <p className="text-sm text-muted-foreground">Google Account</p>
                </div>
              </div>
              {isAuthenticated ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {isConfigured && isAuthenticated && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 <strong>OAuth2 Setup Complete!</strong> You now have full read/write access to Google Sheets. You can now
            use all features including real-time sync, employee management, and payroll processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Google Cloud Console Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold">
              1
            </span>
            Create Google Cloud Project
          </CardTitle>
          <CardDescription>Set up OAuth2 credentials in Google Cloud Console</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Follow these steps to create OAuth2 credentials:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Google Sheets API</li>
              <li>Go to "Credentials" → "Create Credentials" → "OAuth client ID"</li>
              <li>Choose "Web application" as the application type</li>
              <li>Add the redirect URI below to "Authorized redirect URIs"</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium">Authorized Redirect URI</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={config.redirectUri} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(config.redirectUri)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Copy this URL and add it to your OAuth client configuration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Configure Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold">
              2
            </span>
            Configure OAuth Credentials
          </CardTitle>
          <CardDescription>Enter your OAuth2 client credentials from Google Cloud Console</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
                value={config.clientId}
                onChange={(e) => setConfig((prev) => ({ ...prev, clientId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                id="clientSecret"
                type={showClientSecret ? "text" : "password"}
                placeholder="GOCSPX-abcdefghijklmnopqrstuvwxyz"
                value={config.clientSecret}
                onChange={(e) => setConfig((prev) => ({ ...prev, clientSecret: e.target.value }))}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveCredentials} className="w-full">
            <Key className="w-4 h-4 mr-2" />
            Save OAuth Credentials
          </Button>

          {isConfigured && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                OAuth credentials have been saved successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Authenticate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm font-bold">
              3
            </span>
            Authenticate with Google
          </CardTitle>
          <CardDescription>Grant permission to access your Google Sheets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to authenticate with Google and grant access to your spreadsheets.
              </p>
              <Button onClick={handleAuthenticate} disabled={!isConfigured || isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Authenticate with Google
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🎉 <strong>Successfully authenticated!</strong> You now have full read/write access to Google Sheets.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleLogout}>
                  Logout from Google
                </Button>
                <Button asChild>
                  <a href="/">Return to Dashboard</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>🔒 Your OAuth credentials are stored locally in your browser and never sent to external servers.</p>
            <p>🛡️ This application only requests access to Google Sheets and cannot access other Google services.</p>
            <p>🔄 You can revoke access at any time through your Google Account settings.</p>
            <p>📱 Authentication tokens are automatically refreshed to maintain secure access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
