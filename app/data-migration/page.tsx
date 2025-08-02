"use client"

import { DataMigration } from "@/components/data-migration"

export default function DataMigrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Migration</h1>
          <p className="text-gray-600">Migrate your local HR data to Google Sheets with OAuth2</p>
        </div>

        <DataMigration />
      </div>
    </div>
  )
}
