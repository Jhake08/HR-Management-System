"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, MapPin, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createGoogleSheetsSync, getAuthMethod, hasFullAccess } from "@/lib/google-sheets-api"
import { useNotification } from "@/components/notification-provider"
import { UpgradePrompt } from "@/components/upgrade-prompt"

interface TimeTrackingProps {
  user: any
}

export function TimeTracking({ user }: TimeTrackingProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<any>(null)
  const [isTimeIn, setIsTimeIn] = useState(false)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [authMethod, setAuthMethod] = useState<string>("none")
  const [hasFullWriteAccess, setHasFullWriteAccess] = useState(false)
  const { showNotification } = useNotification()

  useEffect(() => {
    // Cleanup camera stream when component unmounts
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Check authentication method and update state
    const updateAuthStatus = () => {
      setAuthMethod(getAuthMethod())
      setHasFullWriteAccess(hasFullAccess())
    }

    updateAuthStatus()

    // Listen for localStorage changes to update status in real-time
    const handleStorageChange = () => {
      updateAuthStatus()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check periodically for changes in the same tab
    const interval = setInterval(updateAuthStatus, 1000)

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          console.error("Location error:", error)
        },
      )
    }

    // Check if already timed in today
    const today = new Date().toDateString()
    const savedRecord = localStorage.getItem(`attendance-${user.id}-${today}`)
    if (savedRecord) {
      const record = JSON.parse(savedRecord)
      setTodayRecord(record)
      setIsTimeIn(record.timeIn && !record.timeOut)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [user.id])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      setCameraStream(stream)
      setShowCamera(true)
    } catch (error) {
      showNotification({
        type: "error",
        title: "Camera Error",
        message: "Hindi ma-access ang camera. Please allow camera permission.",
      })
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = async (quality = 0.7, maxWidth = 800, maxHeight = 600) => {
    if (!cameraStream) return null

    const video = document.getElementById("camera-video") as HTMLVideoElement
    if (!video) return null

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve(null)
        return
      }

      // Calculate dimensions while maintaining aspect ratio
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight

      const { width, height } = calculateDimensions(videoWidth, videoHeight, maxWidth, maxHeight)

      canvas.width = width
      canvas.height = height

      // Draw and compress the image
      ctx.drawImage(video, 0, 0, width, height)

      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)

      // Log compression info for debugging
      const originalSize = (videoWidth * videoHeight * 4) / 1024 // Rough estimate in KB
      const compressedSize = (compressedDataUrl.length * 0.75) / 1024 // Base64 to bytes conversion

      console.log(
        `Photo compressed: ${originalSize.toFixed(0)}KB → ${compressedSize.toFixed(0)}KB (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`,
      )

      resolve(compressedDataUrl)
    })
  }

  // Helper function to calculate optimal dimensions
  const calculateDimensions = (originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) => {
    let width = originalWidth
    let height = originalHeight

    // Scale down if larger than max dimensions
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  const handleTimeInOut = async () => {
    setIsLoading(true)

    try {
      // Start camera for selfie
      await startCamera()

      // Wait for user to take photo
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const photoUrl = await capturePhoto()
      stopCamera()

      const now = new Date()
      const today = now.toDateString()

      const record = todayRecord || {
        date: today,
        employeeId: user.id,
        employeeName: user.name,
      }

      if (!isTimeIn) {
        // Time In
        record.timeIn = now.toTimeString().split(" ")[0]
        record.timeInLocation = location
        record.timeInPhoto = photoUrl

        // Check if late (assuming 8:00 AM start time)
        const startTime = new Date()
        startTime.setHours(8, 0, 0, 0)
        record.isLate = now > new Date(startTime.getTime() + 15 * 60000) // 15 minutes grace period

        setIsTimeIn(true)
      } else {
        // Time Out
        record.timeOut = now.toTimeString().split(" ")[0]
        record.timeOutLocation = location
        record.timeOutPhoto = photoUrl

        // Calculate work hours
        const timeIn = new Date(`${today} ${record.timeIn}`)
        const timeOut = new Date(`${today} ${record.timeOut}`)
        const workHours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60)
        record.workHours = workHours.toFixed(2)

        // Check for night differential (10PM - 6AM)
        const nightStart = new Date()
        nightStart.setHours(22, 0, 0, 0)
        const nightEnd = new Date()
        nightEnd.setHours(6, 0, 0, 0)
        nightEnd.setDate(nightEnd.getDate() + 1)

        record.hasNightDifferential = timeOut >= nightStart || timeIn <= nightEnd

        setIsTimeIn(false)
      }

      // Save to localStorage
      localStorage.setItem(`attendance-${user.id}-${today}`, JSON.stringify(record))
      setTodayRecord(record)

      // **Sync to Google Sheets**
      try {
        const sheets = createGoogleSheetsSync()

        await sheets.addAttendanceRecord({
          date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
          employeeId: record.employeeId,
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          timeInPhoto: record.timeInPhoto,
          isLate: record.isLate,
          workHours: record.workHours,
          hasNightDifferential: record.hasNightDifferential,
        })

        if (hasFullWriteAccess) {
          console.log("✅ Attendance synced to Google Sheets successfully!")
          showNotification({
            type: "success",
            title: "Synced to Google Sheets!",
            message: `${isTimeIn ? "Time out" : "Time in"} recorded and synced in real-time.`,
          })
        } else {
          console.log("📝 Attendance data stored locally (limited access)")
          showNotification({
            type: "info",
            title: "Recorded Locally",
            message: `${isTimeIn ? "Time out" : "Time in"} recorded. Upgrade to OAuth2 for real-time sync.`,
          })
        }
      } catch (syncError) {
        console.error("❌ Failed to sync to Google Sheets:", syncError)
        showNotification({
          type: "warning",
          title: "Sync Warning",
          message: "Data saved locally. Google Sheets sync had an issue.",
        })
      }

      showNotification({
        type: "success",
        title: isTimeIn ? "Time Out Successful" : "Time In Successful",
        message: `${isTimeIn ? "Time out" : "Time in"} recorded at ${now.toLocaleTimeString()}`,
      })
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Error sa time tracking. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt for non-OAuth users */}
      {!hasFullWriteAccess && <UpgradePrompt showInline />}

      {/* Current Time */}
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <div className="text-4xl font-bold mb-2">{formatTime(currentTime)}</div>
          <div className="text-gray-600">
            {currentTime.toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time In/Out Button */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Tracking</CardTitle>
          <CardDescription>
            I-click ang button para mag-time in o time out
            {hasFullWriteAccess && (
              <Badge variant="default" className="ml-2">
                Real-time Sync
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Location detected (Accuracy: {Math.round(location.accuracy)}m)</span>
            </div>
          )}

          <Button
            onClick={handleTimeInOut}
            disabled={isLoading || !location}
            className={`w-full h-16 text-lg ${
              isTimeIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              "Processing..."
            ) : isTimeIn ? (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Time Out
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Time In
              </>
            )}
          </Button>

          {!location && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Waiting for location access. Please enable location services.</AlertDescription>
            </Alert>
          )}

          {/* Sync Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Sync Status:</span>
              <Badge variant={hasFullWriteAccess ? "default" : "secondary"}>
                {hasFullWriteAccess ? "Real-time Google Sheets" : "Local Storage Only"}
              </Badge>
            </div>
            {!hasFullWriteAccess && (
              <p className="text-xs text-gray-600 mt-1">
                Upgrade to OAuth2 for automatic Google Sheets synchronization
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Settings</CardTitle>
          <CardDescription>Optimize selfie quality and file size</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Select defaultValue="0.7">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Low (50%)</SelectItem>
                  <SelectItem value="0.7">Medium (70%)</SelectItem>
                  <SelectItem value="0.9">High (90%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size">Max Size</Label>
              <Select defaultValue="800x600">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="640x480">Small (640×480)</SelectItem>
                  <SelectItem value="800x600">Medium (800×600)</SelectItem>
                  <SelectItem value="1024x768">Large (1024×768)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <div className="font-semibold mb-1">Compression Benefits:</div>
              <ul className="text-xs space-y-1">
                <li>• Reduces Google Sheets storage usage</li>
                <li>• Faster upload and sync times</li>
                <li>• Better mobile performance</li>
                <li>• Stays within free tier limits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Preview */}
      {showCamera && cameraStream && (
        <Card>
          <CardHeader>
            <CardTitle>Take Selfie</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              id="camera-video"
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream
                }
              }}
              className="w-full rounded-lg"
              autoPlay
              muted
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement
                video.play().catch((error) => {
                  console.log("Video play failed:", error)
                  setTimeout(() => {
                    video.play().catch(() => {})
                  }, 100)
                })
              }}
              onError={(e) => {
                console.error("Video error:", e)
                showNotification({
                  type: "error",
                  title: "Camera Error",
                  message: "Error loading camera preview",
                })
                stopCamera()
              }}
            />
            <Button onClick={stopCamera} className="w-full mt-4 bg-transparent" variant="outline">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today's Record */}
      {todayRecord && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Time In</div>
                <div className="font-semibold flex items-center">
                  {todayRecord.timeIn || "Not yet"}
                  {todayRecord.isLate && (
                    <Badge variant="destructive" className="ml-2">
                      Late
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time Out</div>
                <div className="font-semibold">{todayRecord.timeOut || "Not yet"}</div>
              </div>
            </div>

            {todayRecord.workHours && (
              <div>
                <div className="text-sm text-gray-600">Work Hours</div>
                <div className="font-semibold flex items-center">
                  {todayRecord.workHours} hours
                  {todayRecord.hasNightDifferential && (
                    <Badge variant="secondary" className="ml-2">
                      Night Diff
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {todayRecord.isLate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Late arrival recorded. This will be reflected in your attendance report.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - i)
              const isToday = i === 0

              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {date.toLocaleDateString("en-PH", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isToday && todayRecord
                        ? `${todayRecord.timeIn || "--"} - ${todayRecord.timeOut || "--"}`
                        : "8:00 AM - 5:00 PM"}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isToday && todayRecord?.isLate ? (
                      <Badge variant="destructive">Late</Badge>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
