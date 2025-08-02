-- Demo Google Sheets Structure for PH HR System
-- This script shows the structure that would be created in Google Sheets

-- Sheet 1: Employees Masterlist
CREATE TABLE IF NOT EXISTS employees_masterlist (
    name VARCHAR(100) NOT NULL,
    tin_number VARCHAR(20) NOT NULL,
    sss_number VARCHAR(15) NOT NULL,
    position VARCHAR(50) NOT NULL,
    basic_pay DECIMAL(10,2) NOT NULL,
    gcash_number VARCHAR(15),
    hire_date DATE NOT NULL,
    employee_id VARCHAR(10) PRIMARY KEY
);

-- Insert sample data
INSERT INTO employees_masterlist VALUES
('Juan Dela Cruz', '123-456-789-000', '12-3456789-0', 'Software Developer', 35000.00, '09123456789', '2024-01-15', 'EMP001'),
('Maria Santos', '987-654-321-000', '98-7654321-0', 'HR Specialist', 28000.00, '09987654321', '2024-03-01', 'EMP002'),
('Jose Rizal', '456-789-123-000', '45-6789123-0', 'Manager', 50000.00, '09456789123', '2023-06-01', 'EMP003'),
('Ana Reyes', '321-654-987-000', '32-1654987-0', 'Accountant', 32000.00, '09321654987', '2024-02-10', 'EMP004'),
('Pedro Garcia', '654-321-789-000', '65-4321789-0', 'Sales Representative', 25000.00, '09654321789', '2024-04-20', 'EMP005');

-- Sheet 2: Attendance Log
CREATE TABLE IF NOT EXISTS attendance_log (
    date DATE NOT NULL,
    employee_id VARCHAR(10) NOT NULL,
    time_in TIME,
    time_out TIME,
    selfie_photo_url TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    work_hours DECIMAL(4,2),
    has_night_differential BOOLEAN DEFAULT FALSE,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8)
);

-- Insert sample attendance data
INSERT INTO attendance_log VALUES
('2024-12-15', 'EMP001', '08:00:00', '17:00:00', 'https://example.com/selfie1.jpg', FALSE, 8.00, FALSE, 14.5995, 120.9842),
('2024-12-15', 'EMP002', '08:15:00', '17:15:00', 'https://example.com/selfie2.jpg', TRUE, 8.00, FALSE, 14.5995, 120.9842),
('2024-12-15', 'EMP003', '07:45:00', '16:45:00', 'https://example.com/selfie3.jpg', FALSE, 8.00, FALSE, 14.5995, 120.9842);

-- Sheet 3: Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
    period VARCHAR(7) NOT NULL, -- YYYY-MM format
    employee_id VARCHAR(10) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    basic_pay DECIMAL(10,2) NOT NULL,
    thirteenth_month DECIMAL(10,2) DEFAULT 0,
    night_differential DECIMAL(10,2) DEFAULT 0,
    gross_pay DECIMAL(10,2) NOT NULL,
    sss_deduction DECIMAL(10,2) NOT NULL,
    philhealth_deduction DECIMAL(10,2) NOT NULL,
    pagibig_deduction DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Sheet 4: Government Contributions (2024 Rates)
CREATE TABLE IF NOT EXISTS government_contributions (
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    sss_rate DECIMAL(5,3) DEFAULT 0.045,
    sss_max_contribution DECIMAL(10,2) DEFAULT 1350.00,
    philhealth_rate DECIMAL(5,3) DEFAULT 0.05,
    philhealth_max_contribution DECIMAL(10,2) DEFAULT 5000.00,
    pagibig_contribution DECIMAL(10,2) DEFAULT 100.00,
    minimum_wage DECIMAL(10,2) DEFAULT 610.00 -- NCR minimum wage 2024
);

-- Insert 2024 rates
INSERT INTO government_contributions VALUES
('2024-01', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-02', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-03', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-04', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-05', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-06', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-07', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-08', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-09', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-10', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-11', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00),
('2024-12', 0.045, 1350.00, 0.05, 5000.00, 100.00, 610.00);

-- Sheet 5: Utang Tracker
CREATE TABLE IF NOT EXISTS utang_tracker (
    date DATE NOT NULL,
    employee_id VARCHAR(10) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Paid', 'Unpaid')),
    description VARCHAR(200),
    due_date DATE,
    payment_date DATE
);

-- Insert sample utang data
INSERT INTO utang_tracker VALUES
('2024-12-01', 'EMP001', 'Juan Dela Cruz', 5000.00, 'Unpaid', 'Cash Advance', '2024-12-31', NULL),
('2024-11-15', 'EMP001', 'Juan Dela Cruz', 2000.00, 'Paid', 'Emergency Loan', '2024-11-30', '2024-11-28'),
('2024-11-01', 'EMP002', 'Maria Santos', 3000.00, 'Paid', 'Salary Advance', '2024-11-15', '2024-11-14'),
('2024-12-05', 'EMP003', 'Jose Rizal', 1500.00, 'Unpaid', 'Medical Advance', '2024-12-20', NULL);
