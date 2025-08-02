"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Clock,
  DollarSign,
  Settings,
  Shield,
  CheckCircle,
  AlertTriangle,
  Zap,
  Database,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  todayAttendance: number
  pendingPayroll: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingPayroll: 0,
  })
  const [authMethod, setAuthMethod] = useState<"oauth2" | "api_key" | "none">("none")
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false)

  useEffect(() => {
    // Load dashboard stats
    setStats({
      totalEmployees: 12,
      activeEmployees: 11,
      todayAttendance: 9,
      pendingPayroll: 3,
    })

    // Check authentication status
    const checkAuthStatus = () => {
      if (typeof window === "undefined") return

      // Check OAuth2 first
      const oauthConfigured = localStorage.getItem("oauth_configured") === "true"
      const oauthToken = localStorage.getItem("oauth_access_token")

      if (oauthConfigured && oauthToken) {
        setAuthMethod("oauth2")
        setIsOAuthAuthenticated(true)
        return
      }

      // Check API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
      if (apiKey && apiKey.startsWith("AIza")) {
        setAuthMethod("api_key")
        setIsOAuthAuthenticated(false)
        return
      }

      setAuthMethod("none")
      setIsOAuthAuthenticated(false)
    }

    checkAuthStatus()

    // Listen for auth status changes
    const handleStorageChange = () => checkAuthStatus()
    const handleOAuthChange = () => checkAuthStatus()
    const handleFocus = () => checkAuthStatus()

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("oauth-status-changed", handleOAuthChange)
    window.addEventListener("focus", handleFocus)

    // Periodic check every 2 seconds
    const interval = setInterval(checkAuthStatus, 2000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("oauth-status-changed", handleOAuthChange)
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [])

  const getAuthStatusBadge = () => {
    if (authMethod === "oauth2" && isOAuthAuthenticated) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          OAuth2 Active
        </Badge>
      )
    } else if (authMethod === "api_key") {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Database className="w-3 h-3 mr-1" />
          Read-Only Mode
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Local Mode
        </Badge>
      )
    }
  }

  const getSyncBadge = (feature: string) => {
    if (authMethod === "oauth2" && isOAuthAuthenticated) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Real-time Sync
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your team today.</p>
        </div>
        <div className="flex items-center gap-2">{getAuthStatusBadge()}</div>
      </div>

      {/* OAuth2 Status Alert */}
      {authMethod === "oauth2" && isOAuthAuthenticated && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 <strong>OAuth2 Active!</strong> You have full read/write access to Google Sheets. All data syncs
            automatically in real-time.
          </AlertDescription>
        </Alert>
      )}

      {/* Upgrade Prompt for non-OAuth users */}
      {authMethod !== "oauth2" && (
        <Alert className="border-orange-200 bg-orange-50">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Upgrade to OAuth2</strong> for full Google Sheets write access and real-time sync.
                {authMethod === "api_key" && " Currently in read-only mode."}
                {authMethod === "none" && " No Google Sheets integration configured."}
              </div>
              <Button asChild size="sm" className="ml-4">
                <Link href="/oauth-setup">Setup OAuth2</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{stats.activeEmployees} active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.todayAttendance / stats.activeEmployees) * 100)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayroll}</div>
            <p className="text-xs text-muted-foreground">Employees awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employee Management
              </span>
              {getSyncBadge("employees")}
            </CardTitle>
            <CardDescription>Add, edit, and manage employee information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/employees">Manage Employees</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/employees/add">Add New Employee</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Time Tracking
              </span>
              {getSyncBadge("time")}
            </CardTitle>
            <CardDescription>Track employee attendance and working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/time-tracking">Time Tracking</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/attendance">View Attendance</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payroll System
              </span>
              {getSyncBadge("payroll")}
            </CardTitle>
            <CardDescription>Process payroll and manage compensation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/payroll">Process Payroll</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/payroll/reports">Payroll Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe clocked in</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payroll processed for Marketing team</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New employee added: Jane Smith</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Daily Hours</span>
                <span className="font-medium">8.2 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month's Overtime</span>
                <span className="font-medium">24.5 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Leave Requests</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Department Count</span>
                <span className="font-medium">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            System Configuration
          </CardTitle>
          <CardDescription>Configure your HR system settings and integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <Link href="/oauth-setup">
                <Shield className="h-6 w-6" />
                <span>OAuth2 Setup</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <Link href="/setup">
                <Settings className="h-6 w-6" />
                <span>System Setup</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <Link href="/data-migration">
                <Database className="h-6 w-6" />
                <span>Data Migration</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <Link href="/reports">
                <FileText className="h-6 w-6" />
                <span>Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
