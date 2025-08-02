"use client"

import { EnvSetupGuide } from "@/components/env-setup-guide"

export default function EnvSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Variables Setup</h1>
          <p className="text-gray-600">Configure your Google Sheets API credentials securely</p>
        </div>

        <EnvSetupGuide />
      </div>
    </div>
  )
}
