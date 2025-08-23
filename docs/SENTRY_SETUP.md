# Sentry Setup Guide

This guide explains how to complete the Sentry integration for the Lets Delivery mobile app.

## 🚀 Quick Setup

### 1. Create a Sentry Account & Project
1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project and select **React Native**
3. Note down your **DSN** (Data Source Name)

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual values:
   ```bash
   # Replace with your actual Sentry DSN
   EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/your-project-id
   
   # Update with your actual domain
   EXPO_PUBLIC_WEBVIEW_URL=https://your-actual-domain.com
   EXPO_PUBLIC_DOMAIN_NAME=your-actual-domain.com
   ```

### 3. Update Sentry Organization & Project in app.json
Update the Sentry configuration in `app.json`:

```json
[
  "@sentry/react-native/expo", 
  {
    "organization": "your-sentry-organization",
    "project": "your-sentry-project",
    "url": "https://sentry.io/"
  }
]
```

### 4. Test the Integration

#### In Development:
1. Run your app: `expo start`
2. Open the sidebar menu
3. You should see "Test Sentry Error" and "Test Native Crash" buttons (development only)
4. Tap "Test Sentry Error" to trigger a test error
5. Check your Sentry dashboard for the error

#### In Production:
The test buttons are automatically hidden in production builds.

## 📊 What's Being Tracked

### Automatic Tracking:
- **Crashes & Errors**: All unhandled exceptions
- **Performance**: App startup time, WebView loading
- **Navigation**: WebView URL changes
- **User Interactions**: Button taps, menu usage
- **Connectivity**: Online/offline status changes
- **Device Info**: Model, OS version, network type

### Manual Events:
- Cache operations (save/load/hit/miss)
- Theme changes
- Sidebar usage
- Support interactions
- WebView performance metrics

### Context Data:
- Device specifications
- Network information  
- App version and build
- Current theme
- WebView URL and state
- User session data

## 🔧 Advanced Configuration

### Source Maps (Automatic)
Source maps are automatically uploaded via the Expo plugin for symbolicated stack traces.

### Release Tracking
Releases are automatically tagged with:
- App version from `app.json`
- Build number from native builds
- Environment (development/production)

### Performance Monitoring
- **Tracing**: 100% in development, 10% in production
- **Profiling**: Enabled for performance analysis
- **Session Replays**: 10% of sessions, 100% when errors occur

### User Context
```typescript
import { setUserFromWebView } from '../utils/sentry-helpers';

// When user data becomes available from WebView
setUserFromWebView({
  id: 'user-123',
  email: 'user@example.com', 
  role: 'customer',
});
```

## 🛠 Custom Tracking

### Track Custom Events:
```typescript
import { addSentryBreadcrumb, captureMessage } from '../config/sentry.config';

// Add breadcrumb
addSentryBreadcrumb('User completed order', 'business-logic', 'info');

// Capture custom message
captureMessage('Custom event occurred', 'info', { 
  customData: 'value' 
});
```

### Track Performance:
```typescript
import { startTransaction } from '../config/sentry.config';

const transaction = startTransaction('Custom Operation', 'task');
// ... perform operation
transaction.finish();
```

## 🎯 Best Practices

### 1. Sensitive Data
- PII (Personal Identifiable Information) is disabled by default
- Be careful when adding custom context data
- Never log passwords or sensitive tokens

### 2. Performance Impact
- Sample rates are optimized for production (10% tracing)
- Error reporting is always 100%
- Session replays are limited to reduce bandwidth

### 3. Error Filtering
- Common React Navigation errors are filtered out
- Console logs are filtered from breadcrumbs
- Network errors are properly categorized

### 4. Production Deployment
1. Ensure your `.env` file is not committed to git
2. Use environment-specific DSNs for staging/production
3. Test error reporting before going live
4. Monitor your Sentry quota usage

## 📈 Monitoring Dashboard

Access your Sentry dashboard to view:
- **Issues**: Errors and crashes with stack traces
- **Performance**: Transaction traces and slow queries
- **Releases**: Deploy tracking and release health
- **User Feedback**: Error reports from users
- **Alerts**: Configure notifications for critical issues

## 🔍 Troubleshooting

### Common Issues:

**1. "Sentry not initialized" error:**
- Check your DSN in `.env` file
- Ensure the DSN starts with `https://`
- Verify the project ID is correct

**2. No events showing in Sentry:**
- Check internet connectivity
- Verify the DSN is correct
- Look for console errors during initialization

**3. Source maps not working:**
- Ensure the Expo plugin is properly configured
- Check that the organization and project names match your Sentry settings

**4. Performance data missing:**
- Verify tracing is enabled
- Check sample rates in configuration
- Ensure transactions are being created

## 📱 Testing Checklist

- [ ] Test error reporting (use development test buttons)
- [ ] Verify performance tracking  
- [ ] Check user interaction tracking
- [ ] Validate connectivity status tracking
- [ ] Test WebView error handling
- [ ] Confirm theme change tracking
- [ ] Validate cache operation tracking

## 🚀 Ready for Production

Once configured, your app will automatically:
- Report all crashes and errors to Sentry
- Track performance metrics and slow operations
- Monitor user interactions and app health
- Provide detailed context for debugging
- Send alerts for critical issues

Your Lets Delivery mobile app now has enterprise-level error tracking and performance monitoring! 🎉