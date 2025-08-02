"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { getGoogleOAuth } from "@/lib/google-oauth"

export default function OAuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const error = urlParams.get("error")

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code) {
          throw new Error("No authorization code received")
        }

        const oauth = getGoogleOAuth()
        await oauth.exchangeCodeForTokens(code)

        setStatus("success")
        setMessage("Successfully authenticated with Google! You now have full access to Google Sheets.")

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: "OAUTH_SUCCESS" }, window.location.origin)
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close()
        }, 3000)
      } catch (error: any) {
        console.error("OAuth callback error:", error)
        setStatus("error")
        setMessage(error.message || "Authentication failed")
      }
    }

    handleOAuthCallback()
  }, [])

  const closeWindow = () => {
    window.close()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>OAuth Authentication</CardTitle>
          <CardDescription>Processing your Google authentication...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Authenticating with Google...</p>
            </div>
          )}

          {status === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Authentication Successful!</p>
                  <p className="text-sm">{message}</p>
                  <p className="text-xs text-gray-600">This window will close automatically...</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Authentication Failed</p>
                    <p className="text-sm">{message}</p>
                  </div>
                </AlertDescription>
              </Alert>

              <Button onClick={closeWindow} className="w-full">
                Close Window
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
