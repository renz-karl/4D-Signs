// cart-utils.js - central cart helpers to enable per-user cart storage
(function(){
    function getUserIdentifier() {
        try {
            if (typeof window !== 'undefined' && window.serverAuth && window.serverUser && (window.serverUser.id || window.serverUser.username)) {
                return (window.serverUser.id || window.serverUser.username).toString().replace(/\s+/g, '_');
            }
            const lsu = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
            if (lsu && (lsu.id || lsu.email || lsu.username)) {
                return (lsu.id || lsu.email || lsu.username).toString().replace(/\s+/g, '_');
            }
        } catch (e) { /* ignore */ }
        return 'guest';
    }

    function cartItemsKey() { return 'cartItems_' + getUserIdentifier(); }
    function cartCountKey() { return 'cartCount_' + getUserIdentifier(); }

    function readItemsFromKey(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
    }

    function getItems() {
        // Prefer the per-user key; fall back to legacy key 'cartItems' for migrations
        const key = cartItemsKey();
        let items = readItemsFromKey(key);
        if (!items || items.length === 0) {
            // check the legacy key
            items = readItemsFromKey('cartItems');
        }
        return items || [];
    }

    function setItems(items) {
        const key = cartItemsKey();
        const countKey = cartCountKey();
        try { localStorage.setItem(key, JSON.stringify(items)); } catch(e) {}
        const count = items.reduce((s,it) => s + (parseInt(it.qty,10) || 0), 0);
        try { localStorage.setItem(countKey, String(count)); } catch(e) {}
        // Notify other tabs/pages
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count, items } }));
    }

    function getCount() {
        const key = cartCountKey();
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    // When a user logs in, migrate legacy 'cartItems' to the user-specific key
    function migrateLegacyCart() {
        try {
            const legacy = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (!legacy || legacy.length === 0) return;
            const current = getItems() || [];
            // Merge by id (simple approach) - append legacy items that are not duplicates
            const ids = new Set(current.map(i => String(i.id)));
            legacy.forEach(item => { if (!ids.has(String(item.id))) current.push(item); });
            setItems(current);
            localStorage.removeItem('cartItems');
            // Remove legacy count
            try { localStorage.removeItem('cartCount'); } catch (e) {}
        } catch(e) { /* ignore */ }
    }

    // Expose helpers
    window.cartStorage = {
        getUserIdentifier,
        cartItemsKey,
        cartCountKey,
        getItems,
        setItems,
        getCount,
        migrateLegacyCart
    };

    // Migrate on load
    document.addEventListener('DOMContentLoaded', function(){
        try { window.cartStorage.migrateLegacyCart(); } catch(e) {}
    });
})();
