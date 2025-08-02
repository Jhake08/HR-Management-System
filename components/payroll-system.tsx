"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, AlertTriangle, Download, CheckCircle } from "lucide-react"
import { createGoogleSheetsSync, hasFullAccess, getAuthMethod } from "@/lib/google-sheets-api"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { useNotification } from "@/components/notification-provider"

interface PayrollSystemProps {
  user: any
}

interface Employee {
  id: string
  name: string
  tin: string
  sss: string
  position: string
  basicPay: number
  gcashNumber: string
  hireDate: string
}

interface PayrollRecord {
  employeeId: string
  employeeName: string
  period: string
  basicPay: number
  thirteenthMonth: number
  sssDeduction: number
  philHealthDeduction: number
  pagIbigDeduction: number
  nightDifferential: number
  grossPay: number
  totalDeductions: number
  netPay: number
  status: "pending" | "processed" | "paid"
}

export function PayrollSystem({ user }: PayrollSystemProps) {
  const [employees] = useState<Employee[]>([
    {
      id: "EMP001",
      name: "Juan Dela Cruz",
      tin: "123-456-789-000",
      sss: "12-3456789-0",
      position: "Software Developer",
      basicPay: 35000,
      gcashNumber: "09123456789",
      hireDate: "2024-01-15",
    },
    {
      id: "EMP002",
      name: "Maria Santos",
      tin: "987-654-321-000",
      sss: "98-7654321-0",
      position: "HR Specialist",
      basicPay: 28000,
      gcashNumber: "09987654321",
      hireDate: "2024-03-01",
    },
    {
      id: "EMP003",
      name: "Jose Rizal",
      tin: "456-789-123-000",
      sss: "45-6789123-0",
      position: "Manager",
      basicPay: 50000,
      gcashNumber: "09456789123",
      hireDate: "2023-06-01",
    },
  ])

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [authMethod, setAuthMethod] = useState<string>("none")
  const [hasFullWriteAccess, setHasFullWriteAccess] = useState(false)
  const { showNotification } = useNotification()
  const [governmentRates] = useState({
    sss: 0.045, // 4.5% for employees earning ≤30k, max 1,350 for >30k
    philHealth: 0.05, // 5% (2.5% employee share)
    pagIbig: 100, // Fixed 100 pesos
  })

  useEffect(() => {
    // Set current period
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    setSelectedPeriod(period)

    // Check auth method and update state
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

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const calculateSSS = (basicPay: number): number => {
    if (basicPay <= 30000) {
      return basicPay * governmentRates.sss
    } else {
      return 1350 // Maximum SSS contribution
    }
  }

  const calculatePhilHealth = (basicPay: number): number => {
    const contribution = basicPay * governmentRates.philHealth
    return Math.min(contribution, 5000) // Maximum PhilHealth contribution
  }

  const calculateThirteenthMonth = (basicPay: number, hireDate: string): number => {
    const hire = new Date(hireDate)
    const now = new Date()
    const monthsWorked = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth())

    if (monthsWorked < 1) return 0

    return Math.round(((basicPay * Math.min(monthsWorked, 12)) / 12) * 100) / 100
  }

  const processPayroll = async () => {
    setIsProcessing(true)

    try {
      const newRecords: PayrollRecord[] = employees.map((employee) => {
        const sssDeduction = calculateSSS(employee.basicPay)
        const philHealthDeduction = calculatePhilHealth(employee.basicPay) / 2 // Employee share
        const pagIbigDeduction = governmentRates.pagIbig
        const thirteenthMonth = calculateThirteenthMonth(employee.basicPay, employee.hireDate)

        // Mock night differential calculation (10% of basic pay if applicable)
        const nightDifferential = Math.random() > 0.7 ? employee.basicPay * 0.1 : 0

        const grossPay = employee.basicPay + thirteenthMonth + nightDifferential
        const totalDeductions = sssDeduction + philHealthDeduction + pagIbigDeduction
        const netPay = grossPay - totalDeductions

        // Validate deductions don't exceed PH legal limits (20% of basic pay)
        const maxDeduction = employee.basicPay * 0.2
        if (totalDeductions > maxDeduction) {
          throw new Error(`Deductions for ${employee.name} exceed legal limit of 20%`)
        }

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          period: selectedPeriod,
          basicPay: employee.basicPay,
          thirteenthMonth,
          sssDeduction,
          philHealthDeduction,
          pagIbigDeduction,
          nightDifferential,
          grossPay,
          totalDeductions,
          netPay,
          status: "processed" as const,
        }
      })

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setPayrollRecords(newRecords)

      // Save to localStorage
      localStorage.setItem(`payroll-${selectedPeriod}`, JSON.stringify(newRecords))

      // **Sync to Google Sheets**
      try {
        const sheets = createGoogleSheetsSync()

        // Add each payroll record to Google Sheets
        for (const record of newRecords) {
          await sheets.addPayrollRecord(record)
        }

        if (hasFullWriteAccess) {
          console.log("✅ Payroll synced to Google Sheets successfully!")
          showNotification({
            type: "success",
            title: "Payroll Synced!",
            message: "Payroll data processed and synced to Google Sheets in real-time.",
          })
        } else {
          console.log("📝 Payroll data stored locally (limited access)")
          showNotification({
            type: "info",
            title: "Payroll Processed",
            message: "Payroll calculated and stored locally. Upgrade to OAuth2 for real-time sync.",
          })
        }
      } catch (syncError) {
        console.error("❌ Failed to sync payroll to Google Sheets:", syncError)
        showNotification({
          type: "warning",
          title: "Sync Warning",
          message: "Payroll processed but Google Sheets sync had an issue.",
        })
      }

      showNotification({
        type: "success",
        title: "Payroll Processed",
        message: "Payroll successfully processed for all employees!",
      })
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Processing Error",
        message: `Error processing payroll: ${error.message}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportPayroll = () => {
    if (payrollRecords.length === 0) return

    const csvContent = [
      [
        "Employee ID",
        "Name",
        "Basic Pay",
        "13th Month",
        "SSS",
        "PhilHealth",
        "Pag-IBIG",
        "Night Diff",
        "Gross Pay",
        "Deductions",
        "Net Pay",
      ],
      ...payrollRecords.map((record) => [
        record.employeeId,
        record.employeeName,
        record.basicPay,
        record.thirteenthMonth,
        record.sssDeduction,
        record.philHealthDeduction,
        record.pagIbigDeduction,
        record.nightDifferential,
        record.grossPay,
        record.totalDeductions,
        record.netPay,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payroll-${selectedPeriod}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt for non-OAuth users */}
      {!hasFullWriteAccess && <UpgradePrompt showInline />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payroll System</h2>
          <p className="text-gray-600">Process employee salaries with PH compliance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Period: {selectedPeriod}</Badge>
          {hasFullWriteAccess && <Badge variant="default">Real-time Sync</Badge>}
        </div>
      </div>

      {/* Government Rates */}
      <Card>
        <CardHeader>
          <CardTitle>2024 Government Contribution Rates</CardTitle>
          <CardDescription>Pre-loaded rates for SSS, PhilHealth, and Pag-IBIG</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold">SSS</div>
              <div className="text-sm text-gray-600">4.5% (max ₱1,350)</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-semibold">PhilHealth</div>
              <div className="text-sm text-gray-600">2.5% employee share</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-semibold">Pag-IBIG</div>
              <div className="text-sm text-gray-600">₱100 fixed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Payroll */}
      <Card>
        <CardHeader>
          <CardTitle>Process Payroll</CardTitle>
          <CardDescription>Auto-compute salaries with 13th month pay and government deductions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="period">Pay Period</Label>
              <Input
                id="period"
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>
            <Button onClick={processPayroll} disabled={isProcessing || !selectedPeriod} className="mt-6">
              {isProcessing ? (
                <>
                  <Calculator className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Process Payroll
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System will auto-calculate 13th month pay (prorated), night differential, and ensure deductions don't
              exceed PH legal limits.
            </AlertDescription>
          </Alert>

          {/* Sync Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payroll Data Sync:</span>
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

      {/* Payroll Records */}
      {payrollRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll Records</CardTitle>
                <CardDescription>Processed payroll for {payrollRecords.length} employees</CardDescription>
              </div>
              <Button onClick={exportPayroll} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payrollRecords.map((record) => (
                <div key={record.employeeId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{record.employeeName}</div>
                      <div className="text-sm text-gray-600">{record.employeeId}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Processed
                      </Badge>
                      {hasFullWriteAccess && <Badge variant="secondary">Synced</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Basic Pay</div>
                      <div className="font-semibold">₱{record.basicPay.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">13th Month</div>
                      <div className="font-semibold">₱{record.thirteenthMonth.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Deductions</div>
                      <div className="font-semibold text-red-600">-₱{record.totalDeductions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Net Pay</div>
                      <div className="font-bold text-green-600">₱{record.netPay.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>SSS: ₱{record.sssDeduction.toLocaleString()}</div>
                      <div>PhilHealth: ₱{record.philHealthDeduction.toLocaleString()}</div>
                      <div>Pag-IBIG: ₱{record.pagIbigDeduction.toLocaleString()}</div>
                      {record.nightDifferential > 0 && (
                        <div>Night Differential: ₱{record.nightDifferential.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Masterlist</CardTitle>
          <CardDescription>{employees.length} employees registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-600">
                    {employee.position} • ₱{employee.basicPay.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    TIN: {employee.tin} • SSS: {employee.sss}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{employee.id}</div>
                  <div className="text-xs text-gray-500">{employee.gcashNumber}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
