/**
 * Falcon Drums Cookie Consent Manager
 * GDPR & PIPEDA Compliant
 * Version 2.0 - Fixed critical compliance issues
 */

(function() {
    'use strict';

    const COOKIE_NAME = 'falcon_drums_cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;

    // Helper to get cookie value
    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [cookieName, value] = cookie.trim().split('=');
            if (cookieName === name) {
                return value;
            }
        }
        return null;
    }

    // Check if consent has been given (accepts both 'accepted' and 'essential')
    function hasConsent() {
        const value = getCookie(COOKIE_NAME);
        return value === 'accepted' || value === 'essential';
    }

    // Set consent cookie with Secure flag for HTTPS
    function setConsent(value) {
        const date = new Date();
        date.setTime(date.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toUTCString();
        const isSecure = window.location.protocol === 'https:' ? ';Secure' : '';
        document.cookie = `${COOKIE_NAME}=${value};${expires};path=/;SameSite=Strict${isSecure}`;
    }

    // Focus trap for accessibility
    let focusableElements = [];
    let firstFocusable = null;
    let lastFocusable = null;

    function trapFocus(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    }

    // Create and show banner
    function showBanner() {
        // Check if banner already exists
        if (document.getElementById('cookie-consent-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'true');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.setAttribute('aria-describedby', 'cookie-consent-description');

        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h3>🍪 We Value Your Privacy</h3>
                    <p id="cookie-consent-description">
                        We use essential cookies to process payments securely through PayPal. 
                        These cookies are necessary for the checkout process to function. 
                        By continuing to use our site, you consent to our use of cookies.
                    </p>
                    <p class="cookie-consent-links">
                        <a href="cookie-policy.html" target="_blank" rel="noopener">Cookie Policy</a> | 
                        <a href="privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a>
                    </p>
                </div>
                <div class="cookie-consent-actions">
                    <button id="cookie-accept" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies including analytics">
                        Accept All
                    </button>
                    <button id="cookie-essential" class="cookie-btn cookie-btn-essential" aria-label="Accept only essential cookies required for payment">
                        Essential Only
                    </button>
                    <button id="cookie-decline" class="cookie-btn cookie-btn-decline" aria-label="Decline all cookies - checkout will be disabled">
                        Decline
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Set up focus trap
        focusableElements = banner.querySelectorAll('a, button');
        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];
        document.addEventListener('keydown', trapFocus);

        // Add event listeners
        document.getElementById('cookie-accept').addEventListener('click', function() {
            setConsent('accepted');
            hideBanner();
            loadPayPalIfNeeded();
            enableCheckout();
        });

        document.getElementById('cookie-essential').addEventListener('click', function() {
            setConsent('essential');
            hideBanner();
            loadPayPalIfNeeded();
            enableCheckout();
        });

        document.getElementById('cookie-decline').addEventListener('click', function() {
            setConsent('declined');
            hideBanner();
            disableCheckout();
            showDeclineMessage();
        });

        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('cookie-consent-visible');
        }, 100);
    }

    // Hide banner
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('cookie-consent-visible');
            // Remove focus trap
            document.removeEventListener('keydown', trapFocus);
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    // Enable checkout functionality
    function enableCheckout() {
        const checkoutButtons = document.querySelectorAll('.btn-quote');
        checkoutButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = '';
        });
    }

    // Disable checkout functionality
    function disableCheckout() {
        const checkoutButtons = document.querySelectorAll('.btn-quote');
        checkoutButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Checkout requires essential cookies. Click to change cookie preferences.';
            btn.addEventListener('click', function(e) {
                if (btn.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Checkout requires essential cookies for payment processing. Would you like to change your cookie preferences?')) {
                        revokeConsent();
                    }
                }
            });
        });
    }

    // Show message when cookies are declined
    function showDeclineMessage() {
        const message = document.createElement('div');
        message.className = 'cookie-decline-notice';
        message.setAttribute('role', 'alert');
        message.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); 
                        background: rgba(255, 69, 0, 0.95); color: white; padding: 20px 30px; 
                        border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); 
                        max-width: 500px; z-index: 99998; text-align: center; animation: slideUp 0.3s ease;">
                <p style="margin: 0 0 15px 0; font-size: 0.95em; line-height: 1.6;">
                    <strong>Checkout Disabled</strong><br>
                    You've declined cookies. Payment processing requires essential cookies for security and fraud protection.
                </p>
                <button onclick="this.parentElement.parentElement.remove(); window.FalconDrumsCookieConsent.revokeConsent();" 
                        style="background: white; color: #ff4500; border: none; padding: 10px 24px; 
                               border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.9em;">
                    Change Cookie Preferences
                </button>
            </div>
        `;
        document.body.appendChild(message);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 10000);
    }

    // Load PayPal SDK dynamically if consent given
    function loadPayPalIfNeeded() {
        // Only load on shop page and if not already loaded
        if (!window.location.pathname.includes('shop.html') || window.paypal || document.getElementById('paypal-sdk-script')) {
            return;
        }

        const consentValue = getCookie(COOKIE_NAME);
        if (consentValue === 'accepted' || consentValue === 'essential') {
            // Find the placeholder PayPal script tag
            const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
            if (existingScript) {
                // Script is already in HTML, just mark it as loaded
                existingScript.id = 'paypal-sdk-script';
                return;
            }

            // If no script exists, create one dynamically
            const script = document.createElement('script');
            script.id = 'paypal-sdk-script';
            script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD';
            script.async = true;
            script.onload = function() {
                // PayPal SDK loaded successfully
                if (window.initPayPal && typeof window.initPayPal === 'function') {
                    window.initPayPal();
                }
            };
            script.onerror = function() {
                // Handle script loading error
                const error = document.createElement('div');
                error.className = 'payment-error';
                error.textContent = 'Payment system failed to load. Please refresh the page or contact support.';
                error.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4500; color: white; padding: 15px 30px; border-radius: 8px; z-index: 99999;';
                document.body.appendChild(error);
            };
            document.head.appendChild(script);
        }
    }

    // Revoke consent (used for "Change Cookie Preferences" functionality)
    function revokeConsent() {
        document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        showBanner();
    }

    // Initialize on page load
    function init() {
        const consentValue = getCookie(COOKIE_NAME);
        
        if (!consentValue) {
            // No consent given yet - show banner
            setTimeout(showBanner, 1000);
            // Disable checkout preemptively
            setTimeout(disableCheckout, 1000);
        } else if (consentValue === 'declined') {
            // User declined - disable checkout
            disableCheckout();
        } else if (consentValue === 'accepted' || consentValue === 'essential') {
            // User accepted - load PayPal and enable checkout
            loadPayPalIfNeeded();
            enableCheckout();
        }
    }

    // Expose public API
    window.FalconDrumsCookieConsent = {
        hasConsent: hasConsent,
        getConsentValue: function() {
            return getCookie(COOKIE_NAME);
        },
        showBanner: showBanner,
        revokeConsent: revokeConsent,
        enableCheckout: enableCheckout,
        disableCheckout: disableCheckout
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
