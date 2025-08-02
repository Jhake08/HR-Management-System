/**
 * Google Sheets API integration with OAuth2 and API key support
 */

// TypeScript interfaces
export interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  startDate: string
  salary?: number
  status: "active" | "inactive"
}

export interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut?: string
  breakDuration: number
  totalHours: number
  status: "clocked_in" | "clocked_out" | "break"
}

export interface PayrollEntry {
  id: string
  employeeId: string
  employeeName: string
  period: string
  regularHours: number
  overtimeHours: number
  regularRate: number
  overtimeRate: number
  grossPay: number
  deductions: number
  netPay: number
  status: "draft" | "processed" | "paid"
}

export type AuthMethod = "oauth2" | "api_key" | "none"

export interface ConnectionTestResult {
  success: boolean
  method: AuthMethod
  message: string
  details?: {
    hasReadAccess: boolean
    hasWriteAccess: boolean
    spreadsheetId?: string
    error?: string
  }
}

// Get credentials from multiple sources (priority order)
function getCredentials() {
  // 1. Try browser localStorage first
  const browserApiKey = typeof window !== "undefined" ? localStorage.getItem("GOOGLE_SHEETS_API_KEY") : null
  const browserSpreadsheetId = typeof window !== "undefined" ? localStorage.getItem("SPREADSHEET_ID") : null

  // 2. Fall back to environment variables
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
  const envSpreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID

  return {
    apiKey: browserApiKey || envApiKey || "",
    spreadsheetId: browserSpreadsheetId || envSpreadsheetId || "",
  }
}

// Helper function to check if credentials are configured
export const hasCredentials = () => {
  const credentials = getCredentials()
  return !!(credentials.apiKey && credentials.spreadsheetId)
}

// Authentication helper functions
export const getAuthMethod = (): AuthMethod => {
  if (typeof window === "undefined") return "none"

  // Check OAuth2 first (highest priority)
  const oauthConfigured = localStorage.getItem("oauth_configured") === "true"
  const oauthAuthenticated = localStorage.getItem("oauth_access_token")

  if (oauthConfigured && oauthAuthenticated) {
    return "oauth2"
  }

  // Check API key
  const credentials = getCredentials()
  if (credentials.apiKey && credentials.apiKey.startsWith("AIza")) {
    return "api_key"
  }

  return "none"
}

export const hasFullAccess = (): boolean => {
  return getAuthMethod() === "oauth2"
}

export const isOAuthConfigured = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("oauth_configured") === "true"
}

export const isOAuthAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false
  const token = localStorage.getItem("oauth_access_token")
  return !!(token && isOAuthConfigured())
}

// Helper to trigger authentication status change events
export const triggerAuthStatusChange = () => {
  if (typeof window !== "undefined") {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent("oauth-status-changed"))

    // Also trigger storage event manually for same-tab updates
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "oauth_authenticated",
        newValue: localStorage.getItem("oauth_access_token"),
        storageArea: localStorage,
      }),
    )
  }
}

// Get OAuth access token
export function getOAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("oauth_access_token")
}

// Clear OAuth authentication
export function clearOAuthAuth(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("oauth_access_token")
  localStorage.removeItem("oauth_refresh_token")
  localStorage.removeItem("oauth_token_expires")
  localStorage.removeItem("oauth_authenticated")

  // Dispatch events for real-time updates
  triggerAuthStatusChange()
}

// Google Sheets API class
export class GoogleSheetsSync {
  private apiKey: string | null = null
  private accessToken: string | null = null
  private spreadsheetId: string | null = null

  constructor() {
    if (typeof window !== "undefined") {
      const credentials = getCredentials()
      this.apiKey = credentials.apiKey
      this.accessToken = localStorage.getItem("oauth_access_token")
      this.spreadsheetId = credentials.spreadsheetId
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`
    }

    return headers
  }

  private getBaseUrl(): string {
    const baseUrl = "https://sheets.googleapis.com/v4/spreadsheets"
    if (this.apiKey && !this.accessToken) {
      return `${baseUrl}?key=${this.apiKey}`
    }
    return baseUrl
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const method = getAuthMethod()

    if (method === "none") {
      return {
        success: false,
        method,
        message: "No authentication configured",
        details: {
          hasReadAccess: false,
          hasWriteAccess: false,
        },
      }
    }

    try {
      if (!this.spreadsheetId) {
        return {
          success: false,
          method,
          message: "No spreadsheet ID configured",
          details: {
            hasReadAccess: false,
            hasWriteAccess: false,
          },
        }
      }

      // Test read access
      const readUrl = `${this.getBaseUrl()}/${this.spreadsheetId}`
      const readResponse = await fetch(readUrl, {
        headers: this.getHeaders(),
      })

      const hasReadAccess = readResponse.ok
      let hasWriteAccess = false

      // Test write access (only for OAuth2)
      if (method === "oauth2" && hasReadAccess) {
        const writeUrl = `${this.getBaseUrl()}/${this.spreadsheetId}/values/TestSheet!A1`
        const writeResponse = await fetch(writeUrl, {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify({
            values: [["Test"]],
          }),
        })
        hasWriteAccess = writeResponse.ok
      }

      return {
        success: hasReadAccess,
        method,
        message: hasReadAccess
          ? `Connected successfully with ${method === "oauth2" ? "full" : "read-only"} access`
          : "Failed to connect to Google Sheets",
        details: {
          hasReadAccess,
          hasWriteAccess,
          spreadsheetId: this.spreadsheetId,
        },
      }
    } catch (error) {
      return {
        success: false,
        method,
        message: "Connection test failed",
        details: {
          hasReadAccess: false,
          hasWriteAccess: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  }

  async syncEmployees(employees: Employee[]): Promise<boolean> {
    if (!hasFullAccess()) {
      console.warn("Write access requires OAuth2 authentication")
      return false
    }

    try {
      // Convert employees to sheet format
      const values = [
        ["ID", "Name", "Email", "Department", "Position", "Start Date", "Salary", "Status"],
        ...employees.map((emp) => [
          emp.id,
          emp.name,
          emp.email,
          emp.department,
          emp.position,
          emp.startDate,
          emp.salary?.toString() || "",
          emp.status,
        ]),
      ]

      const url = `${this.getBaseUrl()}/${this.spreadsheetId}/values/Employees!A1:H${values.length}`
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          values,
          majorDimension: "ROWS",
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Failed to sync employees:", error)
      return false
    }
  }

  async syncTimeEntries(entries: TimeEntry[]): Promise<boolean> {
    if (!hasFullAccess()) {
      console.warn("Write access requires OAuth2 authentication")
      return false
    }

    try {
      const values = [
        [
          "ID",
          "Employee ID",
          "Employee Name",
          "Date",
          "Clock In",
          "Clock Out",
          "Break Duration",
          "Total Hours",
          "Status",
        ],
        ...entries.map((entry) => [
          entry.id,
          entry.employeeId,
          entry.employeeName,
          entry.date,
          entry.clockIn,
          entry.clockOut || "",
          entry.breakDuration.toString(),
          entry.totalHours.toString(),
          entry.status,
        ]),
      ]

      const url = `${this.getBaseUrl()}/${this.spreadsheetId}/values/TimeTracking!A1:I${values.length}`
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          values,
          majorDimension: "ROWS",
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Failed to sync time entries:", error)
      return false
    }
  }

  async syncPayroll(entries: PayrollEntry[]): Promise<boolean> {
    if (!hasFullAccess()) {
      console.warn("Write access requires OAuth2 authentication")
      return false
    }

    try {
      const values = [
        [
          "ID",
          "Employee ID",
          "Employee Name",
          "Period",
          "Regular Hours",
          "Overtime Hours",
          "Regular Rate",
          "Overtime Rate",
          "Gross Pay",
          "Deductions",
          "Net Pay",
          "Status",
        ],
        ...entries.map((entry) => [
          entry.id,
          entry.employeeId,
          entry.employeeName,
          entry.period,
          entry.regularHours.toString(),
          entry.overtimeHours.toString(),
          entry.regularRate.toString(),
          entry.overtimeRate.toString(),
          entry.grossPay.toString(),
          entry.deductions.toString(),
          entry.netPay.toString(),
          entry.status,
        ]),
      ]

      const url = `${this.getBaseUrl()}/${this.spreadsheetId}/values/Payroll!A1:L${values.length}`
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          values,
          majorDimension: "ROWS",
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Failed to sync payroll:", error)
      return false
    }
  }

  /**
   * Read data from a specific sheet range (works with both API key and OAuth)
   */
  async readSheet(range: string): Promise<any[]> {
    try {
      const url = `${this.getBaseUrl()}/${this.spreadsheetId}/values/${range}`
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        credentials: "omit",
        mode: "cors",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.values || data.values.length === 0) {
        return []
      }

      // Convert array of arrays to array of objects
      const headers = data.values[0]
      const rows = data.values.slice(1)

      return rows.map((row: any[]) => {
        const obj: any = {}
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || ""
        })
        return obj
      })
    } catch (error) {
      console.error("Error reading from Google Sheets:", error)
      throw error
    }
  }

  /**
   * Append data to sheet (OAuth required for real writing)
   */
  async appendToSheet(range: string, values: any[][]): Promise<boolean> {
    try {
      if (hasFullAccess()) {
        const url = `${this.getBaseUrl()}/${this.spreadsheetId}/values/${range}:append`
        const response = await fetch(url, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            values,
            valueInputOption: "RAW",
          }),
        })
        return response.ok
      } else {
        // Fallback to simulation for API key users
        console.warn("⚠️ OAuth not available. Simulating write operation...")

        // Store in localStorage as fallback
        const storageKey = `sheets_data_${range.replace(/[^a-zA-Z0-9]/g, "_")}`
        const existingData = JSON.parse(localStorage.getItem(storageKey) || "[]")
        existingData.push(...values)
        localStorage.setItem(storageKey, JSON.stringify(existingData))

        console.log(`📝 Data stored locally for ${range}:`, values)
        return true
      }
    } catch (error) {
      console.error("Error appending to Google Sheets:", error)
      throw error
    }
  }

  /**
   * Add attendance record
   */
  async addAttendanceRecord(record: any): Promise<boolean> {
    try {
      const values = [
        [
          record.date,
          record.employeeId,
          record.timeIn || "",
          record.timeOut || "",
          record.timeInPhoto || "",
          record.isLate ? "TRUE" : "FALSE",
          record.workHours || "",
          record.hasNightDifferential ? "TRUE" : "FALSE",
        ],
      ]

      return await this.appendToSheet("Attendance Log!A:H", values)
    } catch (error) {
      console.error("Error adding attendance record:", error)
      throw error
    }
  }

  /**
   * Add employee
   */
  async addEmployee(employee: any): Promise<boolean> {
    try {
      const values = [
        [
          employee.name,
          employee.tin,
          employee.sss,
          employee.position,
          employee.basicPay,
          employee.gcashNumber,
          employee.id,
          employee.hireDate,
        ],
      ]

      return await this.appendToSheet("Employees Masterlist!A:H", values)
    } catch (error) {
      console.error("Error adding employee:", error)
      throw error
    }
  }

  /**
   * Add payroll record
   */
  async addPayrollRecord(record: any): Promise<boolean> {
    try {
      const values = [
        [
          record.period,
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
          record.status,
        ],
      ]

      return await this.appendToSheet("Payroll Records!A:M", values)
    } catch (error) {
      console.error("Error adding payroll record:", error)
      throw error
    }
  }

  /**
   * Get stored local data (fallback when write operations aren't available)
   */
  getLocalData(range: string): any[] {
    const storageKey = `sheets_data_${range.replace(/[^a-zA-Z0-9]/g, "_")}`
    return JSON.parse(localStorage.getItem(storageKey) || "[]")
  }
}

// Factory function to create GoogleSheetsSync instance
export const createGoogleSheetsSync = (): GoogleSheetsSync => {
  return new GoogleSheetsSync()
}

// API functions for easy usage
export async function getEmployees(): Promise<Employee[]> {
  // Mock data for demo - in real app, this would fetch from Google Sheets
  return [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Engineering",
      position: "Software Developer",
      startDate: "2023-01-15",
      salary: 75000,
      status: "active",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      department: "Marketing",
      position: "Marketing Manager",
      startDate: "2023-02-01",
      salary: 65000,
      status: "active",
    },
  ]
}

export async function addEmployee(employee: Omit<Employee, "id">): Promise<boolean> {
  const sync = createGoogleSheetsSync()
  const newEmployee: Employee = {
    ...employee,
    id: Date.now().toString(),
  }

  return await sync.addEmployee(newEmployee)
}

export async function getTimeEntries(): Promise<TimeEntry[]> {
  // Mock data for demo
  return [
    {
      id: "1",
      employeeId: "1",
      employeeName: "John Doe",
      date: "2024-01-08",
      clockIn: "09:00",
      clockOut: "17:00",
      breakDuration: 60,
      totalHours: 8,
      status: "clocked_out",
    },
  ]
}

export async function addTimeEntry(entry: Omit<TimeEntry, "id">): Promise<boolean> {
  const sync = createGoogleSheetsSync()
  const newEntry: TimeEntry = {
    ...entry,
    id: Date.now().toString(),
  }

  const record = {
    date: newEntry.date,
    employeeId: newEntry.employeeId,
    timeIn: newEntry.clockIn,
    timeOut: newEntry.clockOut,
    workHours: newEntry.totalHours,
    isLate: false,
    hasNightDifferential: false,
  }

  return await sync.addAttendanceRecord(record)
}

export async function getPayrollEntries(): Promise<PayrollEntry[]> {
  // Mock data for demo
  return [
    {
      id: "1",
      employeeId: "1",
      employeeName: "John Doe",
      period: "2024-01",
      regularHours: 160,
      overtimeHours: 10,
      regularRate: 25,
      overtimeRate: 37.5,
      grossPay: 4375,
      deductions: 875,
      netPay: 3500,
      status: "processed",
    },
  ]
}

export async function addPayrollEntry(entry: Omit<PayrollEntry, "id">): Promise<boolean> {
  const sync = createGoogleSheetsSync()
  const newEntry: PayrollEntry = {
    ...entry,
    id: Date.now().toString(),
  }

  const record = {
    period: newEntry.period,
    employeeId: newEntry.employeeId,
    employeeName: newEntry.employeeName,
    basicPay: newEntry.regularRate * newEntry.regularHours,
    thirteenthMonth: 0,
    sssDeduction: 0,
    philHealthDeduction: 0,
    pagIbigDeduction: 0,
    nightDifferential: 0,
    grossPay: newEntry.grossPay,
    totalDeductions: newEntry.deductions,
    netPay: newEntry.netPay,
    status: newEntry.status,
  }

  return await sync.addPayrollRecord(record)
}

export async function testConnection(): Promise<ConnectionTestResult> {
  const sync = createGoogleSheetsSync()
  return await sync.testConnection()
}
