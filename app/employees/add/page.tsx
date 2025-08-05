"use client"

import { EmployeePortal } from "@/components/employee-portal"

export default function AddEmployeePage() {
  const user = {
    name: "Admin User",
    role: "Owner",
    email: "admin@company.com",
  }

  return <EmployeePortal user={user} />
}
