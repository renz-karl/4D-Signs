<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.html?error=' . urlencode('Please sign in to continue.'));
    exit();
}
?>