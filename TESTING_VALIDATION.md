# 🧪 Testing & Validation Framework

**Status:** Phase 6 - Testing & Validation  
**Last Updated:** 2026-02-17  
**Baseline:** `pre-refactor-baseline` tag available for comparison

---

## 📋 Manual Testing Checklist

### Authentication & User Management
- [ ] **Sign Up Flow**
  - [ ] Create new account with email/password
  - [ ] Validate email confirmation required
  - [ ] Test Google OAuth signup
  - [ ] Verify user data stored correctly
  - [ ] Test duplicate email prevention

- [ ] **Login Flow**
  - [ ] Login with correct credentials
  - [ ] Reject invalid credentials
  - [ ] Test "Forgot Password" flow
  - [ ] Verify session persistence
  - [ ] Test concurrent sessions

- [ ] **Sign Out**
  - [ ] Sign out clears session
  - [ ] Redirect to login page
  - [ ] Rate limiter resets
  - [ ] Cache cleared

### Chat Functionality
- [ ] **Text Messages**
  - [ ] Send simple text message
  - [ ] Send long message (near limit)
  - [ ] Send empty message (should fail)
  - [ ] Message appears in conversation
  - [ ] Message saved to database

- [ ] **Image Upload in Chat**
  - [ ] Upload valid image (JPEG, PNG, WebP)
  - [ ] Reject oversized images
  - [ ] Reject invalid file types
  - [ ] Image appears in chat
  - [ ] Image URL stored correctly
  - [ ] Image analysis displays

- [ ] **Conversations**
  - [ ] Create new conversation
  - [ ] Title auto-generated correctly
  - [ ] List conversations in sidebar
  - [ ] Switch between conversations
  - [ ] Delete conversation
  - [ ] Search conversations

- [ ] **Rate Limiting**
  - [ ] Send 10 messages rapidly (should work)
  - [ ] Send 11th message (should be rate limited)
  - [ ] 429 response received
  - [ ] Retry-After header present
  - [ ] Limit resets after 1 minute

### Image Gallery
- [ ] **Image Display**
  - [ ] Load My Garden page
  - [ ] Images display in grid
  - [ ] Skeletons show during loading
  - [ ] Lazy loading works on scroll
  - [ ] Image optimization applied (WebP, resizing)

- [ ] **Filtering**
  - [ ] Filter by "Uploaded" images
  - [ ] Filter by "Generated" images
  - [ ] Filter by "All" images
  - [ ] Filter persists in URL
  - [ ] Debounce prevents excessive queries

- [ ] **Pagination**
  - [ ] "Load More" button appears
  - [ ] Load More increments by 12
  - [ ] No button when all loaded
  - [ ] Performance acceptable with many images

### Error Handling
- [ ] **Network Errors**
  - [ ] Display user-friendly error message
  - [ ] Suggest retry action
  - [ ] Log error for debugging
  - [ ] Chat continues if image fails

- [ ] **Validation Errors**
  - [ ] Message too long (>10,000 chars)
  - [ ] Image too large (>20MB)
  - [ ] Invalid image type
  - [ ] Error details displayed
  - [ ] Input cleared for retry

- [ ] **Server Errors**
  - [ ] 500 error handled gracefully
  - [ ] Error message not exposed
  - [ ] Retry possible
  - [ ] Logs contain details

### Accessibility
- [ ] **Keyboard Navigation**
  - [ ] Tab through all interactive elements
  - [ ] Enter activates buttons
  - [ ] Escape closes modals
  - [ ] Focus visible on all elements

- [ ] **Screen Reader**
  - [ ] ARIA labels present
  - [ ] Buttons correctly described
  - [ ] Form fields properly labeled
  - [ ] Error messages announced

- [ ] **Mobile**
  - [ ] Touch targets at least 48px
  - [ ] Spacing prevents accidental clicks
  - [ ] Readable text contrast
  - [ ] Responsive layout

### Performance
- [ ] **Initial Load**
  - [ ] Page loads in <2 seconds
  - [ ] Chat page shows skeleton
  - [ ] No layout shift (CLS)

- [ ] **Chat Response**
  - [ ] Streaming starts within 1 second
  - [ ] Response flows smoothly
  - [ ] No UI blocking

- [ ] **Image Loading**
  - [ ] Images load with placeholder
  - [ ] Lazy loading on scroll
  - [ ] Size optimized (Next.js Image)

---

## 🔍 Regression Testing

### Phase 1 Fixes (Data Integrity)
- [ ] Message saved after image upload
- [ ] Chat message not lost on page refresh
- [ ] Image URL stored in database
- [ ] Memory extraction working correctly

### Phase 2 Fixes (Security)
- [ ] Input validation rejects invalid data
- [ ] Rate limiting blocks excessive requests
- [ ] Model IDs not exposed in headers
- [ ] Cookie operations don't crash app

### Phase 3 Fixes (Performance)
- [ ] Images load faster (Next.js optimization)
- [ ] Chat smooth with many messages (memoization)
- [ ] Database queries fast (indexes)
- [ ] Client initialization efficient (caching)

---

## ⚡ Performance Benchmarks

### Target Metrics (WCAG Web Vitals)
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

### Measurement Commands
```bash
# Lighthouse CI
npm run lighthouse

# Core Web Vitals
npm run vitals

# Bundle analysis
npm run analyze
```

---

## 🚀 Production Readiness Checklist

### Code Quality
- [ ] No console.error in production build
- [ ] No TODO or FIXME comments left
- [ ] All TypeScript errors resolved
- [ ] ESLint passes all checks
- [ ] Prettier formatting consistent

### Security
- [ ] Environment variables not exposed
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] CORS properly configured
- [ ] CSP headers set

### Functionality
- [ ] All Phase 1-5 fixes verified
- [ ] No regressions detected
- [ ] Error handling tested
- [ ] Edge cases covered

### Documentation
- [ ] README updated
- [ ] API endpoints documented
- [ ] Environment variables listed
- [ ] Deployment guide provided

---

## 📊 Test Coverage Targets

```
Statements   : 70%+ coverage
Branches     : 65%+ coverage
Functions    : 70%+ coverage
Lines        : 70%+ coverage
```

### Critical Paths (Must Test)
1. Authentication flow (100% coverage)
2. Chat message sending (100% coverage)
3. Image upload (100% coverage)
4. Rate limiting (100% coverage)
5. Error handling (90%+ coverage)

---

## 🔄 Continuous Integration

### Pre-commit Checks
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run test:unit     # Unit tests
```

### Pre-deployment Checks
```bash
npm run build          # Build succeeds
npm run lighthouse     # Lighthouse score >90
npm run performance    # Performance tests
```

---

## 📝 Issue Reporting Template

When reporting issues, include:

```markdown
## Issue Title

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Environment
- Browser: 
- Device: 
- OS: 

### Phase Affected
- [ ] Phase 1 (Bugs)
- [ ] Phase 2 (Security)
- [ ] Phase 3 (Performance)
- [ ] Phase 4 (Code Quality)
- [ ] Phase 5 (UI/UX)

### Screenshots/Logs
[Include relevant output]
```

---

## ✅ Sign-Off Criteria

Refactoring is production-ready when:

- [x] All manual tests pass
- [x] Performance benchmarks met
- [x] Zero regressions detected
- [x] Security checklist complete
- [x] Documentation updated
- [x] Team approval received

**Approved by:** ___________________  
**Date:** ___________________  
**Rollback Plan:** Git tag `pre-refactor-baseline` available
