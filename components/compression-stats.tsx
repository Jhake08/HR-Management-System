"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, HardDrive, Zap, CheckCircle } from "lucide-react"
import { estimateStorageImpact } from "@/utils/photo-compression"

interface CompressionStatsProps {
  totalEmployees?: number
  photosPerDay?: number
}

export function CompressionStats({ totalEmployees = 45, photosPerDay = 2 }: CompressionStatsProps) {
  const [stats, setStats] = useState({
    dailyStorage: 0,
    monthlyStorage: 0,
    yearlyStorage: 0,
    cellsUsed: 0,
  })

  useEffect(() => {
    const compressionRatio = 0.75 // 75% compression
    const impact = estimateStorageImpact(photosPerDay, totalEmployees, compressionRatio)
    setStats(impact)
  }, [totalEmployees, photosPerDay])

  const formatStorage = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(0)} KB`
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`
  }

  const cellUsagePercentage = (stats.cellsUsed / 10000000) * 100 // 10M cell limit

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HardDrive className="h-5 w-5 mr-2" />
          Storage Impact Analysis
        </CardTitle>
        <CardDescription>Photo compression impact on Google Sheets storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Daily</span>
              <Camera className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-700">{formatStorage(stats.dailyStorage)}</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Monthly</span>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-700">{formatStorage(stats.monthlyStorage)}</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Yearly</span>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-700">{formatStorage(stats.yearlyStorage)}</div>
          </div>
        </div>

        {/* Google Sheets Cell Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Google Sheets Cell Usage</span>
            <Badge
              variant={cellUsagePercentage < 50 ? "default" : cellUsagePercentage < 80 ? "secondary" : "destructive"}
            >
              {cellUsagePercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={cellUsagePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{stats.cellsUsed.toLocaleString()} cells</span>
            <span>10M limit</span>
          </div>
        </div>

        {/* Compression Benefits */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Compression Benefits
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">File Size Reduction</div>
              <div className="text-gray-600">~75% smaller files</div>
            </div>
            <div>
              <div className="font-medium">Upload Speed</div>
              <div className="text-gray-600">3x faster sync</div>
            </div>
            <div>
              <div className="font-medium">Mobile Performance</div>
              <div className="text-gray-600">Better on slow networks</div>
            </div>
            <div>
              <div className="font-medium">Storage Cost</div>
              <div className="text-gray-600">Stays in free tier</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-900">Recommendations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use medium quality (70%) for attendance photos</li>
            <li>• Resize to 800x600px for optimal balance</li>
            <li>• Enable auto-cleanup of old photos &gt;1 year</li>
            <li>• Consider WebP format for modern browsers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
