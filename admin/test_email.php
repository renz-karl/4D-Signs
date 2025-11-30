<?php
// admin/test_email.php - Local-only Email test page
require_once __DIR__ . '/../includes/notifications.php';
require_once __DIR__ . '/../includes/db.php';

$remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($remoteIp, ['127.0.0.1', '::1'])) {
    http_response_code(403);
    echo "Access denied. This page can only be used on localhost.";
    exit();
}

$message = '';
$sentOk = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to = trim($_POST['to'] ?? '');
    $msg = trim($_POST['message'] ?? '');
    if ($to !== '' && $msg !== '') {
        $sentOk = sendEmail($to, '4D-Signs Test Email', $msg);
        $message = $sentOk ? 'Sent OK' : 'Send failed. Check notifications.log for details.';
    } else {
        $message = 'Provide both email and message.';
    }
}
?>
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Email Test — Admin</title></head><body>
<h2>Email Test</h2>
<form method="post">
    <label>To (email): <input type="email" name="to" placeholder="you@example.com" style="width:300px"></label><br><br>
    <label>Message: <input type="text" name="message" placeholder="Test Email from 4D-Signs" style="width:300px"></label><br><br>
    <button type="submit">Send</button>
    <button type="button" onclick="window.location='/'">Home</button>
</form>
<?php if ($message) echo '<p><strong>' . htmlspecialchars($message) . '</strong></p>'; ?>
<p>Note: This uses PHP's sendEmail() helper (currently mail()). For SMTP, set SMTP details in includes/config.php and ensure a mail library or local MTA is configured.</p>
</body></html>
