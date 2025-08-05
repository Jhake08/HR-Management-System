"use client"

import { PayrollSystem } from "@/components/payroll-system"

export default function PayrollPage() {
  const user = {
    name: "Admin User",
    role: "Owner",
    email: "admin@company.com",
  }

  return <PayrollSystem user={user} />
}
