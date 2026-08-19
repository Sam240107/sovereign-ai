import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "../../sovereign.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Create a table for audit receipts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id TEXT UNIQUE,
            timestamp TEXT,
            user_intent TEXT,
            receipt_hash TEXT,
            prev_hash TEXT,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_receipt_to_db(receipt):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO audit_ledger (receipt_id, timestamp, user_intent, receipt_hash, prev_hash, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (receipt['receipt_id'], receipt['timestamp'], receipt['user_intent'], 
          receipt['receipt_hash'], receipt['prev_hash'], 'SUCCESS'))
    conn.commit()
    conn.close()