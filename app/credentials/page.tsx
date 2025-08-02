"use client"

import { CredentialsSetup } from "@/components/credentials-setup"

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Configuration</h1>
          <p className="text-gray-600">Set up your Google Sheets API credentials</p>
        </div>

        <CredentialsSetup />
      </div>
    </div>
  )
}
