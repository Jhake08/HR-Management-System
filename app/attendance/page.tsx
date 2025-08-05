"use client"

import { TimeTracking } from "@/components/time-tracking"

export default function AttendancePage() {
  const user = {
    name: "Admin User",
    role: "Owner",
    email: "admin@company.com",
  }

  // Assuming attendance view is part of TimeTracking component or create a dedicated component if needed
  return <TimeTracking user={user} />
}
