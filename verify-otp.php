<?php
require_once __DIR__ . '/includes/db.php';
session_start();

// If no POST, show the Verification UI
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $pendingId = isset($_GET['pending_id']) ? intval($_GET['pending_id']) : 0;
    $emailParam = isset($_GET['email']) ? htmlspecialchars($_GET['email']) : '';
    if ($pendingId > 0) {
        $check = $conn->prepare("SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'");
        $check->bind_param('s', $dbname);
        $check->execute();
        $cRes = $check->get_result()->fetch_assoc();
        $check->close();
        if (!(isset($cRes['c']) && intval($cRes['c']) > 0)) {
            header('Location: register.html?error=' . urlencode('Server misconfiguration: pending_registrations table missing. Run migrate_schema.php')); exit();
        }
    }
    $message = isset($_GET['message']) ? htmlspecialchars($_GET['message']) : '';
    $errorMsg = isset($_GET['error']) ? htmlspecialchars($_GET['error']) : '';
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify account — 4D signs</title>
    </head>
    <body>
        <h1>Verify your account</h1>
    <?php if ($message) echo '<p style="color:green">' . $message . '</p>'; ?>
    <?php if ($errorMsg) echo '<p style="color:red">' . $errorMsg . '</p>'; ?>
    <form method="POST" action="verify-otp.php">
        <input type="hidden" name="user_id" value="<?php echo $userId; ?>">
        <input type="hidden" name="pending_id" value="<?php echo $pendingId; ?>">
    <input type="hidden" name="email" value="<?php echo $emailParam; ?>">
            <label>Enter OTP code</label><br>
            <input type="text" name="otp" placeholder="123456" required pattern="\d{6}"><br>
            <button type="submit">Verify</button>
        </form>
        <form action="resend-otp.php" method="GET" style="margin-top:12px;">
            <input type="hidden" name="user_id" value="<?php echo $userId; ?>">
            <input type="hidden" name="pending_id" value="<?php echo $pendingId; ?>">
            <input type="hidden" name="email" value="<?php echo $emailParam; ?>">
            <button type="submit">Resend OTP</button>
        </form>
            <p>If you didn't receive the email, check your message inbox or register again. OTP is sent via email to the address you provided at sign-up. <?php if ($emailParam) echo '<br><strong>Email:</strong> ' . htmlspecialchars($emailParam); ?></p>
    </body>
    </html>
    <?php
    exit();
}

// POST: verify OTP
$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$pendingId = isset($_POST['pending_id']) ? intval($_POST['pending_id']) : 0;
$emailParam = isset($_POST['email']) ? trim($_POST['email']) : '';
$otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';

if (($userId <= 0 && $pendingId <= 0) || $otp === '') {
    header('Location: login.html?error=' . urlencode('Missing data for verification'));
    exit();
}

$isPending = ($pendingId > 0);
if ($isPending) {
    $stmt = $conn->prepare("SELECT id, username, email, otp_code_hash, otp_expires_at FROM pending_registrations WHERE id = ?");
    $stmt->bind_param('i', $pendingId);
} else {
    $stmt = $conn->prepare("SELECT id, username, email, otp_code_hash, otp_expires_at FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
}
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows != 1) {
    $stmt->close();
    header('Location: login.html?error=' . urlencode('User not found'));
    exit();
}
$stmt->bind_result($id, $username, $email, $otpHash, $otpExpiresAt);
$stmt->fetch();
$stmt->close();

// Check expiry
if (!$otpHash || !$otpExpiresAt) {
    header('Location: login.html?error=' . urlencode('OTP not set or expired'));
    exit();
}

    if (new DateTime($otpExpiresAt) < new DateTime()) {
    if ($isPending) {
        header('Location: verify-otp.php?pending_id=' . $pendingId . '&error=' . urlencode('OTP expired') . ($emailParam ? '&email=' . urlencode($emailParam) : ''));
    } else {
        header('Location: verify-otp.php?user_id=' . $userId . '&error=' . urlencode('OTP expired') . ($emailParam ? '&email=' . urlencode($emailParam) : ''));
    }
    exit();
}

if (!password_verify($otp, $otpHash)) {
    if ($isPending) {
        header('Location: verify-otp.php?pending_id=' . $pendingId . '&error=' . urlencode('Invalid code') . ($emailParam ? '&email=' . urlencode($emailParam) : ''));
    } else {
        header('Location: verify-otp.php?user_id=' . $userId . '&error=' . urlencode('Invalid code') . ($emailParam ? '&email=' . urlencode($emailParam) : ''));
    }
    exit();
}

// Mark user as verified or create user from pending
if ($isPending) {
    // create user
    $sel = $conn->prepare("SELECT username, email, password_hash, phone, profile_pic_path FROM pending_registrations WHERE id = ?");
    $sel->bind_param('i', $pendingId);
    $sel->execute();
    $sel->bind_result($pUsername, $pEmail, $pPasswordHash, $pPhone, $pProfilePic);
    $sel->fetch();
    $sel->close();

    $insert = $conn->prepare("INSERT INTO users (username, email, password, phone, profile_pic_path, is_verified) VALUES (?, ?, ?, ?, ?, 1)");
    $insert->bind_param('sssss', $pUsername, $pEmail, $pPasswordHash, $pPhone, $pProfilePic);
    $insert->execute();
    $newUserId = $conn->insert_id;
    $insert->close();

    // delete pending
    $del = $conn->prepare('DELETE FROM pending_registrations WHERE id = ?');
    $del->bind_param('i', $pendingId);
    $del->execute();
    $del->close();
    $id = $newUserId;
    $username = $pUsername;
    $email = $pEmail;
} else {
    $up = $conn->prepare("UPDATE users SET is_verified = 1, otp_code_hash = NULL, otp_expires_at = NULL WHERE id = ?");
    $up->bind_param('i', $userId);
    $up->execute();
    $up->close();
}

// Auto-login user
$_SESSION['user_id'] = $id;
$_SESSION['username'] = $username;
$_SESSION['email'] = $email;
// Try to fetch the user's profile picture (if any) and set both session keys
$ppStmt = $conn->prepare('SELECT profile_pic_path, profile_pic FROM users WHERE id = ? LIMIT 1');
$ppStmt->bind_param('i', $id);
$ppStmt->execute();
$ppRes = $ppStmt->get_result();
if ($ppRes && ($ppRow = $ppRes->fetch_assoc())) {
    $ppath = $ppRow['profile_pic_path'] ?: $ppRow['profile_pic'] ?: '';
    if ($ppath && strpos($ppath, 'http') !== 0 && strpos($ppath, '/') !== 0) $ppath = '/4D-Signs/' . ltrim($ppath, '/\\');
    if ($ppath) {
        $_SESSION['profile_pic'] = $ppath;
        $_SESSION['profile_pic_path'] = $ppath;
    }
}
if ($ppStmt) $ppStmt->close();
header('Location: 4Dsigns.php');
exit();
?>