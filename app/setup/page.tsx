"use client"

import { SetupWizard } from "@/components/setup-wizard"
import { SyncStatus } from "@/components/sync-status"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SetupPage() {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR System Setup</h1>
          <p className="text-gray-600">Connect your Google Sheets for real-time data synchronization</p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="setup">Setup Wizard</TabsTrigger>
            <TabsTrigger value="status">Sync Status</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <SetupWizard />
          </TabsContent>

          <TabsContent value="status">
            <SyncStatus isConnected={isConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
