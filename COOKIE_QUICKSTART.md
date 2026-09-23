# 🍪 Quick Cookie Implementation Reference

## Copy-Paste Template for Any Page

### 1. Add to `<head>` section (after other CSS):
```html
<link rel="stylesheet" href="assets/css/cookie-consent.css" />
```

### 2. Add before closing `</body>` tag (after other JS):
```html
<script src="assets/js/cookie-consent.js"></script>
```

### 3. Update footer `<ul class="copyright">`:
```html
<ul class="copyright">
    <li>&copy; Falcon Drums - All Rights Reserved</li>
    <li>A Website by: <a href="http://zentrofuse.com">ZentroFuse</a></li>
    <li><a href="privacy-policy.html">Privacy Policy</a> | <a href="cookie-policy.html">Cookie Policy</a></li>
</ul>
```

## That's It! 🎉

The banner will automatically appear and handle everything.

---

## Optional: Add "Cookie Settings" Link Anywhere

```html
<a href="#" onclick="window.FalconDrumsCookieConsent.revokeConsent(); return false;">
    Cookie Settings
</a>
```

---

## JavaScript API Reference

```javascript
// Check if user consented
window.FalconDrumsCookieConsent.hasConsent()  // returns true/false

// Get consent value
window.FalconDrumsCookieConsent.getConsentValue()  // returns 'accepted', 'essential', 'declined', or null

// Show banner again
window.FalconDrumsCookieConsent.showBanner()

// Revoke consent (clears cookie + shows banner)
window.FalconDrumsCookieConsent.revokeConsent()
```

---

## What Gets Saved

**Cookie Name**: `falcon_drums_cookie_consent`  
**Values**: `accepted`, `essential`, or `declined`  
**Expiry**: 1 year  
**Path**: `/` (entire site)

---

## Testing

1. Open page in browser
2. Wait 1 second → banner appears
3. Click a button → banner disappears
4. Refresh page → banner stays hidden
5. Clear cookies → banner appears again ✅

---

## Files Included

- ✅ `assets/js/cookie-consent.js` - Banner logic
- ✅ `assets/css/cookie-consent.css` - Banner styling  
- ✅ `cookie-policy.html` - Full cookie policy
- ✅ `privacy-policy.html` - Full privacy policy
- ✅ `shop.html` - Already integrated (example)
- ✅ `COOKIE_IMPLEMENTATION.md` - Full guide

---

## Need Help?

See `COOKIE_IMPLEMENTATION.md` for:
- Detailed integration guide
- Customization options
- Troubleshooting tips
- Testing checklist
- Compliance information
