-- Create Medications/Pharmacy Inventory Table
CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    manufacturer VARCHAR(100),
    batch_number VARCHAR(50),
    expiry_date DATE,
    storage_location VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Stock Transaction Log Table (for audit trail)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('ADD', 'DEDUCT', 'ADJUST')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    reason VARCHAR(100),
    reference_id VARCHAR(50), -- prescription_id or order_id
    user_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medications(medication_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sample medications data
INSERT OR IGNORE INTO medications (medication_id, name, generic_name, category, unit_price, stock_quantity, reorder_level, manufacturer, storage_location) VALUES
('MED001', 'Aspirin', 'Acetylsalicylic Acid', 'Analgesic', 5.00, 150, 20, 'Bayer', 'Shelf A1'),
('MED002', 'Ibuprofen', 'Ibuprofen', 'Anti-inflammatory', 4.50, 200, 25, 'Pfizer', 'Shelf A2'),
('MED003', 'Paracetamol', 'Acetaminophen', 'Analgesic', 3.00, 300, 30, 'GSK', 'Shelf A3'),
('MED004', 'Amoxicillin', 'Amoxicillin', 'Antibiotic', 8.50, 100, 15, 'Eli Lilly', 'Shelf B1'),
('MED005', 'Metformin', 'Metformin', 'Antidiabetic', 6.00, 250, 20, 'Novartis', 'Shelf B2'),
('MED006', 'Lisinopril', 'Lisinopril', 'Antihypertensive', 7.00, 180, 18, 'Merck', 'Shelf B3'),
('MED007', 'Atorvastatin', 'Atorvastatin', 'Antilipemic', 9.00, 120, 15, 'Pfizer', 'Shelf C1'),
('MED008', 'Omeprazole', 'Omeprazole', 'Gastroprotective', 5.50, 200, 20, 'AstraZeneca', 'Shelf C2');
