# 🧪 Cookie Consent Testing Guide

## Quick Test (5 minutes)

### Test 1: Accept All Flow ✅
1. Open `shop.html` in a fresh browser (or incognito/private mode)
2. Wait 1-2 seconds
3. **Expected**: Cookie banner appears at bottom
4. Click "Accept All"
5. **Expected**: Banner disappears
6. Refresh page
7. **Expected**: Banner does NOT reappear
8. Open browser DevTools (F12) → Application/Storage → Cookies
9. **Expected**: See cookie `falcon_drums_cookie_consent=accepted`
10. Click "Buy Now" button
11. **Expected**: Checkout modal opens normally

**Result**: ✅ Pass / ❌ Fail

---

### Test 2: Essential Only Flow ✅
1. Clear all cookies (DevTools → Application → Clear Storage)
2. Refresh `shop.html`
3. Wait for banner to appear
4. Click "Essential Only"
5. **Expected**: Banner disappears
6. Check cookies in DevTools
7. **Expected**: `falcon_drums_cookie_consent=essential`
8. Click "Buy Now"
9. **Expected**: Checkout modal opens (payment processing works)

**Result**: ✅ Pass / ❌ Fail

---

### Test 3: Decline Flow ✅
1. Clear all cookies
2. Refresh `shop.html`
3. Wait for banner
4. Click "Decline"
5. **Expected**: 
   - Banner disappears
   - Red warning message appears
   - "Buy Now" button looks disabled (50% opacity)
6. Hover over "Buy Now" button
7. **Expected**: Shows tooltip "Checkout requires essential cookies..."
8. Click "Buy Now"
9. **Expected**: Confirmation dialog asks to change preferences
10. Click "OK" in dialog
11. **Expected**: Cookie banner reappears

**Result**: ✅ Pass / ❌ Fail

---

### Test 4: PayPal Loading (Accept) ✅
1. Clear cookies
2. Open DevTools → Network tab
3. Refresh `shop.html`
4. Click "Accept All" when banner appears
5. Look in Network tab
6. **Expected**: See request to `paypal.com/sdk/js`
7. **Expected**: PayPal SDK loaded successfully (status 200)
8. In Console, type: `window.paypal`
9. **Expected**: Should see PayPal object, not `undefined`

**Result**: ✅ Pass / ❌ Fail

---

### Test 5: PayPal NOT Loading (Decline) ✅
1. Clear cookies
2. Open DevTools → Network tab → Clear
3. Refresh `shop.html`
4. Click "Decline"
5. Look in Network tab
6. **Expected**: NO request to paypal.com
7. In Console, type: `window.paypal`
8. **Expected**: `undefined` (PayPal not loaded)

**Result**: ✅ Pass / ❌ Fail

---

## Accessibility Tests

### Keyboard Navigation ✅
1. Clear cookies, refresh page
2. Wait for banner
3. **Do NOT use mouse**
4. Press Tab repeatedly
5. **Expected**: Focus moves through links and buttons
6. Press Tab until reaching last button ("Decline")
7. Press Tab again
8. **Expected**: Focus returns to first element (focus trap)
9. Press Shift+Tab
10. **Expected**: Focus moves backwards
11. Press Enter on "Accept All"
12. **Expected**: Banner closes

**Result**: ✅ Pass / ❌ Fail

---

### Focus Indicators ✅
1. Tab through banner elements
2. **Expected**: Clear gold outline (3px) around focused button
3. **Expected**: Outline (2px) around focused links
4. **Expected**: High contrast, easily visible

**Result**: ✅ Pass / ❌ Fail

---

### Screen Reader (Optional) ✅
1. Enable screen reader:
   - **Windows**: NVDA (free) or JAWS
   - **Mac**: VoiceOver (Cmd+F5)
   - **Linux**: Orca
2. Navigate to banner with screen reader
3. **Expected**: Announces "Cookie consent dialog"
4. **Expected**: Reads banner content
5. **Expected**: Announces button labels clearly

**Result**: ✅ Pass / ❌ Fail

---

## Mobile Tests

### Responsive Design ✅
1. Open DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Select different devices:
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)
3. Check banner at each size
4. **Expected**: Banner looks good, buttons accessible
5. **Expected**: No horizontal scrolling
6. **Expected**: Text readable without zooming

**Result**: ✅ Pass / ❌ Fail

---

### Touch Interaction ✅
1. Use device toolbar's touch mode OR real mobile device
2. Tap buttons in banner
3. **Expected**: Buttons respond immediately
4. **Expected**: No delay or double-tap needed
5. **Expected**: Button active states visible

**Result**: ✅ Pass / ❌ Fail

---

## Browser Compatibility Tests

Test in multiple browsers:

### Chrome/Edge ✅
- [ ] Banner appears correctly
- [ ] Cookies saved properly
- [ ] PayPal loads conditionally
- [ ] Checkout disable/enable works

### Firefox ✅
- [ ] Banner appears correctly
- [ ] Cookies saved properly
- [ ] PayPal loads conditionally
- [ ] Checkout disable/enable works

### Safari ✅
- [ ] Banner appears correctly
- [ ] Cookies saved properly (Safari ITP considerations)
- [ ] PayPal loads conditionally
- [ ] Checkout disable/enable works

### Mobile Safari (iOS) ✅
- [ ] Banner appears correctly
- [ ] Touch interactions work
- [ ] Cookies saved properly
- [ ] Responsive design good

---

## Advanced Tests

### Secure Flag (HTTPS only) 🔒
1. Deploy to HTTPS server (not localhost)
2. Accept cookies
3. Check cookie in DevTools
4. **Expected**: Cookie has `Secure` flag checked

**Result**: ✅ Pass / ❌ Fail (N/A for localhost)

---

### SameSite Attribute ✅
1. Check cookie in DevTools → Application → Cookies
2. Look at `falcon_drums_cookie_consent` cookie
3. **Expected**: `SameSite: Strict`

**Result**: ✅ Pass / ❌ Fail

---

### Cookie Expiry ✅
1. Accept cookies
2. Check cookie in DevTools
3. Look at "Expires / Max-Age" column
4. **Expected**: ~365 days from now

**Result**: ✅ Pass / ❌ Fail

---

### Change Preferences ✅
1. Accept cookies (any option)
2. In browser Console, type:
   ```javascript
   window.FalconDrumsCookieConsent.revokeConsent()
   ```
3. **Expected**: Cookie deleted, banner reappears

**Result**: ✅ Pass / ❌ Fail

---

### Check Consent Status (API) ✅
1. Accept cookies
2. In Console, type:
   ```javascript
   window.FalconDrumsCookieConsent.hasConsent()
   ```
3. **Expected**: Returns `true`
4. Type:
   ```javascript
   window.FalconDrumsCookieConsent.getConsentValue()
   ```
5. **Expected**: Returns `"accepted"` or `"essential"`

**Result**: ✅ Pass / ❌ Fail

---

## Edge Cases

### Page Reload During Consent ✅
1. Show banner
2. Click "Accept All" and immediately refresh (F5)
3. **Expected**: Cookie might not save (race condition)
4. **Expected**: Banner appears again on reload
5. Click "Accept All" again
6. Wait 2 seconds
7. Refresh
8. **Expected**: Banner stays hidden (cookie saved)

**Result**: ✅ Pass / ❌ Fail

---

### Multiple Tabs ✅
1. Open shop.html in Tab 1
2. Accept cookies
3. Open shop.html in Tab 2
4. **Expected**: No banner in Tab 2 (cookie shared)

**Result**: ✅ Pass / ❌ Fail

---

### Cookie Blocked (Privacy Mode) 🚨
1. Enable strict privacy mode in browser:
   - Firefox: Strict tracking protection
   - Safari: Prevent cross-site tracking
2. Try to accept cookies
3. **Expected**: May not work in extreme privacy modes
4. **Note**: This is expected behavior (user choice)

**Result**: ⚠️ Expected limitation

---

## Performance Tests

### Banner Load Time ✅
1. Clear cookies
2. Open DevTools → Network tab → Disable cache
3. Refresh page
4. Time from page load to banner appearance
5. **Expected**: ~1 second (intentional delay)
6. Check Network tab for cookie-consent.js
7. **Expected**: Small file size (<10KB)

**Result**: ✅ Pass / ❌ Fail

---

### PayPal Load Time ✅
1. Clear cookies
2. Open Network tab
3. Accept cookies
4. Watch PayPal SDK load
5. **Expected**: Loads within 1-2 seconds
6. **Expected**: No blocking of page render

**Result**: ✅ Pass / ❌ Fail

---

## Security Tests

### XSS Protection ✅
1. Try to inject script via URL parameters:
   ```
   shop.html?test=<script>alert('xss')</script>
   ```
2. **Expected**: No script execution
3. **Expected**: Banner still works normally

**Result**: ✅ Pass / ❌ Fail

---

### Cookie Tampering ✅
1. Accept cookies
2. Open DevTools → Application → Cookies
3. Manually change cookie value to random text: `test123`
4. Refresh page
5. **Expected**: Banner appears (invalid consent)

**Result**: ✅ Pass / ❌ Fail

---

## Compliance Verification

### GDPR Checklist ✅
- [ ] Consent required BEFORE cookies set (except consent cookie)
- [ ] Clear information about what cookies do
- [ ] Easy to withdraw consent
- [ ] Granular options (Accept/Essential/Decline)
- [ ] Links to full Cookie Policy
- [ ] Records consent (cookie stored)

### PIPEDA Checklist ✅
- [ ] Clear disclosure of purpose
- [ ] Meaningful consent (not just "OK")
- [ ] Accessible privacy information
- [ ] User can withdraw consent
- [ ] Contact information provided

---

## Common Issues & Solutions

### Issue: Banner doesn't appear
**Check**:
1. JavaScript enabled?
2. Console errors?
3. Cookie already exists? (check DevTools)
4. Waited 1 second?

---

### Issue: PayPal not loading
**Check**:
1. Consent given? (check cookie value)
2. Network tab shows request?
3. Console errors?
4. Client ID configured?

---

### Issue: Buttons don't disable
**Check**:
1. Declined cookies?
2. Check button opacity in DevTools
3. Console errors?
4. .btn-quote elements exist?

---

## Test Report Template

```
COOKIE CONSENT TEST REPORT
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

FUNCTIONALITY TESTS
[ ] Accept All Flow - Pass/Fail
[ ] Essential Only Flow - Pass/Fail
[ ] Decline Flow - Pass/Fail
[ ] PayPal Loading (Accept) - Pass/Fail
[ ] PayPal NOT Loading (Decline) - Pass/Fail

ACCESSIBILITY TESTS
[ ] Keyboard Navigation - Pass/Fail
[ ] Focus Indicators - Pass/Fail
[ ] Screen Reader - Pass/Fail/N/A

MOBILE TESTS
[ ] Responsive Design - Pass/Fail
[ ] Touch Interaction - Pass/Fail

COMPLIANCE
[ ] GDPR Requirements - Pass/Fail
[ ] PIPEDA Requirements - Pass/Fail

ISSUES FOUND:
1. ___________
2. ___________

OVERALL STATUS: ✅ PASS / ❌ FAIL
```

---

## Automated Testing (Optional)

For continuous testing, consider:

### Playwright/Cypress Script Ideas
```javascript
// Example test (pseudo-code)
test('Cookie banner appears and accepts consent', async () => {
  await page.goto('/shop.html');
  await page.waitFor(1000);
  expect(await page.$('#cookie-consent-banner')).toBeTruthy();
  await page.click('#cookie-accept');
  expect(await page.$('#cookie-consent-banner')).toBeFalsy();
  const cookies = await page.cookies();
  expect(cookies.find(c => c.name === 'falcon_drums_cookie_consent')).toBeTruthy();
});
```

---

## Final Checklist Before Production

- [ ] All Quick Tests passed
- [ ] Tested in 3+ browsers
- [ ] Tested on mobile device
- [ ] Keyboard navigation works
- [ ] PayPal Client ID configured
- [ ] Privacy/Cookie policy pages accessible
- [ ] Contact email working (info@falcondrums.com)
- [ ] Legal team reviewed (if required)
- [ ] Backup of site taken
- [ ] Monitoring in place

---

**Testing Version**: 2.0  
**Last Updated**: September 23, 2026  
**Status**: Ready for Testing  
**Estimated Testing Time**: 30-45 minutes (full suite)
