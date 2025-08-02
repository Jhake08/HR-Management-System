"use client"

import { OAuthSetup } from "@/components/oauth-setup"

export default function OAuthSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OAuth2 Setup</h1>
          <p className="text-gray-600">Enable full Google Sheets write access with OAuth2 authentication</p>
        </div>

        <OAuthSetup />
      </div>
    </div>
  )
}
