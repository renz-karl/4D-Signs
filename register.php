<?php
// register.php - Handle user registration

// Use centralized DB connection
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/notifications.php';
// Log connected DB for debugging
error_log("[REGISTER] Connecting DB: host={$servername} db={$dbname} user={$db_username}" . "\n", 3, __DIR__ . '/register.log');

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm-password'];
    $phone = trim($_POST['phone']);

    // Normalize phone into E.164 (e.g., +63XXXXXXXXX)
    $rawPhone = trim($_POST['phone']);
    // Validate inputs
    $errors = [];
    // Validate raw input format (local Philippines format expected)
    if (empty($rawPhone) || !preg_match('/^09[0-9]{9}$/', $rawPhone)) {
        $errors[] = "Valid phone number is required (format: 09XXXXXXXXX).";
    }
    $phone = normalizePhone($rawPhone);

    if (empty($username) || strlen($username) < 3) {
        $errors[] = "Username must be at least 3 characters.";
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Valid email is required.";
    }

    if (empty($password) || strlen($password) < 6) {
        $errors[] = "Password must be at least 6 characters.";
    }

    if ($password !== $confirm_password) {
        $errors[] = "Passwords do not match.";
    }

    // phone validated above against raw input format; normalized phone may be +63... now

    // Check if profile pic is uploaded and move it to uploads/ (optional)
    $profile_pic_data = null;
    $profile_pic_path = null;
    if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] == 0) {
        $file = $_FILES['profilePic'];
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
        if (in_array($file['type'], $allowed_types) && $file['size'] <= 2 * 1024 * 1024) { // 2MB limit
            $uploadsDir = __DIR__ . '/uploads';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0755, true);
            }
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid('p_', true) . '.' . $ext;
            $targetPath = $uploadsDir . '/' . $filename;
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $profile_pic_path = 'uploads/' . $filename; // relative path for use in HTML
            } else {
                $errors[] = "Failed to save profile picture on the server.";
            }
        } else {
            $errors[] = "Invalid profile picture. Must be JPG, PNG, or GIF under 2MB.";
        }
    }

    if (empty($errors)) {
        // Debug logging
        error_log("[REGISTER] Register attempt for: $email - username: $username\n", 3, __DIR__ . '/register.log');
        // Ensure pending_registrations table exists; attempt to create if possible. This prevents a fatal crash.
        function ensurePendingTableExists($conn, $db) {
            $sql = "SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'";
            $s = $conn->prepare($sql);
            $s->bind_param('s', $db);
            $s->execute();
            $res = $s->get_result();
            $row = $res->fetch_assoc();
            $s->close();
            if (isset($row['c']) && intval($row['c']) > 0) return true;
            // Try to create the table if user has privileges
            $createSql = "CREATE TABLE IF NOT EXISTS pending_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                profile_pic_path VARCHAR(255) DEFAULT NULL,
                otp_code_hash VARCHAR(255) DEFAULT NULL,
                otp_expires_at DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )";
            try {
                if ($conn->query($createSql) === TRUE) return true;
            } catch (Exception $e) {
                // Ignore and return false
                return false;
            }
            return false;
        }

            try {
                if (!ensurePendingTableExists($conn, $dbname)) {
                    $errors[] = "The server couldn't prepare the pending registration table. Please run 'php migrate_schema.php' (or use phpMyAdmin) as root to create it and ensure the web DB user has CREATE privileges.";
                }
            } catch (Exception $e) {
                $errors[] = "The server couldn't prepare the pending registration table: " . $e->getMessage() . " Please run 'php migrate_schema.php' (or use phpMyAdmin) as root to create it and ensure the web DB user has CREATE privileges.";
            }

        // Check if username or email already exists in users or pending_registrations
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->bind_param("ss", $username, $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $errors[] = "Username or email already exists.";
        }
        $stmt->close();

        if (empty($errors)) {
            // Check pending registrations for username/email duplicates
            $pstmt = $conn->prepare("SELECT id FROM pending_registrations WHERE username = ? OR email = ?");
            $pstmt->bind_param('ss', $username, $email);
            $pstmt->execute();
            $pstmt->store_result();
            if ($pstmt->num_rows > 0) {
                $errors[] = "A pending registration already exists for this username or email.";
            }
            $pstmt->close();

            // Validate phone uniqueness across users and pending registrations
            $pcheck = $conn->prepare("SELECT id FROM users WHERE phone = ?");
            $pcheck->bind_param('s', $phone);
            $pcheck->execute();
            $pcheck->store_result();
            if ($pcheck->num_rows > 0) {
                $errors[] = "Phone number already used by another account.";
            }
            $pcheck->close();

            if (empty($errors)) {
                $ppend = $conn->prepare("SELECT id FROM pending_registrations WHERE phone = ?");
                $ppend->bind_param('s', $phone);
                $ppend->execute();
                $ppend->store_result();
                if ($ppend->num_rows > 0) {
                    $errors[] = "An unverified registration already exists for this phone number.";
                }
                $ppend->close();
            }
    }

        if (empty($errors)) {
            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            // generate 6-digit OTP
            $otp = strval(random_int(100000, 999999));
            $otpHash = password_hash($otp, PASSWORD_DEFAULT);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Insert a pending registration; only create the real user after OTP verified
            $stmt = $conn->prepare("INSERT INTO pending_registrations (username, email, password_hash, phone, profile_pic_path, otp_code_hash, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssss", $username, $email, $hashed_password, $phone, $profile_pic_path, $otpHash, $expiresAt);

            if ($stmt->execute()) {
                // Success - generate OTP (already bound in insert) and get pending id
                $pendingId = $conn->insert_id;
                error_log("[REGISTER] Inserted pending_registrations.id={$pendingId} into DB {$dbname}\n", 3, __DIR__ . '/register.log');
                // OTP should be sent via Email (instead of SMS)
                $message = "Your OTP code is: " . $otp . "\nThis code expires in 15 minutes.";
                if (!empty($email)) {
                    if (sendEmail($email, '4D Signs — Verification Code', $message)) {
                        // Redirect to registration page with success message and open OTP modal
                        $msg = 'Account created! Verification code sent to your email ' . $email;
                        header("Location: register.html?pending_id=" . $pendingId . "&email=" . urlencode($email) . "&message=" . urlencode($msg) . "&show_verify_modal=1");
                        exit();
                    } else {
                        // Email send failed — try debug fallback and/or rollback
                        error_log("Email send failed for email: $email\n", 3, __DIR__ . '/notifications.log');
                        $isLocal = in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']);
                        $configLocal = [];
                        if (file_exists(__DIR__ . '/includes/config.php')) {
                            $configLocal = require __DIR__ . '/includes/config.php';
                        }
                        $debugEnabled = !empty($configLocal['debug']);
                        if ($debugEnabled && $isLocal) {
                            // Local dev fallback: show OTP code in message for convenience (debug only)
                            $msg = 'Account created! Use this OTP to verify: ' . $otp;
                            header("Location: register.html?pending_id=" . $pendingId . "&email=" . urlencode($email) . "&message=" . urlencode($msg) . "&show_verify_modal=1");
                            exit();
                        }
                        // Rollback pending registration if possible
                        try {
                            $delRollback = $conn->prepare('DELETE FROM pending_registrations WHERE id = ?');
                            $delRollback->bind_param('i', $pendingId);
                            $delRollback->execute();
                            $delRollback->close();
                        } catch (Exception $e) {
                            error_log('Failed to delete pending registration after email send failure: ' . $e->getMessage() . "\n", 3, __DIR__ . '/notifications.log');
                        }
                        $errors[] = 'Could not send verification email. Please contact the site administrator to enable email verification.';
                    }
                } else {
                    $errors[] = 'No email address provided. Email verification is required.';
                }
            } else {
                $errors[] = "Account created but failed to save OTP. Please contact support.";
            }
            $stmt->close();
    }
    // $stmt variable may be reused; we already closed statements where relevant
    }

    // If there are errors, redirect back with errors
    if (!empty($errors)) {
        $error_string = implode("\\n", $errors);
        header("Location: register.html?error=" . urlencode($error_string));
        exit();
    }
}

$conn->close();
?>