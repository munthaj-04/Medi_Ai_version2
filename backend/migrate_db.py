import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'mediai_appointments.db')

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. Skipping migration.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if recommended_specialist exists
        cursor.execute("PRAGMA table_info(appointments)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'recommended_specialist' not in columns:
            print("Adding column 'recommended_specialist' to 'appointments' table...")
            cursor.execute("ALTER TABLE appointments ADD COLUMN recommended_specialist VARCHAR(255)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'recommended_specialist' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
