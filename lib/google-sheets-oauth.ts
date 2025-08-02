/**
 * Google Sheets API with OAuth2 authentication
 * This provides full read/write access to Google Sheets
 */

import { getGoogleOAuth } from "./google-oauth"

interface GoogleSheetsConfig {
  spreadsheetId: string
  ranges: {
    employees: string
    attendance: string
    payroll: string
    contributions: string
    utang: string
  }
}

interface SheetData {
  range: string
  majorDimension: string
  values: any[][]
}

export class GoogleSheetsOAuth {
  private config: GoogleSheetsConfig
  private baseUrl = "https://sheets.googleapis.com/v4/spreadsheets"
  private oauth = getGoogleOAuth()

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  /**
   * Make authenticated request to Google Sheets API
   */
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.oauth.getValidAccessToken()

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "omit",
      mode: "cors",
    })
  }

  /**
   * Read data from a specific sheet range
   */
  async readSheet(range: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values/${range}`
      const response = await this.makeAuthenticatedRequest(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SheetData = await response.json()

      if (!data.values || data.values.length === 0) {
        return []
      }

      // Convert array of arrays to array of objects
      const headers = data.values[0]
      const rows = data.values.slice(1)

      return rows.map((row) => {
        const obj: any = {}
        headers.forEach((header, index) => {
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
   * Append data to a sheet (adds new rows)
   */
  async appendToSheet(range: string, values: any[][]): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values/${range}:append?valueInputOption=RAW`

      const response = await this.makeAuthenticatedRequest(url, {
        method: "POST",
        body: JSON.stringify({
          range,
          majorDimension: "ROWS",
          values,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error appending to Google Sheets:", error)
      throw error
    }
  }

  /**
   * Update specific cells in a sheet
   */
  async updateSheet(range: string, values: any[][]): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values/${range}?valueInputOption=RAW`

      const response = await this.makeAuthenticatedRequest(url, {
        method: "PUT",
        body: JSON.stringify({
          range,
          majorDimension: "ROWS",
          values,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error updating Google Sheets:", error)
      throw error
    }
  }

  /**
   * Batch update multiple ranges
   */
  async batchUpdate(updates: { range: string; values: any[][] }[]): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values:batchUpdate`

      const response = await this.makeAuthenticatedRequest(url, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: updates.map((update) => ({
            range: update.range,
            majorDimension: "ROWS",
            values: update.values,
          })),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return true
    } catch (error) {
      console.error("Error batch updating Google Sheets:", error)
      throw error
    }
  }

  /**
   * Add attendance record to Google Sheets
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

      return await this.appendToSheet(this.config.ranges.attendance, values)
    } catch (error) {
      console.error("Error adding attendance record:", error)
      throw error
    }
  }

  /**
   * Add employee to Google Sheets
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

      return await this.appendToSheet(this.config.ranges.employees, values)
    } catch (error) {
      console.error("Error adding employee:", error)
      throw error
    }
  }

  /**
   * Add payroll record to Google Sheets
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

      return await this.appendToSheet(this.config.ranges.payroll, values)
    } catch (error) {
      console.error("Error adding payroll record:", error)
      throw error
    }
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}`
      const response = await this.makeAuthenticatedRequest(url)
      return response.ok
    } catch (error) {
      console.error("Connection test failed:", error)
      return false
    }
  }

  /**
   * Check if we have write permissions
   */
  async hasWritePermissions(): Promise<boolean> {
    return this.oauth.isAuthenticated()
  }

  /**
   * Create initial sheet structure
   */
  async createSheetStructure(): Promise<boolean> {
    try {
      const headers = {
        [this.config.ranges.employees]: [
          ["Name", "TIN #", "SSS #", "Position", "Basic Pay", "GCash #", "Employee ID", "Hire Date"],
        ],
        [this.config.ranges.attendance]: [
          ["Date", "Employee ID", "Time In", "Time Out", "Selfie Photo URL", "Is Late", "Work Hours", "Has Night Diff"],
        ],
        [this.config.ranges.payroll]: [
          [
            "Period",
            "Employee ID",
            "Employee Name",
            "Basic Pay",
            "13th Month",
            "SSS Deduction",
            "PhilHealth Deduction",
            "Pag-IBIG Deduction",
            "Night Differential",
            "Gross Pay",
            "Total Deductions",
            "Net Pay",
            "Status",
          ],
        ],
        [this.config.ranges.contributions]: [
          ["Month", "SSS Rate", "PhilHealth Rate", "Pag-IBIG Amount", "Minimum Wage", "Notes"],
        ],
        [this.config.ranges.utang]: [["Date", "Employee ID", "Employee Name", "Amount", "Status", "Description"]],
      }

      const updates = Object.entries(headers).map(([range, values]) => ({
        range,
        values,
      }))

      return await this.batchUpdate(updates)
    } catch (error) {
      console.error("Error creating sheet structure:", error)
      throw error
    }
  }
}

// Get credentials from multiple sources
function getCredentials() {
  const browserSpreadsheetId = typeof window !== "undefined" ? localStorage.getItem("SPREADSHEET_ID") : null
  const envSpreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID

  return {
    spreadsheetId: browserSpreadsheetId || envSpreadsheetId || "",
  }
}

// Create OAuth-enabled Google Sheets sync
export const createGoogleSheetsOAuth = () => {
  const credentials = getCredentials()

  const config: GoogleSheetsConfig = {
    spreadsheetId: credentials.spreadsheetId,
    ranges: {
      employees: "Employees Masterlist!A:H",
      attendance: "Attendance Log!A:H",
      payroll: "Payroll Records!A:M",
      contributions: "Government Contributions!A:F",
      utang: "Utang Tracker!A:F",
    },
  }

  return new GoogleSheetsOAuth(config)
}
