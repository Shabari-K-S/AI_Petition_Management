import sqlite3
import uuid
from werkzeug.security import generate_password_hash

DATABASE_NAME = 'grievance_system.db'

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def create_admin_account():
    """Creates an admin account if not already present"""
    conn = get_db_connection()
    
    # Check if an admin already exists
    existing_admin = conn.execute("SELECT * FROM users WHERE role = 'admin'").fetchone()
    
    if existing_admin:
        print("Admin account already exists.")
        conn.close()
        return
    
    # Admin details
    admin_id = str(uuid.uuid4())
    admin_name = "Admin User"
    admin_email = "admin@petition.ai"
    admin_password = generate_password_hash("Admin@123")  # Securely hash the password
    admin_role = "admin"
    admin_department = "Administration"

    # Insert admin into the database
    conn.execute(
        "INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)",
        (admin_id, admin_name, admin_email, admin_password, admin_role, admin_department)
    )
    
    conn.commit()
    conn.close()
    print("Admin account created successfully!")

# Run the function to create admin
if __name__ == "__main__":
    create_admin_account()
