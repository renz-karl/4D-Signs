Also available: a web migration helper for local development (only allowed from localhost): `migrate_admin.php`. Open `http://localhost/4D-Signs/migrate_admin.php` in your browser to run the migration with DB credentials (only use on local dev machines). This performs the pending table creation and adds unique phone indices when possible.
Optional: create a cron job or scheduled script to remove stale pending registrations older than 24h to avoid cluttering the DB. For example you might run the following SQL nightly:

   DELETE FROM pending_registrations WHERE created_at < (NOW() - INTERVAL 24 HOUR);
Authentication Setup - 4D-Signs

Overview:
This project includes a server-backed login and registration flow using PHP and MySQL (XAMPP). The app stores user accounts in the `4d_signs_db` database. Use phpMyAdmin or the MySQL CLI to create the `users` table using `database_setup.sql`.

Steps to initialize the database:

1) Start XAMPP and ensure Apache and MySQL services are running.

2) Option A - Using phpMyAdmin (recommended):
   - Open http://localhost/phpmyadmin/
   - Select the `4d_signs_db` database from the left sidebar.
   - Click on the SQL tab and paste the contents of `database_setup.sql`. Click Go.

3) Option B - Using PowerShell with XAMPP MySQL (works if you have no password for root):
   - Open a PowerShell window and change to this project folder.
   - Run:

   Get-Content database_setup.sql | & 'C:\xampp\mysql\bin\mysql.exe' -u root 4d_signs_db

   - This pipes the SQL file into the mysql command to create the `users` table.

4) Verify the table exists using phpMyAdmin or the CLI:
    - phpMyAdmin > 4d_signs_db > Structure (look for `users`)
   - If you added users before, note the new schema stores profile image paths in `profile_pic_path` (not base64) and includes `last_login`, `is_admin` and OTP columns. If OTP verification is enabled, new users must verify through a 6-digit OTP sent via SMS to the phone number they provided before they are logged in.
   - If you added users before, note the new schema stores profile image paths in `profile_pic_path` (not base64) and includes `last_login`, `is_admin` and OTP columns. If OTP verification is enabled, new users must verify through a 6-digit OTP sent via SMS to their phone number before they are logged in. You can mark a user as already verified by running:

            UPDATE users SET is_verified = 1 WHERE username = 'your-user';

         Or use the CLI helper:

            php scripts/verify_user.php <username_or_id>
       - If you added users before, note the new schema stores profile image paths in `profile_pic_path` (not base64) and includes `last_login` and `is_admin`.
      - If you used the older base64 `profile_pic` column, run the migration script to add missing columns and check for base64 images that may need manual migration:

            php migrate_schema.php

         - If base64 images exist, follow the script's prompt and consider migrating them manually or contacting me for a helper script to automate conversion and move files into `uploads/`.
   - Or in PowerShell run:

   & 'C:\xampp\mysql\bin\mysql.exe' -u root -e "SELECT COUNT(*) FROM 4d_signs_db.users;"

Email OTP:
- The system now uses email for OTP delivery by default. Configure SMTP or a local mail agent so PHP's `mail()` can send emails from the server. Copy `includes/config.php.example` to `includes/config.php` and set the `from_email` or SMTP settings if you have them.
- If the app can send email using `sendEmail()` (via PHP mail or an SMTP implementation), the OTP will be emailed to the address provided on registration. If email fails, local debug mode (in `includes/config.php` with `debug => true`) can show the OTP only on localhost for development.

Using the app:
 - Register: http://localhost/4D-Signs/register.html
- Login: http://localhost/4D-Signs/login.html
         - On successful registration, the site stores the submitted data in a temporary `pending_registrations` table and sends an OTP via SMS. The account is NOT created in the `users` table until the OTP is verified; this prevents unverified accounts from being used. When the OTP is successfully verified, the server creates a real `users` row and logs the user in. The OTP modal can also be launched by following the link parameter `?pending_id=<id>&show_verify_modal=1` for new registrations, or `?user_id=<id>&show_verify_modal=1` for unverified users.
          - On successful registration, the site stores the submitted data in a temporary `pending_registrations` table and sends an OTP via SMS. The account is NOT created in the `users` table until the OTP is verified; this prevents unverified accounts from being used. Phone numbers are unique across users and pending registrations, and the server rejects attempts to register with a phone that's already used. When the OTP is successfully verified, the server creates a real `users` row and logs the user in. The OTP modal can also be launched by following the link parameter `?pending_id=<id>&show_verify_modal=1` for new registrations, or `?user_id=<id>&show_verify_modal=1` for unverified users.
If accounts inserted in phpMyAdmin don't appear in the app:

- Make sure you are inserting rows into the correct database (`4d_signs_db`) and into the `users` table (not the MySQL "Users" list under phpMyAdmin which manages DB access).
- Use the site registration form (`register.html`) or the provided CLI script `scripts/create_user.php` to add an application user. The script ensures a secure hashed password is stored.
- If you add a user via phpMyAdmin SQL, generate a password hash and insert it, for example:

  1) Generate a hashed password using PHP CLI:

     & 'C:\xampp\php\php.exe' -r "echo password_hash('MySecretPassword', PASSWORD_DEFAULT);"

  2) Use that hash in an INSERT query in phpMyAdmin (choose `4d_signs_db` first):

     INSERT INTO users (username, email, password, phone, profile_pic_path, status)
     VALUES ('bob', 'bob@example.com', '$2y$10$EXAMPLEHASH...', '09123456789', NULL, 'active');

  3) If you simply added a MySQL "user" under phpMyAdmin > Users, that will not create an app account visible in the `users` table.

If you created accounts in a different DB (for example `dbhome`), use the migration utility `scripts/migrate_users_dbhome_to_4d_signs_db.php` to move rows into `4d_signs_db` safely:

  php scripts/migrate_users_dbhome_to_4d_signs_db.php --run


Important server-side changes:
- Database configuration is centralized in `includes/db.php`.
- Profile images are now saved to `uploads/` and referenced by `profile_pic_path` in the DB.
- There is now a `logout.php` endpoint that destroys the session, and `session_check.php` to protect PHP pages.
- A new server-side page `4Dsigns.php` exists and requires authentication; `4Dsigns.html` now redirects to it.

Create a non-root DB user (optional, recommended):
     1) In phpMyAdmin, run (or use `scripts/create_webuser.php` with a custom password):
        CREATE USER 'webuser'@'localhost' IDENTIFIED BY 'your_password';
        GRANT SELECT, INSERT, UPDATE, DELETE ON 4d_signs_db.* TO 'webuser'@'localhost';
        FLUSH PRIVILEGES;
     2) Copy `includes/config.php.example` to `includes/config.php` and update the credentials to use the new `webuser`.
        The code automatically detects `includes/config.php` if present and uses its credentials for the DB connection.

Schema upgrades and migration:
- Run `php migrate_schema.php` to ensure the new columns (`profile_pic_path`, `is_admin`, `last_login`) are present. If you previously stored images as base64 in `profile_pic`, run the migration helper or contact me to automate it.
 - Run `php migrate_schema.php` to ensure the new columns (`profile_pic_path`, `is_admin`, `last_login`) are present. If you previously stored images as base64 in `profile_pic`, run the migration helper or contact me to automate it.
    - If you get an error like "pending_registrations doesn't exist" during signup, your web DB user may lack permission to create tables. Run the migration script as a user with CREATE TABLE privileges:
       ```powershell
       & 'C:\xampp\php\php.exe' migrate_schema.php
       ```
       Or run the following SQL in phpMyAdmin (choose `4d_signs_db` first):
       ```sql
       CREATE TABLE IF NOT EXISTS pending_registrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          phone VARCHAR(20) DEFAULT NULL,
          profile_pic_path VARCHAR(255) DEFAULT NULL,
          otp_code_hash VARCHAR(255) DEFAULT NULL,
          otp_expires_at DATETIME DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
       );

   Or use the helper CLI script which connects with DB credentials you provide (root):
   ```powershell
   & 'C:\xampp\php\php.exe' scripts\create_pending_table.php localhost <db_user> <db_pass> 4d_signs_db
   ```
       ```

Notes:
- We put all user records into the `users` table, password is stored hashed with PHP's password_hash.
- Sessions are used to persist login state after successful login.
`profile_pic_path` now stores an image path in the DB (e.g., uploads/xxxx.jpg). Previously, profile image data was stored as base64 in `profile_pic`.
- For security and scale, consider storing images on disk or with S3 and only storing references in the DB.

Note about duplicate databases:
- You may see both `4d_signs_db` and `dbhome` in phpMyAdmin. `4d_signs_db` exists because it was created earlier by a previous script or by running an earlier version of `database_setup.sql` that used that name.
- The project now uses `4d_signs_db` (see `register.php` and `login.php`). If you don't need `dbhome` you can remove it; if you'd rather use `dbhome` instead, change the `$dbname` configuration in `register.php` and `login.php` accordingly.
- If you want to consolidate data between them, you can copy rows from one to the other and then drop the unused database. See the "Migration & cleanup" steps below.

Next steps:
- Add a `logout.php` endpoint that destroys the session.
Migration & cleanup (optional):
-- If you need to migrate users from `dbhome` into `4d_signs_db` (keeps only unique username/email rows):

   INSERT INTO 4d_signs_db.users (username, email, password, phone, profile_pic_path, created_at, status)
   SELECT u.username, u.email, u.password, u.phone, u.profile_pic, u.created_at, u.status
   FROM dbhome.users AS u
   LEFT JOIN 4d_signs_db.users AS d ON d.username = u.username OR d.email = u.email
   WHERE d.id IS NULL;

- Drop the unused database (be very careful, this is irreversible):

   DROP DATABASE IF EXISTS `4d_signs_db`;

Use phpMyAdmin or the MySQL CLI to run these commands. Backup data before running destructive commands.
- Add a `session_check.php` include to deny access to pages for unauthenticated users.
- Add more robust server-side validation and rate limiting for login attempts.

If you'd like, I can implement the logout and session-check helpers as the next step.
