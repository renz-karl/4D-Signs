<?php
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/notifications.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $pendingId = isset($_GET['pending_id']) ? intval($_GET['pending_id']) : 0;
    $emailParam = isset($_GET['email']) ? trim($_GET['email']) : '';
    if ($userId <= 0 && $pendingId <= 0) {
        header('Location: login.html?error=' . urlencode('Invalid user')); exit();
    }

    if ($pendingId > 0) {
        // Ensure pending_registrations exists, otherwise ask admin to run migration
        $check = $conn->prepare("SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'");
        $check->bind_param('s', $dbname);
        $check->execute();
        $cRes = $check->get_result()->fetch_assoc();
        $check->close();
        if (!(isset($cRes['c']) && intval($cRes['c']) > 0)) {
            header('Location: register.html?error=' . urlencode('Server misconfiguration: pending_registrations table missing. Run migrate_schema.php')); exit();
        }
        $stmt = $conn->prepare('SELECT id, email, phone FROM pending_registrations WHERE id = ?');
        $stmt->bind_param('i', $pendingId);
    } else {
        $stmt = $conn->prepare('SELECT id, email, phone FROM users WHERE id = ?');
        $stmt->bind_param('i', $userId);
    }
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows != 1) { $stmt->close(); header('Location: login.html?error=' . urlencode('User not found')); exit(); }
    $stmt->bind_result($id, $email, $phone);
    $stmt->fetch();
    $stmt->close();

    $otp = strval(random_int(100000, 999999));
    $otpHash = password_hash($otp, PASSWORD_DEFAULT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    if ($pendingId > 0) {
        $up = $conn->prepare('UPDATE pending_registrations SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?');
        $targetId = $pendingId;
    } else {
        $up = $conn->prepare('UPDATE users SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?');
        $targetId = $userId;
    }
    $up->bind_param('ssi', $otpHash, $expiresAt, $targetId);
    $ok = $up->execute();
    $up->close();

    if ($ok) {
        $sent = false;
            $message = "Your new OTP code is: " . $otp . "\nThis code expires in 15 minutes.";
            if (!empty($email) && sendEmail($email, '4D Signs — Verification Code', $message)) {
                $sent = true;
                $msg = 'A new OTP was sent to your email ' . $email;
            } else {
                // Email not configured or failed — do not reveal OTP in UI
                error_log("Email send failed for email: $email\n", 3, __DIR__ . '/notifications.log');
                $err = 'Failed to send OTP via email. Please contact the site administrator.';
            }
    if ($pendingId > 0) {
        if (isset($err)) {
            header('Location: verify-otp.php?pending_id=' . $pendingId . '&error=' . urlencode($err) . ($emailParam ? '&email=' . urlencode($emailParam) : '')); exit();
        }
        header('Location: verify-otp.php?pending_id=' . $pendingId . '&message=' . urlencode($msg) . ($emailParam ? '&email=' . urlencode($emailParam) : '')); exit();
    } else {
        if (isset($err)) {
            header('Location: verify-otp.php?user_id=' . $userId . '&error=' . urlencode($err) . ($emailParam ? '&email=' . urlencode($emailParam) : '')); exit();
        }
        header('Location: verify-otp.php?user_id=' . $userId . '&message=' . urlencode($msg) . ($emailParam ? '&email=' . urlencode($emailParam) : '')); exit();
    }
    } else {
        header('Location: login.html?error=' . urlencode('Failed to generate OTP')); exit();
    }
}

header('Location: login.html');
exit();
?>