<?php
// scripts/send_test_email.php
// Usage: php send_test_email.php recipient@example.com "Message text"
require_once __DIR__ . '/../includes/notifications.php';
require_once __DIR__ . '/../includes/db.php';

if ($argc < 3) {
    echo "Usage: php send_test_email.php <recipient-email> \"message\"\n";
    exit(1);
}

$to = $argv[1];
$msg = $argv[2];

echo "Sending test email to $to...\n";
$ok = sendEmail($to, '4D-Signs Test Email', $msg);
if ($ok) {
    echo "Sent OK\n";
    exit(0);
}
echo "Send failed. Check notifications.log and SMTP config.\n";
exit(2);

?>
