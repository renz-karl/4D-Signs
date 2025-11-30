<?php
// api/resend-otp.php - AJAX endpoint for resending OTP (returns JSON)
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/notifications.php';

// Robust error handling: ensure any Throwable returns JSON
try {

$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$pendingId = isset($_POST['pending_id']) ? intval($_POST['pending_id']) : 0;
if ($userId <= 0 && $pendingId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user']);
    exit();
}

$isPending = ($pendingId > 0);
if ($isPending) {
    // quick check: pending table exists
    $s = $conn->prepare("SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pending_registrations'");
    $dbParam = isset($config['db_name']) ? $config['db_name'] : $dbname;
    $s->bind_param('s', $dbParam);
    $s->execute();
    $r = $s->get_result()->fetch_assoc();
    $s->close();
    if (!(isset($r['c']) && intval($r['c']) > 0)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Server misconfiguration: pending_registrations table missing. Run migrate_schema.php']);
        exit();
    }
}
if ($isPending) {
    $stmt = $conn->prepare('SELECT id, email, phone FROM pending_registrations WHERE id = ?');
    $stmt->bind_param('i', $pendingId);
} else {
    $stmt = $conn->prepare('SELECT id, email, phone FROM users WHERE id = ?');
    $stmt->bind_param('i', $userId);
}
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows != 1) { $stmt->close(); http_response_code(404); echo json_encode(['success'=>false,'error'=>'User not found']); exit(); }
$stmt->bind_result($id, $email, $phone);
$stmt->fetch();
$stmt->close();

$otp = strval(random_int(100000, 999999));
$otpHash = password_hash($otp, PASSWORD_DEFAULT);
$expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

$up = $isPending ? $conn->prepare('UPDATE pending_registrations SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?') : $conn->prepare('UPDATE users SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?');
$targetId = $isPending ? $pendingId : $userId;
$up->bind_param('ssi', $otpHash, $expiresAt, $targetId);
$ok = $up->execute();
$up->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Failed to generate OTP']);
    exit();
}

                        $message = 'Your new OTP code is: ' . $otp . "\nThis code expires in 15 minutes.";
                        $sent = false;
                        $recipient = $email ?: $phone; // prefer email (we use email for OTP); fallback to phone if present but we send via email
                        if (!empty($recipient) && sendEmail($recipient, '4D Signs — Verification Code', $message)) {
                            $sent = true;
                            $respMsg = 'A new OTP was sent to your email ' . $recipient;
                        } else {
                            error_log("Email send failed for recipient: $recipient\n", 3, __DIR__ . '/../notifications.log');
                            $respMsg = 'Failed to send OTP via email. Please contact the site administrator.';
                        }
            // JSON payload: only include debug OTP if debug mode enabled and running locally
            $payload = ['success' => true, 'message' => $respMsg];
            $canShowDebug = (!empty($config['debug']) && $config['debug'] === true && in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']));
            if ($canShowDebug && !$sent) {
                $payload['debugOtp'] = $otp;
            }
            if (!$sent) {
                http_response_code(500);
                $payload['success'] = false;
                $payload['error'] = $respMsg;
                echo json_encode($payload);
                exit();
            }
            echo json_encode($payload);
exit();
} catch (Throwable $t) {
    http_response_code(500);
    error_log('Exception in api/resend-otp.php: ' . $t->getMessage() . "\n" . $t->getTraceAsString(), 3, __DIR__ . '/../notifications.log');
    $errMsg = 'Internal server error';
    $errMsg = (!empty($config['debug']) ? ('Server error: ' . $t->getMessage()) : $errMsg);
    echo json_encode(['success' => false, 'error' => $errMsg]);
    exit();
}
?>
