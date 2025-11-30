<?php
require_once __DIR__ . '/session_check.php';
// We can access user info via session now
$username = isset($_SESSION['username']) ? htmlspecialchars($_SESSION['username']) : 'User';
$profile_pic = isset($_SESSION['profile_pic']) ? htmlspecialchars($_SESSION['profile_pic']) : 'https://via.placeholder.com/32x32/FFD700/28263A?text=U';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4D signs - Custom Signage & Souvenirs</title>
    <link rel="stylesheet" href="/4D-Signs/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <header class="main-header">
        <div class="header-content">
            <div class="left-section">
                <div class="profile-dropdown">
                    <button class="profile-btn" id="profile-btn"><img src="<?= $profile_pic ?>" alt="Profile" class="profile-img"></button>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="/4D-Signs/contact.html"><i class="fas fa-envelope"></i>Contact</a>
                        <a href="/4D-Signs/account-settings.html"><i class="fas fa-cog"></i>Settings</a>
                        <a href="/4D-Signs/logout.php"><i class="fas fa-sign-out-alt"></i>Logout</a>
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
                <a href="/4D-Signs/customize.html" class="cta-button secondary">Start Designing</a>
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
            window.location.href = '/4D-Signs/logout.php';
        }
    </script>
</body>
</html>
