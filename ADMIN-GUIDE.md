# 4D Signs Admin System Guide

## Admin Account

The system uses **ONE single admin account** for security and simplicity.

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## How to Login

1. **Open the Login Page**
   - Navigate to `admin-login.html` in your browser

2. **Enter Credentials**
   - **Username**: `admin`
   - **Password**: `admin123`

3. **Click Login**
   - You'll be redirected to the admin dashboard

---

## How to Change Admin Password

### Method 1: Through Code (Recommended)

1. Open `admin-login.js` in a text editor
2. Find the `ADMIN_ACCOUNT` object (around line 2-5):
   ```javascript
   const ADMIN_ACCOUNT = {
       username: 'admin',
       password: 'admin123'
   };
   ```
3. Change the password value to your desired password
4. Save the file
5. Login with your new password

### Method 2: Change Username Too

You can also change the username in the same file:
```javascript
const ADMIN_ACCOUNT = {
    username: 'your-new-username',
    password: 'your-new-password'
};
```

---

## Admin Dashboard Features

Once logged in, you can:
- ✅ View dashboard statistics (products, orders, revenue)
- ✅ Manage products (view, edit, delete)
- ✅ View and manage orders
- ✅ View customer information
- ✅ Monitor system activity

---

## Security Notes

⚠️ **Important for Production:**
- Change the default password immediately
- Move admin authentication to a backend server
- Use encrypted passwords (bcrypt, etc.)
- Store credentials in a secure database
- Use HTTPS for all admin pages
- Implement rate limiting for login attempts
- Add two-factor authentication (2FA)

---

## Troubleshooting

**Can't login?**
- Make sure you're using username: `admin` and password: `admin123`
- Clear browser cache and try again
- Check browser console for errors (F12)

**Need to reset password?**
- Open `admin-login.js` in a text editor
- Change the password in the `ADMIN_ACCOUNT` object
- Save and refresh the login page

---

## Files in Admin System

- `admin-login.html` - Login page
- `admin-login.css` - Login page styles
- `admin-login.js` - Login functionality (contains admin credentials)
- `admin-dashboard.html` - Admin dashboard
- `admin-dashboard.css` - Dashboard styles
- `admin-dashboard.js` - Dashboard functionality

**Note**: The registration files (`admin-register.html` and `admin-register.js`) are not used in single account mode.

---

## Support

For questions or issues, contact your system administrator.

---

**Created for 4D Signs - November 2025**
