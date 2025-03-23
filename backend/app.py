import base64
from flask import Flask, abort, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
import db
import jwt
from datetime import datetime, timedelta
from functools import wraps
import google.generativeai as genai
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key="YOUR_API_KEY")

app = Flask(__name__)
# i want to allow all origins
CORS(app, supports_credentials=True, origins='*')

# JWT Configuration
app.config['SECRET_KEY'] = 'your_secret_key'
JWT_EXPIRATION = 24 * 60 * 60  # 24 hours in seconds

# Configure uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload


def process_attachments(attachments):
    """
    Process base64 encoded attachments
    Returns a list of processed attachment information
    """
    processed_attachments = []
    for attachment in attachments:
        try:
            # Decode base64 image if present
            if 'base64' in attachment and attachment['base64']:
                # Remove data URL prefix if present
                base64_str = attachment['base64'].split(',')[-1]
                image_data = base64.b64decode(base64_str)
                processed_attachments.append({
                    'name': attachment.get('name', 'unknown'),
                    'type': attachment.get('type', 'unknown'),
                    'size': len(image_data)
                })
        except Exception as e:
            print(f"Error processing attachment: {e}")
    return processed_attachments

@app.route('/api/ai-analyze-grievance', methods=['POST'])
def analyze_grievance():
    """
    Endpoint for AI analysis of grievance data
    """
    try:
        # Get data from request
        data = request.json
        
        # Validate input
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Process attachments
        attachments = process_attachments(data.get('attachments', []))
        
        # Predefined categories and priority levels for guidance
        categories = [
            "Public Infrastructure & Utilities",
            "Government Services & Administration",
            "Consumer Rights & Product Issues",
            "Workplace & Employment Issues",
            "Education & Student Concerns",
            "Healthcare & Medical Services",
            "Law Enforcement & Justice",
            "Environmental & Safety Issues",
            "Housing & Real Estate",
            "Transportation & Public Safety",
            "Financial & Banking Issues",
            "Other"
        ]

        
        priority_levels = [
            "Low - Minor issue, no immediate action required", 
            "Medium - Requires attention within a week", 
            "High - Needs immediate investigation", 
            "Critical - Urgent action required"
        ]
        
        # Prepare prompt for Gemini with specific instructions for category and priority
        prompt = f"""Analyze this grievance and provide structured recommendations:

Grievance Details:
- Title: {data.get('title', 'N/A')}
- Description: {data.get('description', 'N/A')}
- Attachments: {len(attachments)} file(s)

Available Categories: {', '.join(categories)}
Available Priority Levels: {', '.join(priority_levels)}

Instructions:
1. Carefully review the grievance description
2. Select the MOST APPROPRIATE category from the provided list
3. Determine the MOST SUITABLE priority level based on the grievance's urgency and impact
4. Provide a clear rationale for your category and priority selection

Please provide recommendations in the following structured format:
Title: [Refined Title]
Description: [Improved Description (limited to 500 words)]
Category: [Selected Category] 
Priority: [Selected Priority Level]
Rationale: 
- Why this category was chosen
- Why this priority level was selected

Key Observations: 
1. [Observation 1]
2. [Observation 2]
3. [Observation 3]

Recommendations should be concise, clear, and directly actionable."""
        
        # Use Gemini Pro model for text generation
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Extract category and priority from the response
        try:
            # Simple parsing - you might want to implement more robust parsing
            lines = response.text.split('\n')
            category = next((line.split(': ')[1] for line in lines if line.startswith('Category:')), None)
            priority = next((line.split(': ')[1] for line in lines if line.startswith('Priority:')), None)
        except Exception as e:
            category = None
            priority = None
        
        # Return the AI-generated analysis
        return jsonify({
            "text": response.text,
            "category": category,
            "priority": priority,
            "raw_response": str(response)
        })
    
    except Exception as e:
        # Comprehensive error handling
        app.logger.error(f"Error in AI analysis: {str(e)}")
        return jsonify({
            "error": "Failed to process AI analysis",
            "details": str(e)
        }), 500
    
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.before_request
def setup():
    if not hasattr(app, 'setup_done'):
        db.init_db()
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        app.setup_done = True  # Ensures it runs only once

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_ai_insights(grievance_text):
    return "AI summary", "AI recommendation"

def generate_token(user_id):
    """Generate a new JWT token for a user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to check for valid token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        # Check if user exists
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return f(user, *args, **kwargs)
    
    return decorated

# User authentication routes
@app.route('/api/users/register', methods=['POST'])
def register():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'role', 'department']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    # Check password length
    if len(data['password']) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400
    
    # Create user
    user, error = db.create_user(
        data['name'], 
        data['email'], 
        data['password'], 
        data['role'], 
        data['department']
    )
    
    if error:
        return jsonify({"error": error}), 400
    
    # Generate token for new user
    token = generate_token(user['id'])
    
    return jsonify({
        "message": "User registered successfully", 
        "user": user,
        "token": token
    }), 201

@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.json
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Verify credentials
    user, error = db.verify_user(data['email'], data['password'])
    
    if error:
        return jsonify({"error": error}), 401
    
    # Generate token
    token = generate_token(user['id'])
    
    return jsonify({
        "message": "Login successful",
        "user": user,
        "token": token
    }), 200

@app.route('/api/users/me', methods=['GET'])
@token_required
def get_current_user(user):
    userData = db.get_user_info(user)
    return jsonify({"user": userData}), 200

@app.route('/api/users/department/<department>', methods=['GET'])
@token_required
def get_department_users(user, department):
    users = db.get_users_by_department(department)
    return jsonify({"users": users}), 200

# Grievance routes
@app.route('/api/grievances', methods=['POST'])
@token_required
def create_grievance(user):
    data = request.json
    print(data)
    # Validate required fields
    required_fields = ['title', 'description', 'category', 'priority']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    # Optional: Get AI insights
    ai_summary = None
    ai_recommendation = None
    
    if data.get('useAI', False):
        grievance_text = f"Title: {data['title']}\nDescription: {data['description']}\nCategory: {data['category']}"
        ai_summary, ai_recommendation = get_ai_insights(grievance_text)
    
    # Create grievance
    grievance, error = db.create_grievance(
        data['title'],
        data['description'],
        data['category'],
        data['priority'],
        user['id'],
        ai_summary,
        ai_recommendation
    )
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Grievance created successfully", "grievance": grievance}), 200

@app.route('/api/grievances', methods=['GET'])
@token_required
def get_grievances(user):
    # Get pagination parameters
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    # Get grievances based on user role
    grievances = db.get_user_grievances(user['id'], user['role'], limit, offset)
    
    return jsonify({"grievances": grievances}), 200

@app.route('/api/grievances/filter', methods=['GET'])
@token_required
def filter_grievances(user):
    # Get filter parameters
    filters = {}
    for param in ['status', 'category', 'priority', 'submitted_by', 'assigned_to']:
        if request.args.get(param):
            filters[param] = request.args.get(param)
    
    # Get pagination parameters
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    grievances = db.get_grievances(filters, limit, offset)
    
    return jsonify({"grievances": grievances}), 200

@app.route('/api/grievances/<grievance_id>', methods=['GET'])
@token_required
def get_grievance(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    # Get comments and attachments
    comments = db.get_grievance_comments(grievance_id)
    attachments = db.get_grievance_attachments(grievance_id)
    
    # Add submitter and assignee details
    submitter = db.get_user_by_id(grievance['submitted_by'])
    if submitter:
        submitter.pop('password', None)
        grievance['submitter'] = submitter
    
    if grievance.get('assigned_to'):
        assignee = db.get_user_by_id(grievance['assigned_to'])
        if assignee:
            assignee.pop('password', None)
            grievance['assignee'] = assignee
    
    return jsonify({
        "grievance": grievance,
        "comments": comments,
        "attachments": attachments
    }), 200



@app.route('/api/grievances/<grievance_id>', methods=['PUT'])
@token_required
def update_grievance(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    # Check if user has permission to update
    user_role = user.get('role', '').lower()
    if user['id'] != grievance['submitted_by'] and user_role not in ['admin', 'manager', 'staff']:
        return jsonify({"error": "Unauthorized to update this grievance"}), 403
    
    data = request.json

    print(data)
    print(grievance['submitted_by'])

    # get user email address
    user_email = db.get_user_by_id(grievance['submitted_by'])['email']
    print(user_email)

    if data.get('status') == 'Resolved':
        send_email_about_status(user_email, grievance_id)
    elif data.get('status') == 'Closed':
        send_email_about_status(user_email, grievance_id, "closed")

    updated_grievance, error = db.update_grievance(grievance_id, data)
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Grievance updated successfully", "grievance": updated_grievance}), 200

# Comment routes
@app.route('/api/grievances/<grievance_id>/comments', methods=['POST'])
@token_required
def add_comment(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    data = request.json
    if not data.get('content'):
        return jsonify({"error": "Comment content is required"}), 400
    
    comment, error = db.add_comment(grievance_id, user['id'], data['content'])
    
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Comment added", "comment": comment}), 201

@app.route('/api/grievances/<grievance_id>/comments', methods=['GET'])
@token_required
def get_comments(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    comments = db.get_grievance_comments(grievance_id)
    
    return jsonify({"comments": comments}), 200

@app.route('/images/<path:filename>', methods=['GET'])
def get_image(filename):
    """
    API endpoint to serve a specific image with additional security checks
    """
    # Full path to the image
    print(filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Security checks
    if not os.path.exists(file_path):
        abort(404, description="Image not found")
    
    if not os.path.isfile(file_path):
        abort(403, description="Access denied")
    
    # Additional extension validation
    allowed_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')
    if not filename.lower().endswith(allowed_extensions):
        abort(403, description="Invalid file type")
    
    # Serve the image
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Attachment routes
@app.route('/api/grievances/<grievance_id>/attachments', methods=['POST'])
@token_required
def upload_attachment(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Generate unique filename to prevent overwrites
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(file_path)
        
        attachment, error = db.add_attachment(
            grievance_id, 
            filename,  # Store original filename for display
            unique_filename,  # Store unique filename for retrieval
            user['id']
        )
        
        if error:
            return jsonify({"error": error}), 400
        
        return jsonify({"message": "File uploaded", "attachment": attachment}), 201
    
    return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/grievances/<grievance_id>/attachments', methods=['GET'])
@token_required
def get_attachments(user, grievance_id):
    grievance = db.get_grievance(grievance_id)
    if not grievance:
        return jsonify({"error": "Grievance not found"}), 404
    
    attachments = db.get_grievance_attachments(grievance_id)
    
    return jsonify({"attachments": attachments}), 200

@app.route('/api/uploads/<filename>', methods=['GET'])
@token_required
def download_file(user, filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/statistics', methods=['GET'])
@token_required
def get_statistics(user):
    conn = db.get_db_connection()
    
    try:
        # Safely extract user details
        user_id = user.get('id')
        user_role = user.get('role', '').lower()
        
        # Determine base query condition
        if user_role == 'admin':
            base_query = '1=1'
            params = ()
        else:
            base_query = 'submitted_by = ?'
            params = (user_id,)
        
        # Total grievances
        total_query = conn.execute(f'''
            SELECT COUNT(*) as count 
            FROM grievances 
            WHERE {base_query}
        ''', params).fetchone()['count']
        
        # Grievances by status
        status_counts = conn.execute(f'''
            SELECT status, COUNT(*) as count 
            FROM grievances 
            WHERE {base_query}
            GROUP BY status
        ''', params).fetchall()
        
        # Grievances by category
        category_counts = conn.execute(f'''
            SELECT category, COUNT(*) as count 
            FROM grievances 
            WHERE {base_query}
            GROUP BY category
        ''', params).fetchall()
        
        # Grievances by priority
        priority_counts = conn.execute(f'''
            SELECT priority, COUNT(*) as count 
            FROM grievances 
            WHERE {base_query}
            GROUP BY priority
        ''', params).fetchall()
        
        # Recent grievances
        recent = conn.execute(f'''
            SELECT id, title, status, priority, created_at
            FROM grievances
            WHERE {base_query}
            ORDER BY created_at DESC
            LIMIT 5
        ''', params).fetchall()
        
        return jsonify({
            "total_grievances": total_query,
            "by_status": [dict(item) for item in status_counts],
            "by_category": [dict(item) for item in category_counts],
            "by_priority": [dict(item) for item in priority_counts],
            "recent_grievances": [dict(item) for item in recent]
        }), 200
    
    except Exception as e:
        # Log the error 
        print(f"Error in get_statistics: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
    finally:
        conn.close()

@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
def update_profile(current_user, user_id):
    # Get JSON data from the request
    data = request.get_json()
    
    # Update the user's profile
    updated_user = db.update_profile(user_id, data)
    
    if updated_user:
        return jsonify({"message": "User profile updated successfully", "user": updated_user}), 200
    else:
        return jsonify({"error": "User not found"}), 404
    
@app.route("/forgot/<id>", methods=["POST"])
def forgot_password(id):
    data = request.get_json()
    print(data)
    user = db.get_user_by_id(id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    db.forgot_password(user["email"], password)
    
    return jsonify({"message": "Password updated successfully"}), 200

@app.route("/user/<email>", methods=["GET"])
def get_email(email):
    data = db.get_user_by_email(email)
    return data

def send_email_about_status(recipient_email, grievance_id, emailType="resolved"):
    """Sends a test email using smtplib.

    Args:
        recipient_email: The email address of the recipient.
        subject: The subject of the email.
        body: The body of the email.
    """

    email_address = os.environ.get("EMAIL_ADDRESS")  # Get email from environment variable
    email_password = os.environ.get("EMAIL_PASSWORD") # Get password from environment variable

    subject = "Your Grievance is Resolved"

    # read the grievance from the database

    grievance = db.get_grievance(grievance_id)
    

    # get grievance title and description

    title = grievance['title']
    description = grievance['description']


    if emailType == "closed":
        body = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f8ff;
                        color: #333;
                    }}
                    .container {{
                        width: 100%;
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        border: 1px solid #dbe4ff;
                    }}
                    h2 {{
                        color: #1a73e8;
                        margin-bottom: 16px;
                        font-size: 24px;
                        border-bottom: 2px solid #1a73e8;
                        padding-bottom: 8px;
                    }}
                    p {{
                        color: #555;
                        line-height: 1.6;
                        font-size: 16px;
                        margin-bottom: 12px;
                    }}
                    .footer {{
                        margin-top: 20px;
                        font-size: 14px;
                        color: #999;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Your Grievance is Closed</h2>
                    <p><strong>Title:</strong> {title}</p>
                    <p><strong>Description:</strong> {description}</p>
                    <div class="footer">
                        This is an automated message. Please do not reply.
                    </div>
                </div>
            </body>
        </html>
        """
    else:    
        body = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f8ff;
                        color: #333;
                    }}
                    .container {{
                        width: 100%;
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        border: 1px solid #dbe4ff;
                    }}
                    h2 {{
                        color: #1a73e8;
                        margin-bottom: 16px;
                        font-size: 24px;
                        border-bottom: 2px solid #1a73e8;
                        padding-bottom: 8px;
                    }}
                    p {{
                        color: #555;
                        line-height: 1.6;
                        font-size: 16px;
                        margin-bottom: 12px;
                    }}
                    .footer {{
                        margin-top: 20px;
                        font-size: 14px;
                        color: #999;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Your Grievance is Resolved</h2>
                    <p><strong>Title:</strong> {title}</p>
                    <p><strong>Description:</strong> {description}</p>
                    <div class="footer">
                        This is an automated message. Please do not reply.
                    </div>
                </div>
            </body>
        </html>
        """

    print(recipient_email)

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = email_address
    msg["To"] = recipient_email
    msg.set_content("Your email client does not support HTML content.")  # Fallback text
    msg.add_alternative(body, subtype="html")  # HTML content

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_address, email_password)
            smtp.send_message(msg)
        print("Test email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")


# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'error': 'Token is missing',
                'status': 'error'
            }), 401
        
        try:
            # Verify token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = {
                'id': data['id'],
                'name': data['name'],
                'email': data['email'],
                'role': data['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({
                'error': 'Token has expired',
                'status': 'error'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'error': 'Invalid token',
                'status': 'error'
            }), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# API Endpoints for Feedback
@app.route('/api/feedback', methods=['POST'])
@token_required
def create_feedback(current_user):
    """Create a new feedback entry"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['message', 'rating', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}',
                    'status': 'error'
                }), 400
        
        # Validate rating (1-5)
        if not 1 <= data['rating'] <= 5:
            return jsonify({
                'error': 'Rating must be between 1 and 5',
                'status': 'error'
            }), 400
        
        # Validate category
        valid_categories = ['usability', 'performance', 'features', 'design', 'other']
        if data['category'] not in valid_categories:
            return jsonify({
                'error': f'Invalid category. Must be one of: {", ".join(valid_categories)}',
                'status': 'error'
            }), 400
        
        # Generate unique ID
        feedback_id = str(uuid.uuid4())
        
        # Current timestamp
        now = datetime.now().isoformat()
        
        # Insert feedback into database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO feedback (id, user_id, user_name, message, rating, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            feedback_id,
            current_user['id'],
            current_user['name'],
            data['message'],
            data['rating'],
            data['category'],
            now,
            now
        ))
        
        conn.commit()
        conn.close()
        
        # Return the created feedback
        return jsonify({
            'status': 'success',
            'feedback': {
                'id': feedback_id,
                'userId': current_user['id'],
                'userName': current_user['name'],
                'message': data['message'],
                'rating': data['rating'],
                'category': data['category'],
                'createdAt': now
            }
        }), 201
    
    except Exception as e:
        app.logger.error(f"Error creating feedback: {str(e)}")
        return jsonify({
            'error': 'Failed to create feedback',
            'status': 'error',
            'details': str(e)
        }), 500

@app.route('/api/feedback', methods=['GET'])
@token_required
def get_feedback(current_user):
    """Get all feedback entries with optional filtering"""
    try:
        # Get query parameters
        category = request.args.get('category')
        rating = request.args.get('rating')
        
        # Build query
        query = "SELECT * FROM feedback"
        params = []
        
        # Add WHERE clauses if filters are provided
        where_clauses = []
        
        if category and category != 'all':
            where_clauses.append("category = ?")
            params.append(category)
        
        if rating:
            where_clauses.append("rating = ?")
            params.append(int(rating))
        
        # Add role-based filtering
        # Admin and managers can see all feedback
        # Regular users can only see their own feedback
        if current_user['role'] not in ['admin', 'manager']:
            where_clauses.append("user_id = ?")
            params.append(current_user['id'])
        
        # Combine WHERE clauses if any
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Add order by created_at desc
        query += " ORDER BY created_at DESC"
        
        # Execute query
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        # Get results
        feedback_rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        feedback_list = []
        for row in feedback_rows:
            feedback_list.append({
                'id': row['id'],
                'userId': row['user_id'],
                'userName': row['user_name'],
                'message': row['message'],
                'rating': row['rating'],
                'category': row['category'],
                'createdAt': row['created_at']
            })
        
        return jsonify({
            'status': 'success',
            'feedback': feedback_list
        })
    
    except Exception as e:
        app.logger.error(f"Error retrieving feedback: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve feedback',
            'status': 'error',
            'details': str(e)
        }), 500

@app.route('/api/feedback/statistics', methods=['GET'])
@token_required
def get_feedback_statistics(current_user):
    """Get statistics about feedback"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM feedback")
        total_count = cursor.fetchone()['total']
        
        # Get average rating
        cursor.execute("SELECT AVG(rating) as avg_rating FROM feedback")
        avg_rating_row = cursor.fetchone()
        avg_rating = round(avg_rating_row['avg_rating'], 1) if avg_rating_row['avg_rating'] is not None else 0
        
        # Get category counts
        cursor.execute("""
        SELECT category, COUNT(*) as count 
        FROM feedback 
        GROUP BY category
        ORDER BY count DESC
        """)
        category_counts = {}
        for row in cursor.fetchall():
            category_counts[row['category']] = row['count']
        
        # Get rating distribution
        cursor.execute("""
        SELECT rating, COUNT(*) as count 
        FROM feedback 
        GROUP BY rating
        ORDER BY rating
        """)
        rating_distribution = {}
        for row in cursor.fetchall():
            rating_distribution[row['rating']] = row['count']
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'statistics': {
                'totalCount': total_count,
                'averageRating': avg_rating,
                'categoryCount': category_counts,
                'ratingDistribution': rating_distribution
            }
        })
    
    except Exception as e:
        app.logger.error(f"Error retrieving feedback statistics: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve feedback statistics',
            'status': 'error',
            'details': str(e)
        }), 500

@app.route('/api/feedback/<feedback_id>', methods=['GET'])
@token_required
def get_feedback_by_id(current_user, feedback_id):
    """Get a specific feedback entry by ID"""
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        
        # Query for the feedback
        cursor.execute("SELECT * FROM feedback WHERE id = ?", (feedback_id,))
        feedback = cursor.fetchone()
        conn.close()
        
        if not feedback:
            return jsonify({
                'error': 'Feedback not found',
                'status': 'error'
            }), 404
        
        # Check permission - only admins, managers, or the owner can view
        if current_user['role'] not in ['admin', 'manager'] and current_user['id'] != feedback['user_id']:
            return jsonify({
                'error': 'Permission denied',
                'status': 'error'
            }), 403
        
        return jsonify({
            'status': 'success',
            'feedback': {
                'id': feedback['id'],
                'userId': feedback['user_id'],
                'userName': feedback['user_name'],
                'message': feedback['message'],
                'rating': feedback['rating'],
                'category': feedback['category'],
                'createdAt': feedback['created_at']
            }
        })
    
    except Exception as e:
        app.logger.error(f"Error retrieving feedback: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve feedback',
            'status': 'error',
            'details': str(e)
        }), 500

@app.route('/api/feedback/<feedback_id>', methods=['PUT', 'PATCH'])
@token_required
def update_feedback(current_user, feedback_id):
    """Update a feedback entry"""
    try:
        data = request.json
        
        # Get the existing feedback
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM feedback WHERE id = ?", (feedback_id,))
        feedback = cursor.fetchone()
        
        if not feedback:
            conn.close()
            return jsonify({
                'error': 'Feedback not found',
                'status': 'error'
            }), 404
        
        # Check permission - only admins, managers, or the owner can update
        if current_user['role'] not in ['admin', 'manager'] and current_user['id'] != feedback['user_id']:
            conn.close()
            return jsonify({
                'error': 'Permission denied',
                'status': 'error'
            }), 403
        
        # Prepare update fields
        updates = {}
        
        if 'message' in data:
            updates['message'] = data['message']
        
        if 'rating' in data:
            # Validate rating
            if not 1 <= data['rating'] <= 5:
                conn.close()
                return jsonify({
                    'error': 'Rating must be between 1 and 5',
                    'status': 'error'
                }), 400
            updates['rating'] = data['rating']
        
        if 'category' in data:
            # Validate category
            valid_categories = ['usability', 'performance', 'features', 'design', 'other']
            if data['category'] not in valid_categories:
                conn.close()
                return jsonify({
                    'error': f'Invalid category. Must be one of: {", ".join(valid_categories)}',
                    'status': 'error'
                }), 400
            updates['category'] = data['category']
        
        # If no updates, return early
        if not updates:
            conn.close()
            return jsonify({
                'status': 'success',
                'message': 'No changes made'
            })
        
        # Add updated_at timestamp
        updates['updated_at'] = datetime.now().isoformat()
        
        # Build update query
        query = "UPDATE feedback SET "
        query += ", ".join([f"{key} = ?" for key in updates.keys()])
        query += " WHERE id = ?"
        
        # Execute update
        cursor.execute(query, list(updates.values()) + [feedback_id])
        conn.commit()
        
        # Get the updated feedback
        cursor.execute("SELECT * FROM feedback WHERE id = ?", (feedback_id,))
        updated_feedback = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'feedback': {
                'id': updated_feedback['id'],
                'userId': updated_feedback['user_id'],
                'userName': updated_feedback['user_name'],
                'message': updated_feedback['message'],
                'rating': updated_feedback['rating'],
                'category': updated_feedback['category'],
                'createdAt': updated_feedback['created_at'],
                'updatedAt': updated_feedback['updated_at']
            }
        })
    
    except Exception as e:
        app.logger.error(f"Error updating feedback: {str(e)}")
        return jsonify({
            'error': 'Failed to update feedback',
            'status': 'error',
            'details': str(e)
        }), 500

@app.route('/api/feedback/<feedback_id>', methods=['DELETE'])
@token_required
def delete_feedback(current_user, feedback_id):
    """Delete a feedback entry"""
    try:
        # Get the existing feedback
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM feedback WHERE id = ?", (feedback_id,))
        feedback = cursor.fetchone()
        
        if not feedback:
            conn.close()
            return jsonify({
                'error': 'Feedback not found',
                'status': 'error'
            }), 404
        
        # Check permission - only admins, managers, or the owner can delete
        if current_user['role'] not in ['admin', 'manager'] and current_user['id'] != feedback['user_id']:
            conn.close()
            return jsonify({
                'error': 'Permission denied',
                'status': 'error'
            }), 403
        
        # Delete the feedback
        cursor.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Feedback deleted successfully'
        })
    
    except Exception as e:
        app.logger.error(f"Error deleting feedback: {str(e)}")
        return jsonify({
            'error': 'Failed to delete feedback',
            'status': 'error',
            'details': str(e)
        }), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5000,debug=True)