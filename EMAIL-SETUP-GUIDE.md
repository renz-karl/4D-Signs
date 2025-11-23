# 📧 Email Reply System Setup Guide

## Overview
Your admin dashboard now has **automatic email notification** functionality! When you reply to a customer message, they will receive an email with your response.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create EmailJS Account (FREE)

1. **Visit EmailJS**: Go to [https://www.emailjs.com](https://www.emailjs.com) 
2. **Sign Up**: Click "Sign Up" (100 emails/month FREE)
3. **Verify Email**: Check your inbox and verify your account

### Step 2: Add Email Service

1. **Login to EmailJS Dashboard**
2. Click **"Email Services"** in the left menu
3. Click **"Add New Service"**
4. Choose your email provider:
   - **Gmail** (Recommended for personal use)
   - **Outlook/Hotmail**
   - **Yahoo**
   - Or any other SMTP provider
5. **Connect Your Email**:
   - For Gmail: Click "Connect Account" and authorize
   - You'll get a **Service ID** (e.g., `service_abc123`)
6. **Copy the Service ID** - You'll need this!

### Step 3: Create Email Template

1. Click **"Email Templates"** in the left menu
2. Click **"Create New Template"**
3. **Template Name**: `customer_reply_template`
4. **Template Content**:

```html
Subject: Re: {{subject}}

Hello {{customer_name}},

Thank you for contacting 4D Signs! We have reviewed your message and here is our response:

---
YOUR ORIGINAL MESSAGE:
{{original_message}}

---
OUR REPLY:
{{reply_message}}

{{images_html}}

---

If you have any further questions, please don't hesitate to contact us again.

Best regards,
4D Signs Customer Support Team

---
This is an automated response to your inquiry submitted through our website.
```

5. **Set Variables** (make sure these match):
   - `to_email`
   - `to_name`
   - `from_name`
   - `subject`
   - `customer_name`
   - `original_message`
   - `reply_message`
   - `images_html` (for image attachments)
   - `has_images`

6. Click **"Save"**
7. **Copy the Template ID** (e.g., `template_xyz789`)

### Step 4: Get Your Public Key

1. Go to **"Account"** → **"General"**
2. Find **"Public Key"** (e.g., `abc123XYZ456`)
3. **Copy it**

### Step 5: Update Your Code

Open `admin-dashboard.js` and find this line (around line 695):

```javascript
emailjs.init("YOUR_PUBLIC_KEY");
```

Replace with:
```javascript
emailjs.init("abc123XYZ456"); // Your actual public key
```

Find this line (around line 713):
```javascript
emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams)
```

Replace with:
```javascript
emailjs.send("service_abc123", "template_xyz789", templateParams)
```

**Full Example:**
```javascript
// Initialize EmailJS
emailjs.init("abc123XYZ456"); // Replace with YOUR public key

// Later in the code...
emailjs.send("service_abc123", "template_xyz789", templateParams)
```

---

## ✅ Test Your Setup

1. **Open Admin Dashboard**: `admin-login.html`
2. **Go to Messages Section**
3. **Reply to a Test Message**:
   - Click the "Reply" button
   - A modal will open with a rich text editor
   - Type your reply message
   - **Upload images** (optional - up to 5 images, max 5MB each)
   - Click "Send Reply"
   - You should see a notification: "Sending email to customer..."
   - If successful: "✅ Reply sent successfully to [email] (with X image(s))"
   - If failed: Check your browser console for errors

4. **Check Customer Email**: Verify they received your reply with images

---

## 🎯 How It Works

### When You Reply:

1. **Admin clicks "Reply" button** in Messages section
2. **Reply Modal Opens** with:
   - Customer information display
   - Original message quoted
   - Rich text area for your reply
   - **Image attachment section**
3. **Add Images (Optional)**:
   - Click "Choose Images" button
   - Select up to 5 images (max 5MB each)
   - Preview images before sending
   - Remove unwanted images
4. **System automatically**:
   - ✅ Saves reply to localStorage
   - ✅ Saves attached images (as base64)
   - ✅ Updates message status to "Replied"
   - ✅ Sends email to customer with reply and images
   - ✅ Shows success/error notification

### Customer Receives:

- **Email Subject**: Re: [Their Original Subject]
- **Email Body**:
  - Greeting with their name
  - Their original message quoted
  - Your reply
  - **Attached images displayed inline** (if any)
  - Contact information
  - Professional signature

### Image Features:

- 📸 **Up to 5 images** per reply
- 📏 **Max 5MB per image**
- 🖼️ **Supported formats**: JPG, PNG, GIF, WebP
- 👁️ **Live preview** before sending
- 🗑️ **Remove images** before sending
- 📧 **Inline display** in email
- 💾 **Saved with reply** for admin reference

---

## 🔧 Troubleshooting

### "Email failed to send"

**Check:**
1. ✅ Public key is correct
2. ✅ Service ID is correct
3. ✅ Template ID is correct
4. ✅ Internet connection is working
5. ✅ EmailJS account is active

**Browser Console Errors:**
- Press `F12` → Console tab
- Look for error messages
- Common issues:
  - Wrong IDs/Keys
  - Template variables mismatch
  - Service not connected

### "Invalid Public Key"

- Copy the key again from EmailJS dashboard
- Make sure there are no extra spaces
- Use quotes: `emailjs.init("your-key-here");`

### "Template not found"

- Verify template ID in EmailJS dashboard
- Make sure template is saved and active
- Check variable names match exactly

---

## 📊 Free Tier Limits

**EmailJS Free Plan:**
- ✅ 200 emails per month
- ✅ 2 email templates
- ✅ 1 email service
- ✅ Perfect for small businesses!

**If you need more:**
- Personal Plan: $7/month (1,000 emails)
- Team Plan: $15/month (10,000 emails)

---

## 🎨 Customization Options

### Modify Email Template

1. Go to EmailJS → Email Templates
2. Edit your template
3. Customize:
   - Subject line
   - Email body format
   - Add your logo (HTML template)
   - Change colors and styling
   - Add footer links

### Example Professional Template:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #1e293b; color: #FFD700; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .reply-box { background: white; padding: 20px; border-left: 4px solid #FFD700; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>4D Signs</h1>
    </div>
    <div class="content">
        <p>Hello {{customer_name}},</p>
        <p>Thank you for contacting us! Here is our response to your inquiry:</p>
        
        <div class="reply-box">
            <strong>Your Message:</strong>
            <p>{{original_message}}</p>
        </div>
        
        <div class="reply-box">
            <strong>Our Reply:</strong>
            <p>{{reply_message}}</p>
        </div>
        
        <p>If you have any questions, feel free to contact us again!</p>
    </div>
    <div class="footer">
        <p>&copy; 2025 4D Signs | Custom Signage Solutions</p>
        <p>Email: info@4dsigns.com | Phone: +63 XXX XXX XXXX</p>
    </div>
</body>
</html>
```

---

## 🔐 Security Best Practices

1. **Never commit your keys to GitHub**
   - Add to `.gitignore` if using version control
   - Use environment variables in production

2. **Restrict Email Service**
   - In EmailJS dashboard, add allowed domains
   - Prevent unauthorized use

3. **Monitor Usage**
   - Check EmailJS dashboard regularly
   - Watch for suspicious activity

---

## 📱 Alternative: Use Your Own SMTP

If you prefer using your own email server instead of EmailJS:

1. **Use SMTP.js** (alternative library)
2. **Configure with your email provider**:
   - Gmail SMTP
   - Outlook SMTP
   - Custom SMTP server

Example with SMTP.js:
```javascript
Email.send({
    Host: "smtp.gmail.com",
    Username: "your-email@gmail.com",
    Password: "your-app-password",
    To: customerEmail,
    From: "your-email@gmail.com",
    Subject: "Re: " + subject,
    Body: replyMessage
});
```

---

## ✨ Summary

**What You Get:**
- ✅ Automatic email replies to customers
- ✅ Professional email templates
- ✅ Visual notifications in admin dashboard
- ✅ Message tracking (replied/unread/read)
- ✅ Free tier for small businesses
- ✅ Easy to set up (5 minutes)

**Next Steps:**
1. Create EmailJS account
2. Get your Service ID, Template ID, and Public Key
3. Update the 3 values in `admin-dashboard.js`
4. Test with a message
5. Start replying to customers!

---

Need help? Check the [EmailJS Documentation](https://www.emailjs.com/docs/) or contact support.
