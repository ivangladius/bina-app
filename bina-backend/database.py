import sqlite3
from contextlib import contextmanager
from typing import List, Dict

DATABASE_NAME = 'trading_app.db'

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS filled_orders (
                id TEXT PRIMARY KEY,
                symbol TEXT,
                side TEXT,
                quantity REAL,
                price REAL,
                timestamp INTEGER
            )
        ''')
        conn.commit()

def insert_filled_order(order: Dict):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO filled_orders (id, symbol, side, quantity, price, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            order['id'],
            order['symbol'],
            order['side'],
            order['quantity'],
            order['price'],
            order['timestamp']
        ))
        conn.commit()

def get_filled_orders(limit: int) -> List[Dict]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM filled_orders ORDER BY timestamp DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
    
    return [
        {
            'id': row[0],
            'symbol': row[1],
            'side': row[2],
            'quantity': row[3],
            'price': row[4],
            'timestamp': row[5]
        }
        for row in rows
    ]

def delete_filled_order(order_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM filled_orders WHERE id = ?', (order_id,))
        conn.commit()
        return cursor.rowcount > 0