// Google Sheets Formulas for PH HR Compliance
// These formulas should be implemented in the actual Google Sheets

// SSS Calculation Formula (Column H in Payroll Records)
const sssFormula = `=IF(D2<=30000, D2*0.045, 1350)`

// 13th Month Pay Calculation (Column E in Payroll Records)
// Assumes hire date is in column I and current date calculation
const thirteenthMonthFormula = `=ROUND(D2*DATEDIF(I2,TODAY(),"M")/12, 2)`

// PhilHealth Calculation (Column J in Payroll Records)
const philHealthFormula = `=MIN(D2*0.05/2, 2500)`

// Night Differential Calculation (Column F in Payroll Records)
// This would need to check attendance log for night hours
const nightDifferentialFormula = `=IF(COUNTIFS(AttendanceLog!B:B,B2,AttendanceLog!H:H,TRUE)>0, D2*0.1, 0)`

// Total Deductions (Column K in Payroll Records)
const totalDeductionsFormula = `=H2+J2+100`

// Net Pay Calculation (Column L in Payroll Records)
const netPayFormula = `=G2-K2`

// Gross Pay Calculation (Column G in Payroll Records)
const grossPayFormula = `=D2+E2+F2`

// Late Arrival Check (Column G in Attendance Log)
// Assumes standard start time is 8:00 AM with 15-minute grace period
const lateCheckFormula = `=IF(C2>TIME(8,15,0), TRUE, FALSE)`

// Work Hours Calculation (Column F in Attendance Log)
const workHoursFormula = `=IF(AND(C2<>"",D2<>""), (D2-C2)*24, "")`

// Night Differential Check (Column H in Attendance Log)
// Checks if work hours overlap with 10PM-6AM
const nightDiffCheckFormula = `=OR(C2>=TIME(22,0,0), D2<=TIME(6,0,0))`

// Employee Filter for Self-Service (to be used in employee view sheets)
const employeeFilterFormula = `=FILTER(PayrollRecords!A:L, PayrollRecords!B:B=A1)`

// Utang Summary by Employee
const utangSummaryFormula = `=SUMIFS(UtangTracker!D:D, UtangTracker!B:B, A1, UtangTracker!E:E, "Unpaid")`

// Validation: Check if deductions exceed 20% of basic pay
const deductionValidationFormula = `=IF(K2>D2*0.2, "EXCEEDS LEGAL LIMIT", "OK")`

// Monthly SSS Contribution Summary
const monthlySSSSummary = `=SUMIF(PayrollRecords!A:A, A1, PayrollRecords!H:H)`

// Export these formulas for use in Google Sheets setup
const googleSheetsFormulas = {
  sss: sssFormula,
  thirteenthMonth: thirteenthMonthFormula,
  philHealth: philHealthFormula,
  nightDifferential: nightDifferentialFormula,
  totalDeductions: totalDeductionsFormula,
  netPay: netPayFormula,
  grossPay: grossPayFormula,
  lateCheck: lateCheckFormula,
  workHours: workHoursFormula,
  nightDiffCheck: nightDiffCheckFormula,
  employeeFilter: employeeFilterFormula,
  utangSummary: utangSummaryFormula,
  deductionValidation: deductionValidationFormula,
  monthlySSSSummary: monthlySSSSummary,
}

console.log("Google Sheets Formulas for PH HR System:")
console.log(JSON.stringify(googleSheetsFormulas, null, 2))

// Instructions for implementing in Google Sheets:
console.log(`
IMPLEMENTATION INSTRUCTIONS:

1. Create 5 Google Sheets with the following names:
   - Employees Masterlist
   - Attendance Log  
   - Payroll Records
   - Government Contributions
   - Utang Tracker

2. Set up the column headers as defined in the SQL script

3. Apply the formulas above to the respective columns:
   - SSS formula in Payroll Records column H
   - 13th Month formula in Payroll Records column E
   - PhilHealth formula in Payroll Records column J
   - And so on...

4. Set up data validation:
   - Status columns should use dropdown lists
   - Date columns should use date validation
   - Numeric columns should restrict to numbers only

5. Apply conditional formatting:
   - Late arrivals in red (Attendance Log)
   - Unpaid utang in orange (Utang Tracker)
   - Deduction warnings in red (Payroll Records)

6. Set up permissions:
   - Owner: Full edit access
   - HR Staff: Edit attendance, view payroll
   - Employees: View only their filtered rows
`)
