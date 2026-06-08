from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
from werkzeug.utils import secure_filename
from groq import Groq
import pdfplumber
import json
import re
from dotenv import load_dotenv
from flask import send_file
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
import smtplib
import random
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


load_dotenv()
GROQ_KEY = os.getenv("GROQ_KEY")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

if not GROQ_KEY:
    raise ValueError("GROQ_KEY not set")
client = Groq(api_key=GROQ_KEY)

app = Flask(__name__)
CORS(app)

SIGNUP_DB_PATH = os.path.join(os.path.dirname(__file__), "signup.db")

def get_signup_connection():
    return sqlite3.connect(SIGNUP_DB_PATH)

def init_signup_db():
    conn = get_signup_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_store (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expiry INTEGER NOT NULL
    )
    """)
    conn.commit()
    conn.close()


# ================= AUTH ROUTES =================
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = get_signup_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO login (username, email, password) VALUES (?, ?, ?)",
            (username, email, password)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully"}), 200

    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def send_login_email(to_email, username):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email
    msg['Subject'] = 'Successful Login Notification'

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #4a7cff;">Login Successful</h2>
        <p>Hi <strong>{username}</strong>,</p>
        <p>You have successfully logged in to your account.</p>
        <p>If this was not you, please reset your password immediately.</p>
        <br>
        <p style="color: #888; font-size: 12px;">This is an automated notification. Do not reply.</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
            print("Login notification sent to:", to_email)
    except Exception as e:
        print("Login email error:", e)
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = get_signup_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM login WHERE username = ? AND password = ?",
            (username, password)
        )
        user = cursor.fetchone()
        conn.close()

        if user:
            # user = (id, username, email, password)
            email = user[2]
            send_login_email(email, username)
            return jsonify({"message": "Login successful"}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": str(e)}), 500


# ================= EMAIL HELPER =================
def send_otp_email(to_email, otp):
    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email
    msg['Subject'] = 'Your Password Reset OTP'

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #4a7cff;">Password Reset Request</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="letter-spacing: 8px; color: #222;">{otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
            print("OTP email sent successfully to:", to_email)
    except smtplib.SMTPAuthenticationError:
        print("AUTH ERROR: Check EMAIL_ADDRESS and EMAIL_PASSWORD in .env")
        print("Gmail requires an App Password — not your regular password.")
        raise
    except smtplib.SMTPException as e:
        print("SMTP ERROR:", e)
        raise

# ================= FORGOT PASSWORD ROUTES =================
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        conn = get_signup_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM login WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({"error": "No account found with this email"}), 404

        otp = str(random.randint(100000, 999999))
        expiry = int(time.time()) + 600  # 10 minutes

        cursor.execute("DELETE FROM otp_store WHERE email = ?", (email,))
        cursor.execute(
            "INSERT INTO otp_store (email, otp, expiry) VALUES (?, ?, ?)",
            (email, otp, expiry)
        )
        conn.commit()
        conn.close()

        send_otp_email(email, otp)
        return jsonify({"message": "OTP sent to your email"}), 200

    except Exception as e:
        print("Forgot password error:", e)
        return jsonify({"error": "Failed to send OTP. Please try again."}), 500


@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    try:
        conn = get_signup_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT otp, expiry FROM otp_store WHERE email = ?", (email,)
        )
        record = cursor.fetchone()
        conn.close()

        if not record:
            return jsonify({"error": "No OTP found. Please request a new one."}), 400

        stored_otp, expiry = record

        if int(time.time()) > expiry:
            return jsonify({"error": "OTP has expired. Please request a new one."}), 400

        if otp != stored_otp:
            return jsonify({"error": "Incorrect OTP. Please try again."}), 400

        return jsonify({"message": "OTP verified successfully"}), 200

    except Exception as e:
        print("Verify OTP error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('newPassword')

    if not email or not otp or not new_password:
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = get_signup_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT otp, expiry FROM otp_store WHERE email = ?", (email,)
        )
        record = cursor.fetchone()

        if not record:
            conn.close()
            return jsonify({"error": "OTP expired. Please start over."}), 400

        stored_otp, expiry = record

        if int(time.time()) > expiry:
            conn.close()
            return jsonify({"error": "OTP expired. Please start over."}), 400

        if otp != stored_otp:
            conn.close()
            return jsonify({"error": "Invalid OTP."}), 400

        cursor.execute(
            "UPDATE login SET password = ? WHERE email = ?",
            (new_password, email)
        )
        cursor.execute("DELETE FROM otp_store WHERE email = ?", (email,))

        conn.commit()
        conn.close()

        return jsonify({"message": "Password reset successful"}), 200

    except Exception as e:
        print("Reset password error:", e)
        return jsonify({"error": str(e)}), 500


# ================= DATABASE =================
DB_PATH = os.path.join(os.path.dirname(__file__), "main.db")
print("DB PATH:", DB_PATH)
UPLOAD_FOLDER = "uploads"

def get_connection():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Resume_address (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        Name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        extracted_name TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Job_Description (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Resume_score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        job_id INTEGER NOT NULL,
        resume_id INTEGER,
        file_path TEXT,
        score INTEGER,
        FOREIGN KEY (resume_id) REFERENCES Resume_address(id),
        FOREIGN KEY (job_id) REFERENCES Job_Description(id),
        UNIQUE(job_id, resume_id)
    )
    """)

    conn.commit()
    conn.close()


# ================= HELPERS =================
def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        print("PDF Error:", e)
    return text


def extract_json_only(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    return match.group(0) if match else "{}"


def call_groq(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def extract_resume_data(text):
    prompt = f"""
    Extract structured data from this resume.

    STRICT RULES:
    - Return ONLY valid JSON
    - No explanation
    - No extra text
    - No markdown

    Format:
    {{
        "name": "",
        "skills": "",
        "education": "",
        "experience": ""
    }}

    Resume:
    {text[:4000]}
    """
    return call_groq(prompt)


def get_ai_score(resume, job):
    prompt = f"""
    Compare resume with job description and give score out of 100.

    Return ONLY valid JSON like:
    {{
        "score": 85
    }}

    Job:
    Skills: {job["skills"]}
    Education: {job["education"]}
    Experience: {job["experience"]}

    Resume:
    Skills: {resume["skills"]}
    Education: {resume["education"]}
    Experience: {resume["experience"]}
    """

    try:
        text = call_groq(prompt).strip()
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            print("Invalid Groq response:", text)
            return 0
        data = json.loads(match.group(0))
        return int(data.get("score", 0))
    except Exception as e:
        print("Score parse error:", e)
        return 0


# ================= CORE SCORING LOGIC =================
def run_scoring_logic(user_id, job_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, skills, education, experience, created_at
        FROM Job_Description
        WHERE id = ? AND user_id = ?
    """, (job_id, user_id))
    job_row = cursor.fetchone()

    if not job_row:
        conn.close()
        print("No job found for user:", user_id)
        return

    job = {
        "skills":     job_row[1] or "",
        "education":  job_row[2] or "",
        "experience": job_row[3] or ""
    }
    current_job_created_at = job_row[4]

    cursor.execute("""
        SELECT created_at FROM Job_Description
        WHERE user_id = ? AND id < ?
        ORDER BY id DESC LIMIT 1
    """, (user_id, job_id))
    prev_job_row = cursor.fetchone()

    if prev_job_row:
        prev_job_created_at = prev_job_row[0]
        print(f"Scoring resumes uploaded after {prev_job_created_at} and before/at {current_job_created_at}")
        cursor.execute("""
            SELECT ra.id, ra.file_path, ra.skills, ra.education, ra.experience
            FROM Resume_address ra
            WHERE ra.user_id = ?
              AND ra.uploaded_at > ?
              AND ra.uploaded_at <= ?
        """, (user_id, prev_job_created_at, current_job_created_at))
    else:
        print(f"First job for user. Scoring resumes uploaded before/at {current_job_created_at}")
        cursor.execute("""
            SELECT ra.id, ra.file_path, ra.skills, ra.education, ra.experience
            FROM Resume_address ra
            WHERE ra.user_id = ?
              AND ra.uploaded_at <= ?
        """, (user_id, current_job_created_at))

    resumes = cursor.fetchall()

    if not resumes:
        print("No resumes found in this upload window. Nothing scored.")
        conn.close()
        return

    print(f"Found {len(resumes)} resume(s) to score for job {job_id}")

    for r in resumes:
        print("\nProcessing Resume ID:", r[0])
        resume = {
            "file_path":  r[1] or "",
            "skills":     r[2] or "",
            "education":  r[3] or "",
            "experience": r[4] or ""
        }

        score = get_ai_score(resume, job)
        print("Score:", score)

        cursor.execute("""
            INSERT INTO Resume_score (user_id, job_id, resume_id, file_path, score)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(job_id, resume_id) DO UPDATE SET
                file_path=excluded.file_path,
                score=excluded.score
        """, (user_id, job_id, r[0], r[1], score))

    conn.commit()
    conn.close()


# ================= ROUTES =================
@app.route('/api/upload', methods=['POST'])
def upload_cv():
    if 'files' not in request.files:
        return jsonify({"error": "No files found"}), 400

    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    files = request.files.getlist('files')
    conn = get_connection()
    cursor = conn.cursor()
    processed = 0

    for file in files:
        try:
            if not file.filename:
                continue

            filename = secure_filename(file.filename)

            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)

            path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(path)

            cursor.execute(
                "INSERT INTO Resume_address (user_id, Name, file_path) VALUES (?, ?, ?)",
                (user_id, filename, path)
            )
            row_id = cursor.lastrowid
            conn.commit()

            text = extract_text_from_pdf(path)
            if not text.strip():
                continue

            groq_output = extract_resume_data(text)
            print("AI OUTPUT:", groq_output)

            try:
                cleaned = extract_json_only(groq_output)
                data = json.loads(cleaned)
            except Exception as e:
                print("JSON ERROR:", e)
                data = {}

            cursor.execute("""
                UPDATE Resume_address
                SET extracted_name=?, skills=?, education=?, experience=?
                WHERE id=?
            """, (
                data.get("name"),
                data.get("skills"),
                data.get("education"),
                data.get("experience"),
                row_id
            ))

            conn.commit()
            processed += 1

        except Exception as e:
            print("Upload Error:", e)

    conn.close()
    return jsonify({"message": "Upload completed", "processed": processed})


@app.route('/job_description', methods=['POST'])
def save_job():
    data = request.get_json()

    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO Job_Description (user_id, title, skills, education, experience, count)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        data.get("title"),
        data.get("skill"),
        data.get("edu"),
        data.get("exp"),
        data.get("count")
    ))

    job_id = cursor.lastrowid
    conn.commit()
    conn.close()

    run_scoring_logic(user_id, job_id)

    return jsonify({"message": "Job saved & scoring completed"})


@app.route('/api/score_resume', methods=['GET'])
def score_resumes():
    user_id = request.args.get('user_id')
    job_id  = request.args.get('job_id')

    if not user_id or not job_id:
        return jsonify({"error": "user_id and job_id are required"}), 400

    run_scoring_logic(user_id, int(job_id))
    return jsonify({"message": "Scoring completed"})


@app.route('/api/shortlisted', methods=['GET'])
def shortlisted():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, count FROM Job_Description
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
        """, (user_id,))
        job_row = cursor.fetchone()

        if not job_row or job_row[1] is None:
            conn.close()
            return jsonify({"error": "No job description or count found"}), 400

        latest_job_id = job_row[0]
        count = int(job_row[1])

        cursor.execute("""
            SELECT ra.Name, rs.score
            FROM Resume_score rs
            JOIN Resume_address ra ON rs.resume_id = ra.id
            WHERE rs.user_id = ? AND rs.job_id = ?
            ORDER BY rs.score DESC
            LIMIT ?
        """, (user_id, latest_job_id, count))

        data = cursor.fetchall()
        conn.close()

        return jsonify([
            {"name": row[0], "score": row[1]}
            for row in data
        ])

    except Exception as e:
        print("SHORTLISTED ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/')
def home():
    return "Flask running"


@app.route('/api/interview_questions', methods=['GET'])
def generate_interview_pdf():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT title, skills, education, experience
            FROM Job_Description
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
        """, (user_id,))
        job_row = cursor.fetchone()
        conn.close()

        if not job_row:
            return jsonify({"error": "No job description found"}), 404

        title      = job_row[0] or "Unknown Role"
        skills     = job_row[1] or ""
        education  = job_row[2] or ""
        experience = job_row[3] or ""

        prompt = f"""
You are an expert technical interviewer. Generate a comprehensive set of interview questions
with detailed model answers for the following job description.
Return ONLY valid JSON, no markdown, no extra text.

Job Title: {title}
Required Skills: {skills}
Education: {education}
Experience: {experience}

Return this exact structure:
{{
  "intro": [
    {{
      "q": "Tell me about yourself.",
      "answer": "A strong candidate will provide a concise 2-minute overview of their career journey, highlighting their most relevant experience for this specific role. They should mention key achievements, technical skills that match the job requirements, and conclude with why they are excited about this particular opportunity. Avoid candidates who give vague or overly personal responses unrelated to the role.",
      "hint": "Look for concise, relevant career summary."
    }}
  ],
  "technical": [
    {{
      "q": "Specific technical question based on the skills required?",
      "answer": "A detailed 2-4 sentence model answer that directly addresses the technical concept, includes specific examples or methodologies the candidate should mention, explains what depth of knowledge is expected, and notes any red flags or missing points that would indicate weak knowledge.",
      "hint": "What to listen for in the answer."
    }}
  ],
  "behavioral": [
    {{
      "q": "Behavioral question using STAR method?",
      "answer": "A strong answer follows the STAR format (Situation, Task, Action, Result). The candidate should describe a specific real-world scenario relevant to the role, explain the exact steps they took, and quantify the outcome where possible. Look for candidates who take ownership and show measurable impact.",
      "hint": "What to listen for in the answer."
    }}
  ],
  "situational": [
    {{
      "q": "Situational question about a hypothetical scenario?",
      "answer": "The ideal response should demonstrate structured thinking and problem-solving ability. The candidate should walk through their approach step by step, mention stakeholders they would involve, and explain how they would measure success. Weak answers will be vague or skip the analysis phase entirely.",
      "hint": "What to listen for in the answer."
    }}
  ],
  "closing": [
    {{
      "q": "Do you have any questions for us?",
      "answer": "Strong candidates will ask 2-3 thoughtful questions about the team structure, growth opportunities, key challenges of the role, or company culture. This shows genuine interest and preparation. A candidate who says 'no questions' may lack engagement or curiosity about the role.",
      "hint": "Candidate curiosity and preparation."
    }}
  ]
}}

IMPORTANT:
- Every answer must be 2-4 sentences long
- Answers must be accurate according to the question related to job title, skills, education and experience provided
- Write correct answers that the interviewer need to answer — tailor each answer to: {title}, skills: {skills}
- Generate 2 intro, 6 technical, 4 behavioral, 3 situational, and 2 closing questions
"""
        raw = call_groq(prompt)
        cleaned = extract_json_only(raw)
        questions = json.loads(cleaned)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm,
            topMargin=2*cm,  bottomMargin=2*cm
        )
        styles = getSampleStyleSheet()

        # ── Styles ──
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a2e'),
            spaceAfter=6,
            alignment=1,  # center
        )
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#444444'),
            spaceAfter=3,
            leftIndent=0,
            alignment=0,  # left
        )
        section_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor('#ffffff'),
            backColor=colors.HexColor('#16213e'),
            borderPadding=(8, 10, 8, 10),
            spaceBefore=20,
            spaceAfter=10,
            alignment=0,
        )
        question_style = ParagraphStyle(
            'Question',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#1a1a2e'),
            spaceBefore=16,   # more space above each question
            spaceAfter=6,
            leftIndent=0,
            fontName='Helvetica-Bold',
            leading=16,
        )
        answer_label_style = ParagraphStyle(
            'AnswerLabel',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1a5e1a'),
            spaceBefore=4,
            spaceAfter=6,
            leftIndent=10,
            fontName='Helvetica-Bold',
        )
        answer_style = ParagraphStyle(
            'Answer',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#1a1a1a'),
            leftIndent=10,
            rightIndent=10,
            spaceAfter=6,
            fontName='Helvetica',
            leading=15,       # line spacing inside answer
            backColor=colors.HexColor('#f4fff4'),
            borderPadding=(6, 8, 6, 8),
            alignment=0,
        )
        hint_style = ParagraphStyle(
            'Hint',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#888888'),
            leftIndent=10,
            spaceAfter=14,    # more space after hint before next question
            fontName='Helvetica-Oblique',
            leading=13,
        )
        divider_style = ParagraphStyle(
            'Divider',
            parent=styles['Normal'],
            spaceBefore=2,
            spaceAfter=2,
        )

        # ── Build Story ──
        story = []

        # Header
        story.append(Paragraph("Interview Question Bank", title_style))
        story.append(Spacer(1, 0.2*cm))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0f3460')))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(f"<b>Position:</b> {title}",        subtitle_style))
        story.append(Paragraph(f"<b>Skills:</b> {skills}",         subtitle_style))
        story.append(Paragraph(f"<b>Education:</b> {education}",   subtitle_style))
        story.append(Paragraph(f"<b>Experience:</b> {experience}", subtitle_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cccccc')))

        sections = [
            ("intro",       "Introduction"),
            ("technical",   "Technical Questions"),
            ("behavioral",  "Behavioral Questions"),
            ("situational", "Situational Questions"),
            ("closing",     "Closing Questions"),
        ]

        for key, label in sections:
            items = questions.get(key, [])
            if not items:
                continue

            # Section heading
            story.append(Paragraph(f"  {label}", section_style))

            for i, item in enumerate(items, 1):
                q      = item.get("q", "")
                answer = item.get("answer", "")
                hint   = item.get("hint", "")

                # Question
                story.append(Paragraph(f"Q{i}.  {q}", question_style))

                # Expected Answer
                if answer:
                    story.append(Paragraph("✅  Expected Answer:", answer_label_style))
                    story.append(Paragraph(answer, answer_style))

                # Interviewer Hint
                if hint:
                    story.append(Paragraph(f"💡  Interviewer note: {hint}", hint_style))

                # Light divider between questions
                story.append(HRFlowable(
                    width="100%", thickness=0.5,
                    color=colors.HexColor('#e0e0e0'),
                    spaceAfter=4
                ))

            story.append(Spacer(1, 0.3*cm))

        # Footer
        story.append(Spacer(1, 0.4*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cccccc')))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(
            "This document is auto-generated. Adapt questions to the candidate's background.",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8,
                           textColor=colors.grey, alignment=1)
        ))

        doc.build(story)
        buffer.seek(0)

        safe_title = re.sub(r'[^a-zA-Z0-9_\-]', '_', title)
        filename = f"Interview_Questions_{safe_title}.pdf"

        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        print("Interview PDF error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/download_cv/<filename>', methods=['GET'])
def download_cv(filename):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        print("Looking for file at:", os.path.abspath(file_path))
        print("Files in uploads:", os.listdir(UPLOAD_FOLDER))
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        return send_file(os.path.abspath(file_path), as_attachment=True, download_name=filename)
    except Exception as e:
        print("Download error:", e)
        return jsonify({"error": str(e)}), 500

# ================= RUN =================
if __name__ == "__main__":
    init_db()
    init_signup_db()
    app.run(debug=True, port=5000)
    
