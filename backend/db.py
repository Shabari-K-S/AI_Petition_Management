import sqlite3
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Database configuration
DATABASE_NAME = 'grievance_system.db'

def get_db_connection():
    """Create and return a database connection with row factory"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    
    # Users table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Grievances table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS grievances (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        assigned_to TEXT,
        ai_summary TEXT,
        ai_recommendation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitted_by) REFERENCES users (id),
        FOREIGN KEY (assigned_to) REFERENCES users (id)
    )
    ''')
    
    # Comments table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        grievance_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grievance_id) REFERENCES grievances (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # Feedback table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        userName TEXT NOT NULL,
        userId TEXT,
        rating INTEGER NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
    )
    ''')
    
    # Attachments table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        grievance_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (grievance_id) REFERENCES grievances (id),
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {DATABASE_NAME}")



# Feedback-related functions
def create_feedback(userName, userId, rating, category, message):
    """Create a new feedback entry"""
    conn = get_db_connection()
    feedback_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    try:
        conn.execute(
            'INSERT INTO feedback (id, userName, userId, rating, category, message, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (feedback_id, userName, userId, rating, category, message, now)
        )
        conn.commit()
        
        feedback = conn.execute('SELECT * FROM feedback WHERE id = ?', (feedback_id,)).fetchone()
        conn.close()
        
        if feedback:
            return dict(feedback), None
        return None, "Failed to create feedback"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_feedback(filters=None, limit=50, offset=0):
    """Get feedback with optional filters"""
    query = "SELECT * FROM feedback"
    params = []
    
    if filters:
        conditions = []
        for key, value in filters.items():
            if key in ['category', 'rating', 'userId']:
                conditions.append(f"{key} = ?")
                params.append(value)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    conn = get_db_connection()
    feedbacks = conn.execute(query, params).fetchall()
    conn.close()
    
    return [dict(f) for f in feedbacks]

def get_category_counts():
    """Get counts of feedback by category"""
    conn = get_db_connection()
    counts = conn.execute('''
        SELECT category, COUNT(*) as count 
        FROM feedback 
        GROUP BY category
    ''').fetchall()
    conn.close()
    
    return {row['category']: row['count'] for row in counts}

def get_average_rating():
    """Get average rating across all feedback"""
    conn = get_db_connection()
    result = conn.execute('SELECT AVG(rating) as avg_rating FROM feedback').fetchone()
    conn.close()
    
    return result['avg_rating'] if result and result['avg_rating'] is not None else 0


# User-related functions
def create_user(name, email, password, role, department):
    """Create a new user in the database"""
    conn = get_db_connection()
    
    # Check if email already exists
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if existing_user:
        conn.close()
        return None, "Email already registered"
    
    # Hash password and create user
    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())
    
    try:
        conn.execute(
            'INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
            (user_id, name, email, hashed_password, role, department)
        )
        conn.commit()
        
        # Fetch the created user
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        
        if user:
            user_dict = dict(user)
            user_dict.pop('password')  # Remove password from result
            return user_dict, None
        return None, "Failed to create user"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_user_by_email(email):
    """Retrieve a user by email"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def get_user_by_id(user_id):
    """Retrieve a user by ID"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def verify_user(email, password):
    """Verify user credentials and return the user if valid"""
    user = get_user_by_email(email)
    
    if user and check_password_hash(user['password'], password):
        user_copy = user.copy()
        user_copy.pop('password')  # Remove password from result
        return user_copy, None
    
    return None, "Invalid email or password"

def get_users_by_department(department):
    """Get all users from a specific department"""
    conn = get_db_connection()
    users = conn.execute('SELECT id, name, email, role, department FROM users WHERE department = ?', 
                        (department,)).fetchall()
    conn.close()
    
    return [dict(user) for user in users]

# Grievance-related functions
def create_grievance(title, description, category, priority, user_id, ai_summary=None, ai_recommendation=None):
    """Create a new grievance"""
    conn = get_db_connection()
    grievance_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    try:
        conn.execute(
            '''INSERT INTO grievances 
               (id, title, description, category, priority, status, submitted_by, 
                ai_summary, ai_recommendation, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (grievance_id, title, description, category, priority, 'New', user_id, 
             ai_summary, ai_recommendation, now, now)
        )
        conn.commit()
        
        grievance = conn.execute('SELECT * FROM grievances WHERE id = ?', (grievance_id,)).fetchone()
        conn.close()
        
        if grievance:
            return dict(grievance), None
        return None, "Failed to create grievance"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_grievance(grievance_id):
    """Get a grievance by ID"""
    conn = get_db_connection()
    grievance = conn.execute('SELECT * FROM grievances WHERE id = ?', (grievance_id,)).fetchone()
    conn.close()
    
    if grievance:
        return dict(grievance)
    return None

def update_grievance(grievance_id, updates):
    """Update a grievance"""
    allowed_fields = ['title', 'description', 'category', 'priority', 'status', 'assigned_to', 
                      'ai_summary', 'ai_recommendation']
    
    # Filter out any fields that are not allowed to be updated
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not filtered_updates:
        return None, "No valid fields to update"
    
    # Add updated_at timestamp
    filtered_updates['updated_at'] = datetime.now().isoformat()
    
    # Build the SQL query
    set_clause = ', '.join([f"{field} = ?" for field in filtered_updates.keys()])
    values = list(filtered_updates.values())
    values.append(grievance_id)  # For the WHERE clause
    
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE grievances SET {set_clause} WHERE id = ?", values)
        conn.commit()
        
        grievance = conn.execute('SELECT * FROM grievances WHERE id = ?', (grievance_id,)).fetchone()
        conn.close()
        
        if grievance:
            return dict(grievance), None
        return None, "Grievance not found"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_grievances(filters=None, limit=50, offset=0):
    """Get grievances with optional filters"""
    query = "SELECT * FROM grievances"
    params = []
    
    if filters:
        conditions = []
        for key, value in filters.items():
            if key in ['status', 'category', 'priority', 'submitted_by', 'assigned_to']:
                conditions.append(f"{key} = ?")
                params.append(value)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    conn = get_db_connection()
    grievances = conn.execute(query, params).fetchall()
    conn.close()
    
    return [dict(g) for g in grievances]

def get_user_grievances(user_id, role, limit=50, offset=0):
    """Get grievances relevant to a user based on their role"""
    conn = get_db_connection()
    
    if role.lower() in ['admin', 'manager']:
        # Admins and managers can see all grievances
        grievances = conn.execute(
            'SELECT * FROM grievances ORDER BY created_at DESC LIMIT ? OFFSET ?',
            (limit, offset)
        ).fetchall()
    elif role.lower() == 'staff':
        # Staff can see grievances assigned to them or from their department
        user = get_user_by_id(user_id)
        if not user:
            conn.close()
            return []
        
        grievances = conn.execute(
            '''SELECT g.* FROM grievances g
               JOIN users u ON g.submitted_by = u.id
               WHERE g.assigned_to = ? OR (u.department = ? AND g.status != 'Closed')
               ORDER BY g.created_at DESC LIMIT ? OFFSET ?''',
            (user_id, user.get('department'), limit, offset)
        ).fetchall()
    else:
        # Regular users can only see their own grievances
        grievances = conn.execute(
            'SELECT * FROM grievances WHERE submitted_by = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            (user_id, limit, offset)
        ).fetchall()
    
    conn.close()
    return [dict(g) for g in grievances]

# Comment functions
def add_comment(grievance_id, user_id, content):
    """Add a comment to a grievance"""
    conn = get_db_connection()
    comment_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    try:
        conn.execute(
            'INSERT INTO comments (id, grievance_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
            (comment_id, grievance_id, user_id, content, now)
        )
        conn.commit()
        
        comment = conn.execute('SELECT * FROM comments WHERE id = ?', (comment_id,)).fetchone()
        conn.close()
        
        if comment:
            return dict(comment), None
        return None, "Failed to add comment"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_grievance_comments(grievance_id):
    """Get all comments for a grievance"""
    conn = get_db_connection()
    comments = conn.execute(
        '''SELECT c.*, u.name as user_name 
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.grievance_id = ?
           ORDER BY c.created_at ASC''',
        (grievance_id,)
    ).fetchall()
    conn.close()
    
    return [dict(c) for c in comments]

# Attachment functions
def add_attachment(grievance_id, file_name, file_path, user_id):
    """Add an attachment to a grievance"""
    conn = get_db_connection()
    attachment_id = str(uuid.uuid4())
    
    try:
        conn.execute(
            'INSERT INTO attachments (id, grievance_id, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            (attachment_id, grievance_id, file_name, file_path, user_id)
        )
        conn.commit()
        
        attachment = conn.execute('SELECT * FROM attachments WHERE id = ?', (attachment_id,)).fetchone()
        conn.close()
        
        if attachment:
            return dict(attachment), None
        return None, "Failed to add attachment"
    except Exception as e:
        conn.close()
        return None, str(e)

def get_grievance_attachments(grievance_id):
    """Get all attachments for a grievance"""
    conn = get_db_connection()
    attachments = conn.execute(
        'SELECT * FROM attachments WHERE grievance_id = ? ORDER BY created_at DESC',
        (grievance_id,)
    ).fetchall()
    conn.close()
    
    return [dict(a) for a in attachments]

def view_grievence():
    conn = get_db_connection()
    grievances = conn.execute('SELECT * FROM grievances').fetchall()
    conn.close()

    # Convert grievances to a list of dictionaries
    grievance_list = [dict(g) for g in grievances]
    
    print(grievance_list)  # Now it prints actual data
    return grievance_list

def get_user_info(id):
    conn = get_db_connection()
    print(id["id"])
    user_info = conn.execute('SELECT * FROM users WHERE id = ?', (id["id"],)).fetchone()
    conn.close()
    
    if user_info:
        return dict(user_info)
    return None

def update_profile(user_id, updates):
    # Placeholder method - replace with your actual database update logic
    user = get_user_by_id(user_id)
    
    if not user:
        raise ValueError("User not found")
    
    # Update allowed fields

    print(updates)
    
    conn = get_db_connection()

    if "name" in updates:
        conn.execute('UPDATE users SET name = ? WHERE id = ?', (updates["name"], user_id))

    if "department" in updates:        
        conn.execute('UPDATE users SET department = ? WHERE id = ?', (updates["department"], user_id))
    
    if "password" in updates:
        conn.execute('UPDATE users SET password = ? WHERE id = ?', (generate_password_hash(updates["password"]), user_id))

    conn.commit()
        
    return user

def forgot_password(email, password):
    conn = get_db_connection()
    if get_user_by_email(email):
        conn.execute('UPDATE users SET password = ? WHERE email = ?', (generate_password_hash(password), email))
        conn.commit()
        return True
    return False

