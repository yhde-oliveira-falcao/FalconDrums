# Cookie Policy Implementation - Required Fixes

## Priority 1: Critical Fixes (Must Fix Before Deployment)

### 1. Fix PayPal SDK Dynamic Loading

**File:** `shop.html`

**Current Problem:** PayPal SDK loads regardless of cookie consent

**Fix:** Remove the hardcoded PayPal script tag and load it dynamically:

```html
<!-- REMOVE THIS LINE (around line 1226): -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD"></script>
```

**File:** `assets/js/cookie-consent.js`

**Replace the loadPayPalIfNeeded() function:**

```javascript
// Load PayPal SDK if consent given and on shop page
function loadPayPalIfNeeded() {
    if (!window.location.pathname.includes('shop.html')) {
        return;
    }
    
    const consentValue = getCookie(COOKIE_NAME);
    
    if (consentValue === 'accepted' || consentValue === 'essential') {
        if (!window.paypal && !document.getElementById('paypal-sdk')) {
            const script = document.createElement('script');
            script.id = 'paypal-sdk';
            script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD';
            script.onload = function() {
                console.log('PayPal SDK loaded after consent');
                // Re-initialize checkout if modal is open
                if (document.getElementById('checkout-overlay').classList.contains('active')) {
                    initPayPal();
                }
            };
            document.head.appendChild(script);
        }
    }
}
```

---

### 2. Fix hasConsent() to Allow Essential Cookies

**File:** `assets/js/cookie-consent.js`

**Replace hasConsent() function:**

```javascript
// Check if consent has been given (accepted OR essential)
function hasConsent() {
    const value = getCookie(COOKIE_NAME);
    return value === 'accepted' || value === 'essential';
}
```

---

### 3. Disable Checkout When Cookies Declined

**File:** `shop.html`

**Add this code in the inline script section (after line 1540):**

```javascript
// Check consent status and disable checkout if declined
function checkCheckoutAvailability() {
    const consentValue = window.FalconDrumsCookieConsent?.getConsentValue();
    
    if (consentValue === 'declined') {
        // Disable all "Buy Now" buttons
        document.querySelectorAll('.btn-quote').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Payment processing requires essential cookies';
            
            // Prevent opening checkout
            const originalOnclick = btn.getAttribute('onclick');
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Payment processing is not available because cookies were declined. Please accept essential cookies to complete purchases.');
            });
        });
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkCheckoutAvailability);

// Also run after cookie consent changes
window.addEventListener('cookieConsentChanged', checkCheckoutAvailability);
```

---

### 4. Consolidate Cookie Getter Functions

**File:** `assets/js/cookie-consent.js`

**Remove the getCookie() function (lines 142-151) and update hasConsent():**

```javascript
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

// Check if consent has been given
function hasConsent() {
    const value = getCookie(COOKIE_NAME);
    return value === 'accepted' || value === 'essential';
}
```

---

### 5. Add Secure Flag to Cookie

**File:** `assets/js/cookie-consent.js`

**Update setConsent() function:**

```javascript
function setConsent(value) {
    const date = new Date();
    date.setTime(date.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    
    // Add Secure flag for HTTPS
    const isSecure = window.location.protocol === 'https:' ? ';Secure' : '';
    
    document.cookie = `${COOKIE_NAME}=${value};${expires};path=/;SameSite=Strict${isSecure}`;
    
    // Dispatch custom event so other code can react
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: { value } }));
}
```

---

## Priority 2: Major Improvements

### 6. Add Cookie Preferences Management

**File:** Create new file `assets/js/cookie-settings.js`

```javascript
/**
 * Cookie Settings Manager
 * Allows users to change preferences after initial consent
 */

(function() {
    'use strict';
    
    // Add "Cookie Settings" link to footer
    function addCookieSettingsLink() {
        const footerLinks = document.querySelector('.copyright li:last-child');
        if (footerLinks && !document.getElementById('cookie-settings-link')) {
            const settingsLink = document.createElement('a');
            settingsLink.id = 'cookie-settings-link';
            settingsLink.href = '#';
            settingsLink.textContent = 'Cookie Settings';
            settingsLink.style.marginLeft = '10px';
            
            settingsLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.FalconDrumsCookieConsent) {
                    window.FalconDrumsCookieConsent.revokeConsent();
                }
            });
            
            // Add separator
            footerLinks.appendChild(document.createTextNode(' | '));
            footerLinks.appendChild(settingsLink);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addCookieSettingsLink);
    } else {
        addCookieSettingsLink();
    }
})();
```

**Then add to all pages:**
```html
<script src="assets/js/cookie-settings.js"></script>
```

---

### 7. Fix Email Consistency

**File:** `privacy-policy.html` (line 408, 495)

**Change:**
```html
<a href="mailto:privacy@falcondrums.com">privacy@falcondrums.com</a>
```

**To:**
```html
<a href="mailto:info@falcondrums.com">info@falcondrums.com</a>
```

*(Unless you actually have a privacy@ email set up)*

---

### 8. Remove Debug Console.log

**File:** `assets/js/cookie-consent.js` (line 123)

**Remove or replace:**
```javascript
console.log('Payment processing enabled');
```

**With:**
```javascript
// Payment processing enabled - PayPal SDK loaded
```

---

## Priority 3: Polish & Best Practices

### 9. Add PayPal Cookies to Cookie Policy Table

**File:** `cookie-policy.html`

**Add rows to the cookie table (after line 299):**

```html
<tr>
    <td><strong>PYPF</strong></td>
    <td>PayPal fraud prevention cookie</td>
    <td>Essential (Third-Party)</td>
    <td>Session</td>
</tr>
<tr>
    <td><strong>ts_c</strong></td>
    <td>PayPal security cookie</td>
    <td>Essential (Third-Party)</td>
    <td>3 years</td>
</tr>
<tr>
    <td><strong>cookie_check</strong></td>
    <td>PayPal cookie verification</td>
    <td>Essential (Third-Party)</td>
    <td>Session</td>
</tr>
```

---

### 10. Add Focus Trap to Banner

**File:** `assets/js/cookie-consent.js`

**Add after showBanner() function:**

```javascript
// Focus trap for accessibility
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
    
    // Set initial focus
    firstElement.focus();
}
```

**Update showBanner() to use it:**

```javascript
// Show banner with animation
setTimeout(() => {
    banner.classList.add('cookie-consent-visible');
    trapFocus(banner);
}, 100);
```

---

### 11. Move Inline Styles to External CSS

**File:** `cookie-policy.html` and `privacy-policy.html`

**Create:** `assets/css/policy-pages.css`

Move all styles from `<style>` tags in both policy HTML files to this new file, then replace style tags with:

```html
<link rel="stylesheet" href="assets/css/policy-pages.css" />
```

---

## Testing Checklist

After implementing fixes:

- [ ] Test cookie consent banner appears on first visit
- [ ] Test "Accept All" loads PayPal SDK correctly
- [ ] Test "Essential Only" loads PayPal SDK correctly
- [ ] Test "Decline" disables checkout buttons
- [ ] Test cookie persists after page refresh
- [ ] Test "Cookie Settings" link in footer revokes consent
- [ ] Test keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] Test on mobile devices
- [ ] Test with browser cookies disabled
- [ ] Verify cookie has Secure flag in production (HTTPS)
- [ ] Test checkout flow with accepted cookies
- [ ] Test privacy@ email or update to info@ email

---

## Deployment Notes

1. **Before deploying to production:**
   - Replace `YOUR_PAYPAL_CLIENT_ID` with actual PayPal client ID
   - Ensure HTTPS is enabled (required for Secure cookie flag)
   - Test all cookie consent scenarios
   - Verify email addresses are correct and monitored

2. **Legal review:**
   - Have a lawyer review privacy and cookie policies
   - Ensure compliance with local laws (Canada/PIPEDA)
   - Update policies if you add analytics or marketing tools

3. **Documentation:**
   - Update README.md with cookie consent notes
   - Document how to manage cookie preferences
   - Include cookie policy in your terms of service

---

## Files Modified Summary

### Critical (Must Fix):
1. `shop.html` - Remove hardcoded PayPal SDK
2. `assets/js/cookie-consent.js` - Fix dynamic loading, hasConsent(), setConsent()

### Major (Should Fix):
3. `privacy-policy.html` - Fix email inconsistency
4. `cookie-policy.html` - Add PayPal cookies to table
5. `assets/js/cookie-settings.js` - New file for settings management

### Minor (Polish):
6. Create `assets/css/policy-pages.css` - Move inline styles
7. Update all HTML pages to include cookie-settings.js

---

## Estimated Time to Fix

- **Priority 1 (Critical):** 2-3 hours
- **Priority 2 (Major):** 1-2 hours  
- **Priority 3 (Polish):** 1 hour
- **Testing:** 2 hours

**Total:** ~6-8 hours for complete implementation
