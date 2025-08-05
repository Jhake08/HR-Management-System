"use client"

import { TimeTracking } from "@/components/time-tracking"

export default function TimeTrackingPage() {
  const user = {
    name: "Admin User",
    role: "Owner",
    email: "admin@company.com",
  }

  return <TimeTracking user={user} />
}
