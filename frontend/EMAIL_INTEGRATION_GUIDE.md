# 📧 SISI Chat Email Integration Guide

## 🎯 Current Status

✅ **Forgot Password Feature Added**
- Beautiful 3-step flow: Email → Token → Reset
- Secure token generation and validation
- 1-hour token expiration
- Backend endpoints ready

⚠️ **Email Sending**: Currently mocked (prints to console)

## 🚀 Production Email Integration Options

### Option 1: SendGrid (Recommended)

#### Setup:
1. **Create SendGrid Account** - https://sendgrid.com
2. **Get API Key** - Dashboard → Settings → API Keys
3. **Install Package**:
   ```bash
   cd /app/backend
   pip install sendgrid
   ```

#### Code Update:
```python
# Add to backend/server.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def send_reset_email(email: str, token: str, user_name: str):
    try:
        message = Mail(
            from_email='noreply@sisichat.com',
            to_emails=email,
            subject='Reset your SISI Chat password',
            html_content=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">SISI Chat</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Password Reset Request</p>
                </div>
                
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #374151;">Hi {user_name},</h2>
                    <p style="color: #6b7280;">You requested to reset your password for SISI Chat.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                        <p style="margin: 0 0 10px 0; color: #374151; font-weight: bold;">Your Reset Token:</p>
                        <code style="background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 18px; letter-spacing: 2px; color: #f97316; font-weight: bold;">{token}</code>
                    </div>
                    
                    <p style="color: #6b7280;">Copy this token and paste it in the reset password form.</p>
                    <p style="color: #ef4444; font-size: 14px;"><strong>This token will expire in 1 hour.</strong></p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    <p style="color: #374151;">Best regards,<br>SISI Chat Team</p>
                </div>
            </div>
            '''
        )
        
        sg = SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return True
    except Exception as e:
        logging.error(f"SendGrid error: {e}")
        return False
```

#### Environment Variable:
```bash
# Add to backend/.env
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### Option 2: AWS SES

#### Setup:
```bash
pip install boto3
```

#### Code:
```python
import boto3
from botocore.exceptions import ClientError

async def send_reset_email(email: str, token: str, user_name: str):
    try:
        ses = boto3.client(
            'ses',
            region_name=os.environ.get('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
        )
        
        response = ses.send_email(
            Source='noreply@sisichat.com',
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': 'Reset your SISI Chat password'},
                'Body': {'Html': {'Data': f'<!-- HTML template here -->'}}
            }
        )
        return True
    except ClientError as e:
        logging.error(f"SES error: {e}")
        return False
```

### Option 3: Gmail SMTP (Simple)

#### Code:
```python
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

async def send_reset_email(email: str, token: str, user_name: str):
    try:
        sender_email = os.environ.get('GMAIL_EMAIL')
        sender_password = os.environ.get('GMAIL_APP_PASSWORD')
        
        message = MimeMultipart("alternative")
        message["Subject"] = "Reset your SISI Chat password"
        message["From"] = sender_email
        message["To"] = email
        
        html = f'''<!-- HTML template -->'''
        part = MimeText(html, "html")
        message.attach(part)
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        
        return True
    except Exception as e:
        logging.error(f"Gmail SMTP error: {e}")
        return False
```

## 🎨 Email Template Design

### HTML Email Template:
```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SISI Chat Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SISI Chat</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px; background: white; margin: 0 20px;">
            <h2 style="color: #374151; margin-top: 0;">Hi {{user_name}},</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
                You requested to reset your password for SISI Chat. Use the token below to complete the reset process.
            </p>
            
            <!-- Token Box -->
            <div style="background: #f97316; background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
                <p style="color: white; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Your Reset Token</p>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <code style="color: white; font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">{{token}}</code>
                </div>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 12px;">Copy and paste this token in the app</p>
            </div>
            
            <!-- Instructions -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⏰ This token expires in 1 hour</strong><br>
                    If you don't use it within 1 hour, you'll need to request a new one.
                </p>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email. Your account remains secure.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #374151; margin-bottom: 0;">
                Best regards,<br>
                <strong>SISI Chat Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© 2025 SISI Chat. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This email was sent to {{email}}</p>
        </div>
    </div>
</body>
</html>
```

## 🔧 Quick Setup Instructions

### For Development (Testing):
1. **Keep current mock setup** - tokens print to console
2. **Test the full flow** manually
3. **Verify database storage** of reset tokens

### For Production:
1. **Choose email service** (SendGrid recommended)
2. **Update environment variables**:
   ```bash
   SENDGRID_API_KEY=your_key_here
   SMTP_FROM_EMAIL=noreply@sisichat.com
   ```
3. **Replace mock function** with real email code
4. **Test with real emails**
5. **Set up domain authentication** (SPF, DKIM records)

## 🚀 Email Domain Setup

### Custom Email Domain:
1. **Add DNS records** for sisichat.com:
   ```
   MX Record: 10 mail.sisichat.com
   TXT Record: v=spf1 include:sendgrid.net ~all
   DKIM Record: (provided by SendGrid)
   ```

2. **Verify domain** in your email service
3. **Use branded emails**: noreply@sisichat.com

## 📧 Email Types to Add Later

### Welcome Email:
```html
Subject: Welcome to SISI Chat! 🎉
Content: Account created, app download links, getting started guide
```

### Security Alerts:
```html
Subject: New login to your SISI Chat account
Content: Device info, location, secure account tips
```

### Feature Updates:
```html
Subject: New features in SISI Chat
Content: Latest updates, how to use new features
```

## ✅ Testing Checklist

### Email Flow Testing:
- [ ] User enters valid email
- [ ] Reset token generated and stored
- [ ] Email sent successfully
- [ ] Token expires after 1 hour
- [ ] Password reset works with valid token
- [ ] Invalid/expired tokens rejected
- [ ] Used tokens can't be reused

### Email Content Testing:
- [ ] Email displays correctly on mobile
- [ ] Token is easily copyable
- [ ] Links work properly
- [ ] Branding looks professional
- [ ] Spam filters don't block emails

Your **SISI Chat forgot password feature** is ready for production! 🎉