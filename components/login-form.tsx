"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, User } from "lucide-react"
import { useNotification } from "@/components/notification-provider"

interface LoginFormProps {
  onLogin: (user: any) => void
}

// Mock employee database - in real app, this would come from Google Sheets
const EMPLOYEE_DATABASE = {
  EMP001: {
    id: "EMP001",
    name: "Juan Dela Cruz",
    position: "Software Developer",
    role: "Employee",
    gcashNumber: "09123456789",
    basicPay: 35000,
  },
  HR001: {
    id: "HR001",
    name: "Maria Santos",
    position: "HR Specialist",
    role: "HR",
    gcashNumber: "09987654321",
    basicPay: 28000,
  },
  OWN001: {
    id: "OWN001",
    name: "Jose Rizal",
    position: "Owner/Manager",
    role: "Owner",
    gcashNumber: "09456789123",
    basicPay: 50000,
  },
  EMP002: {
    id: "EMP002",
    name: "Ana Reyes",
    position: "Accountant",
    role: "Employee",
    gcashNumber: "09321654987",
    basicPay: 32000,
  },
  EMP003: {
    id: "EMP003",
    name: "Pedro Garcia",
    position: "Sales Representative",
    role: "Employee",
    gcashNumber: "09654321789",
    basicPay: 25000,
  },
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const { showNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setShowSuccess(false)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (!employeeId.trim()) {
        throw new Error("Please enter your Employee ID")
      }

      // Validate Employee ID against database
      const employee = EMPLOYEE_DATABASE[employeeId.toUpperCase() as keyof typeof EMPLOYEE_DATABASE]

      if (!employee) {
        throw new Error("Invalid Employee ID. Please check and try again.")
      }

      // Show success message using notification system instead of alert
      setShowSuccess(true)
      showNotification({
        type: "success",
        title: "Login Successful",
        message: `Welcome ${employee.name}! Redirecting to HR system...`,
      })

      // Wait a moment to show success message
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Login successful
      const userData = {
        ...employee,
        loginTime: new Date().toISOString(),
      }

      onLogin(userData)
    } catch (err: any) {
      setError(err.message)
      setShowSuccess(false)
      showNotification({
        type: "error",
        title: "Login Failed",
        message: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Employee Login</CardTitle>
          <CardDescription>Enter your Employee ID to access the HR system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="Enter your Employee ID (e.g., EMP001)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                required
                className="text-center font-mono text-lg"
                disabled={isLoading || showSuccess}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Login successful! Welcome to the HR system.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || showSuccess}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying ID...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Login Successful!
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-blue-900">Demo Employee IDs:</h4>
            <div className="text-xs space-y-1 text-blue-800">
              <p>
                <strong>EMP001</strong> - Juan Dela Cruz (Employee)
              </p>
              <p>
                <strong>HR001</strong> - Maria Santos (HR Staff)
              </p>
              <p>
                <strong>OWN001</strong> - Jose Rizal (Owner)
              </p>
              <p>
                <strong>EMP002</strong> - Ana Reyes (Employee)
              </p>
              <p>
                <strong>EMP003</strong> - Pedro Garcia (Employee)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
