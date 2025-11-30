<?php
require_once __DIR__ . '/session_check.php';
// We can access user info via session now
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
// Normalize profile pic path from session to absolute path if it's relative or empty
// Prefer profile_pic_path if available (new schema), else fallback to profile_pic
$profile_pic = '';
if (isset($_SESSION['profile_pic_path']) && $_SESSION['profile_pic_path']) {
    $profile_pic = htmlspecialchars($_SESSION['profile_pic_path']);
} elseif (isset($_SESSION['profile_pic']) && $_SESSION['profile_pic']) {
    $profile_pic = htmlspecialchars($_SESSION['profile_pic']);
}
if ($profile_pic && strpos($profile_pic, '/') !== 0 && !preg_match('/^https?:\/\//', $profile_pic)) {
    // If it's a relative path such as "uploads/foo.jpg", prefix with the application base
    $profile_pic = '/4D-Signs/' . ltrim($profile_pic, '\\/');
}
if (empty($profile_pic)) {
    $profile_pic = 'https://via.placeholder.com/32x32/FFD700/28263A?text=U';
}
$userid = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4D signs - Custom Signage & Souvenirs</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <header class="main-header">
        <div class="header-content">
            <div class="left-section">
                <div class="profile-dropdown">
                    <button class="profile-btn" id="profile-btn"><img src="<?= $profile_pic ?>" alt="Profile" class="profile-img"></button>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="contact.html"><i class="fas fa-envelope"></i>Contact</a>
                        <a href="account-settings.html"><i class="fas fa-cog"></i>Settings</a>
                        <a href="logout.php"><i class="fas fa-sign-out-alt"></i>Logout</a>
                    </div>
                </div>
                <a href="/4D-Signs/Homepage.html" class="logo">4D Signs</a>
            </div>
            <nav class="nav-bar">
                <a href="/4D-Signs/4Dsigns.php" class="nav-link active"><i class="fas fa-home"></i> Home</a>
                <a href="/4D-Signs/customize.html" class="nav-link"><i class="fas fa-palette"></i> Customize</a>
                <a href="/4D-Signs/review.html" class="nav-link"><i class="fas fa-star"></i> <span>Orders/Reviews</span></a>
                <a href="/4D-Signs/cart.html" class="nav-link" title="Cart"><i class="fas fa-shopping-cart"></i></a>
                <a href="/4D-Signs/contact.html" class="nav-link" title="Contact"><i class="fas fa-envelope"></i></a>
            </nav>
        </div>
    </header>

    <section class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <h2 class="hero-title">Your Vision, <span class="highlight">Our Signs</span></h2>
            <div class="hero-features">
                <div class="feature">
                    <i class="fas fa-paint-brush"></i>
                    <span>Custom Designs</span>
                </div>
                <div class="feature">
                    <i class="fas fa-star"></i>
                    <span>Premium Quality</span>
                </div>
                <div class="feature">
                    <i class="fas fa-store"></i>
                    <span>Store Pickup</span>
                </div>
                <div class="feature">
                    <i class="fas fa-truck"></i>
                    <span>Fast Delivery</span>
                </div>
            </div>
            <p class="hero-description">Transform your business or event with custom, high-impact signage and souvenirs. We bring your ideas to life with premium materials and expert craftsmanship.</p>
            <div class="hero-buttons">
                <a href="#products" class="cta-button primary">Explore Products</a>
                <a href="customize.html" class="cta-button secondary">Start Designing</a>
            </div>
        </div>
        <div class="hero-scroll">
            <span>Scroll Down</span>
            <i class="fas fa-chevron-down"></i>
        </div>
    </section>
    <main>
        <div id="products"></div>
        <div class="product-list">
            <!-- Product items copied from 4Dsigns.html for the main page -->
            <?php include __DIR__ . '/4Dsigns-products.html'; ?>
        </div>
    </main>

    <!-- Add-to-cart modal and floating cart -->
    <?php include __DIR__ . '/4Dsigns-modals.html'; ?>

    <script>
        // Remove localStorage based logout and session checks, as we are now authenticated via server session
        function logout() {
            window.location.href = 'logout.php';
        }
    </script>
    <script>
        // Expose server-side auth state to client-side scripts so UI logic prefers server session
        window.serverAuth = true;
    window.serverUser = {
                id: <?php echo json_encode((string)$userid); ?>,
                username: <?php echo json_encode($username); ?>,
                email: <?php echo json_encode(isset($_SESSION['email']) ? $_SESSION['email'] : ''); ?>,
                phone: <?php echo json_encode(isset($_SESSION['phone']) ? $_SESSION['phone'] : ''); ?>,
                created_at: <?php echo json_encode(isset($_SESSION['created_at']) ? $_SESSION['created_at'] : ''); ?>,
                loggedInAt: <?php echo json_encode(isset($_SESSION['loggedInAt']) ? $_SESSION['loggedInAt'] : ''); ?>
        ,profile_pic: <?php echo json_encode($profile_pic); ?>
        ,profile_pic_path: <?php echo json_encode($profile_pic); ?>
        };
        try {
            if (window.serverAuth && window.serverUser) {
                localStorage.setItem('loggedInUser', JSON.stringify(window.serverUser));
            }
        } catch (e) { /* ignore */ }
    </script>
    <script>
        // Update header avatar when localStorage.loggedInUser is changed by another tab (e.g. after profile pic update)
        window.addEventListener('storage', function(e) {
            if (e.key === 'loggedInUser') {
                try {
                    const su = JSON.parse(e.newValue || 'null');
                    if (su) {
                        const pic = (su.profile_pic || su.profile_pic_path || '').trim();
                        let picPath = pic;
                        if (picPath && picPath.indexOf('http') !== 0 && !picPath.startsWith('/')) picPath = '/4D-Signs/' + picPath;
                        const profileImg = document.querySelector('.profile-img');
                        if (profileImg && picPath) { profileImg.src = picPath; profileImg.alt = `${su.username || 'User'}'s profile`; }
                    }
                } catch (err) {}
            }
        });
    </script>
</body>
</html>
