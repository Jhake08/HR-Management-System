"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calculator, CreditCard, HelpCircle, Eye, EyeOff } from "lucide-react"

interface EmployeePortalProps {
  user: any
}

export function EmployeePortal({ user }: EmployeePortalProps) {
  const [activeTab, setActiveTab] = useState("sahod")
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: "bot",
      message: "Kumusta! Ako si HR Bot. Ano ang tanong mo?",
      time: new Date().toLocaleTimeString(),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [showSalary, setShowSalary] = useState(false)

  // Mock employee data
  const [employeeData] = useState({
    name: user.name,
    employeeId: user.id,
    position: "Software Developer",
    basicPay: 35000,
    hireDate: "2024-01-15",
    tin: "123-456-789-000",
    sss: "12-3456789-0",
    gcashNumber: user.gcashNumber || "09123456789",
    currentSalary: {
      period: "2024-12",
      basicPay: 35000,
      thirteenthMonth: 29166.67,
      nightDiff: 3500,
      grossPay: 67666.67,
      sssDeduction: 1350,
      philHealthDeduction: 875,
      pagIbigDeduction: 100,
      totalDeductions: 2325,
      netPay: 65341.67,
    },
    utangRecords: [
      { date: "2024-12-01", amount: 5000, status: "Unpaid", description: "Cash Advance" },
      { date: "2024-11-15", amount: 2000, status: "Paid", description: "Emergency Loan" },
      { date: "2024-11-01", amount: 3000, status: "Paid", description: "Salary Advance" },
    ],
  })

  const commonQuestions = [
    "Kelangan ba ng doctor's cert para sa SL?",
    "Paano mag-file ng leave?",
    "Kelan ang sahod?",
    "Paano mag-request ng COE?",
    "Ano ang night differential rate?",
    "Paano mag-update ng personal info?",
  ]

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage = {
      id: chatMessages.length + 1,
      type: "user",
      message: newMessage,
      time: new Date().toLocaleTimeString(),
    }

    setChatMessages((prev) => [...prev, userMessage])

    // Simulate bot response
    setTimeout(() => {
      let botResponse = ""

      if (newMessage.toLowerCase().includes("doctor") || newMessage.toLowerCase().includes("cert")) {
        botResponse =
          "Para sa Sick Leave na 3 days or more, kailangan ng medical certificate. Para sa 1-2 days, pwede na ang self-declaration."
      } else if (newMessage.toLowerCase().includes("leave")) {
        botResponse =
          "Mag-file ng leave sa HR system o kaya email kay HR Manager. I-submit at least 1 day before ang planned leave."
      } else if (newMessage.toLowerCase().includes("sahod") || newMessage.toLowerCase().includes("salary")) {
        botResponse =
          'Ang sahod ay every 15th at 30th ng buwan. Pwede mo rin tingnan sa "Sahod Ko" tab ang detailed breakdown.'
      } else if (newMessage.toLowerCase().includes("coe")) {
        botResponse =
          "Para sa Certificate of Employment, mag-request sa HR. Usually 3-5 working days ang processing time."
      } else if (newMessage.toLowerCase().includes("night")) {
        botResponse = "Night differential ay 10% ng basic pay para sa work hours na 10PM-6AM."
      } else {
        botResponse =
          "Salamat sa tanong! Para sa mas detailed na info, pwede mo i-contact directly si HR Manager o mag-check sa employee handbook."
      }

      const botMessage = {
        id: chatMessages.length + 2,
        type: "bot",
        message: botResponse,
        time: new Date().toLocaleTimeString(),
      }

      setChatMessages((prev) => [...prev, botMessage])
    }, 1000)

    setNewMessage("")
  }

  const handleQuickQuestion = (question: string) => {
    setNewMessage(question)
    handleSendMessage()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Employee Self-Service Portal</h2>
        <p className="text-gray-600">Tingnan ang inyong records at magtanong kay HR Bot</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === "sahod" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sahod")}
          className="flex-1"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Sahod Ko
        </Button>
        <Button
          variant={activeTab === "utang" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("utang")}
          className="flex-1"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Utang Tracker
        </Button>
        <Button
          variant={activeTab === "chat" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("chat")}
          className="flex-1"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Tanong kay HR
        </Button>
      </div>

      {/* Sahod Ko Tab */}
      {activeTab === "sahod" && (
        <div className="space-y-6">
          {/* Current Salary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Salary Breakdown</CardTitle>
                  <CardDescription>Period: {employeeData.currentSalary.period}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSalary(!showSalary)}>
                  {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSalary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Basic Pay</div>
                      <div className="text-2xl font-bold text-green-600">
                        ₱{employeeData.currentSalary.basicPay.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">13th Month (Prorated)</div>
                      <div className="text-2xl font-bold text-blue-600">
                        ₱{employeeData.currentSalary.thirteenthMonth.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Night Differential</span>
                      <span className="font-semibold">₱{employeeData.currentSalary.nightDiff.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Gross Pay</span>
                      <span>₱{employeeData.currentSalary.grossPay.toLocaleString()}</span>
                    </div>

                    <hr />

                    <div className="text-sm space-y-2">
                      <div className="flex justify-between text-red-600">
                        <span>SSS Deduction</span>
                        <span>-₱{employeeData.currentSalary.sssDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>PhilHealth Deduction</span>
                        <span>-₱{employeeData.currentSalary.philHealthDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Pag-IBIG Deduction</span>
                        <span>-₱{employeeData.currentSalary.pagIbigDeduction.toLocaleString()}</span>
                      </div>
                    </div>

                    <hr />

                    <div className="flex justify-between text-xl font-bold">
                      <span>Net Pay</span>
                      <span className="text-green-600">₱{employeeData.currentSalary.netPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👁️</div>
                  <p className="text-gray-600">Click the eye icon to view salary details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Employee ID</div>
                  <div className="font-semibold">{employeeData.employeeId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Position</div>
                  <div className="font-semibold">{employeeData.position}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hire Date</div>
                  <div className="font-semibold">{employeeData.hireDate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">TIN</div>
                  <div className="font-semibold">{employeeData.tin}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">SSS Number</div>
                  <div className="font-semibold">{employeeData.sss}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">GCash Number</div>
                  <div className="font-semibold">{employeeData.gcashNumber}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Utang Tracker Tab */}
      {activeTab === "utang" && (
        <Card>
          <CardHeader>
            <CardTitle>Utang Tracker</CardTitle>
            <CardDescription>Track your cash advances and loans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeData.utangRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold">₱{record.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{record.description}</div>
                    <div className="text-xs text-gray-500">{record.date}</div>
                  </div>
                  <Badge variant={record.status === "Paid" ? "default" : "destructive"}>{record.status}</Badge>
                </div>
              ))}

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Unpaid:</span>
                  <span className="text-xl font-bold text-orange-600">
                    ₱
                    {employeeData.utangRecords
                      .filter((r) => r.status === "Unpaid")
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tanong kay HR Tab */}
      {activeTab === "chat" && (
        <div className="space-y-6">
          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
              <CardDescription>Click on a question to ask HR Bot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commonQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left justify-start h-auto p-3"
                  >
                    <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{question}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle>HR Bot Chat</CardTitle>
              <CardDescription>Ask any HR-related questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          message.type === "user" ? "bg-blue-600 text-white" : "bg-white border"
                        }`}
                      >
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          {message.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your question here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
