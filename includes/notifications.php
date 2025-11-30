<?php
// Helper notification functions (email and SMS) - no external libraries
$config = [];
if (file_exists(__DIR__ . '/config.php')) {
    $config = require __DIR__ . '/config.php';
}

function normalizePhone($phone) {
    // Normalize Philippine local numbers 09XXXXXXXXX to +63XXXXXXXXX
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    if (preg_match('/^09(\d{9})$/', $phone, $m)) {
        return '+63' . $m[1];
    }
    if (preg_match('/^\+63(\d{9})$/', $phone, $m)) {
        return '+63' . $m[1];
    }
    // If it's already E.164, just return
    if (strpos($phone, '+') === 0) return $phone;
    return $phone; // best effort
}

function sendSmsViaTwilio($to, $message) {
    global $config;
    if (empty($config['twilio_account_sid']) || empty($config['twilio_auth_token']) || empty($config['twilio_from_number'])) {
        return false;
    }

    $sid = $config['twilio_account_sid'];
    $token = $config['twilio_auth_token'];
    $from = $config['twilio_from_number'];

    $to = normalizePhone($to);

    $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
    $data = http_build_query([
        'From' => $from,
        'To' => $to,
        'Body' => $message
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_USERPWD, "$sid:$token");
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        error_log("Twilio send error: $err\n", 3, __DIR__ . '/../notifications.log');
        return false;
    }
    if ($httpcode >= 200 && $httpcode < 300) {
        return true;
    }
    error_log("Twilio returned HTTP $httpcode: $response\n", 3, __DIR__ . '/../notifications.log');
    return false;
}

function sendSms($to, $message) {
    global $config;
    // If Twilio configured, try it
    if (!empty($config['twilio_account_sid'])) {
        return sendSmsViaTwilio($to, $message);
    }
    // Fallback: no SMS available
    return false;
}

function sendEmail($to, $subject, $message) {
    global $config;
    // If SMTP config present, try PHPMailer SMTP; otherwise fallback to PHP mail().
    $from = $config['from_email'] ?? 'noreply@4dsigns.local';
    // Use PHPMailer if installed and SMTP configured
    if (!empty($config['smtp_host'])) {
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (file_exists($autoload)) {
            require_once $autoload;
            try {
                $mail = new PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = $config['smtp_host'];
                $mail->SMTPAuth = true;
                $mail->Username = $config['smtp_user'] ?? '';
                $mail->Password = $config['smtp_pass'] ?? '';
                $mail->SMTPSecure = $config['smtp_secure'] ?? 'tls';
                $mail->Port = $config['smtp_port'] ?? 587;
                $mail->setFrom($from, $config['from_name'] ?? '4D Signs');
                $mail->addAddress($to);
                $mail->Subject = $subject;
                $mail->Body = $message;
                $mail->isHTML(false);
                // If debug is enabled in config, log SMTP debug output to notifications.log for local dev
                $isDebug = !empty($config['debug']);
                if ($isDebug) {
                    $mail->SMTPDebug = 2;
                    $mail->Debugoutput = function($str, $level) {
                        error_log("[PHPMailer debug] $str\n", 3, __DIR__ . '/../notifications.log');
                    };
                }
                if ($mail->send()) {
                    return true;
                }
                error_log('PHPMailer failed to send: ' . $mail->ErrorInfo . "\n", 3, __DIR__ . '/../notifications.log');
            } catch (Exception $e) {
                error_log('PHPMailer exception: ' . $e->getMessage() . "\n", 3, __DIR__ . '/../notifications.log');
            }
        } else {
            error_log('PHPMailer not installed (vendor/autoload.php missing). Falling back to mail()'."\n", 3, __DIR__ . '/../notifications.log');
        }
    }
    // Fallback to PHP mail() if PHPMailer not available or SMTP fails
    $headers = 'From: ' . $from . "\r\n";
    return mail($to, $subject, $message, $headers);
}

?>