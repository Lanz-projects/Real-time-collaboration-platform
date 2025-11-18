# Production Deployment Guide

This guide covers the licensing and service requirements for deploying this collaboration application to production for personal or commercial use.

**Important:** The free tier API keys used in development are NOT suitable for production use. You must obtain production licenses and upgrade to paid service tiers before deploying this application publicly.

---

## Table of Contents

1. [tldraw License Requirements](#tldraw-license-requirements)
2. [Agora Production Services](#agora-production-services)
3. [Liveblocks Production Services](#liveblocks-production-services)
4. [Cost Summary](#cost-summary)

---

## tldraw License Requirements

### Overview

The tldraw SDK used for the collaborative whiteboard requires a **production license** to use in any production environment. The SDK is source-available but **not open source** and enforces its license using license keys.

**Development vs Production:**

- **Development:** Works without a license key
- **Production:** Requires a valid license key (trial, commercial, or hobby)

### License Types

#### 1. Trial License (Free - 100 days)

Best for: Evaluating tldraw before committing to a license

- **Duration:** 100 days
- **Cost:** Free
- **Limitation:** One trial per commercial unit
- **Data Collection:** SDK collects usage analytics during trial
- **How to get:** Complete the [trial license form](https://tldraw.dev/community/license)

#### 2. Hobby License (Free - For Non-Commercial Projects)

Best for: Personal projects, educational use, non-profit applications

- **Cost:** Free (discretionary approval)
- **Requirement:** Project must be non-commercial
- **Watermark:** Must display "made with tldraw" watermark on canvas
- **How to get:** Complete the [hobby license form](https://tldraw.dev/community/license)
- **Approval:** Team reviews applications and may reach out for details

**Important:** If you're using this app for personal, educational, or non-commercial purposes, the hobby license is likely your best option.

#### 3. Commercial License (Paid)

Best for: Commercial products, business applications, revenue-generating projects

- **Cost:** Custom pricing (contact sales)
- **Benefits:**
  - No watermark requirement
  - Commercial use rights
  - Support options available
- **Startup Pricing:** May be available for small teams
- **How to get:** Complete the [commercial license form](https://tldraw.dev/community/license)

### How to Apply for a Hobby License

Follow these steps to get a hobby license for non-commercial use:

1. **Visit the tldraw License Page**

   - Go to: [https://tldraw.dev/community/license](https://tldraw.dev/community/license)

2. **Select "Hobby License"**

   - Click on the hobby license option
   - You'll be directed to a request form

3. **Complete the Application Form**

   - Provide information about your project:
     - Project name and description
     - Use case (personal, educational, etc.)
     - Expected usage/users
     - Confirmation it's non-commercial

4. **Wait for Approval**

   - The tldraw team will review your application
   - They may reach out for additional information
   - Upon approval, you'll receive a license key via email

5. **Receive Your License Key**
   - You'll get a public license key in the format: `tldraw-***********************`
   - This key is safe to commit to your repository (it's public)

### Integrating Your tldraw License Key

Once you receive your license key, you need to add it to your application:

#### Step 1: Add License Key to Environment Variables

Add your license key to your `.env` file:

```env
VITE_LIVEBLOCKS_PUBLIC_KEY="pk_..."
VITE_AGORA_APP_ID="..."
VITE_TLDRAW_LICENSE_KEY="tldraw-***********************"
```

#### Step 2: Update the Tldraw Component

Modify the file `src/components/collaborative-whiteboard.tsx`:

**Find this code (around line 50-60):**

```tsx
<Tldraw
  store={store}
  components={components}
  onMount={handleMount}
>
```

**Update it to include the license key:**

```tsx
<Tldraw
  store={store}
  components={components}
  onMount={handleMount}
  licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
>
```

#### Step 3: Update TypeScript Environment Types (Optional)

To get TypeScript autocomplete for the license key environment variable, update `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVEBLOCKS_PUBLIC_KEY: string;
  readonly VITE_AGORA_APP_ID: string;
  readonly VITE_TLDRAW_LICENSE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### Step 4: Verify the Integration

1. Add the license key to your `.env` file
2. Restart your development server: `npm run dev`
3. The tldraw canvas should work without any license warnings
4. For hobby licenses, you should see the "made with tldraw" watermark

### License Validation

- **Client-side validation:** License keys are validated in the browser
- **Offline use:** Works without internet connection
- **Public keys:** Safe to include in your repository
- **Production enforcement:** The SDK will not work in production without a valid key

### Important Notes

- **Watermark Requirement:** Hobby licenses MUST display the "made with tldraw" watermark
- **Non-Commercial Only:** Hobby licenses cannot be used for revenue-generating projects
- **One License Per Project:** Each deployment needs its own license
- **No Trademark Use:** Cannot use "tldraw" branding beyond the watermark
- **Source Available ≠ Open Source:** You can view the code but must follow license terms

---

## Agora Production Services

### Current Setup (Development)

The development configuration uses Agora's free tier with:

- App ID authentication (no token)
- Basic features enabled
- Free tier limitations

### Production Requirements

For production deployment, you need to upgrade your Agora services:

#### 1. Review Free Tier Limitations

Agora's free tier has limitations on:

- Number of concurrent users
- Monthly usage minutes
- Advanced features availability
- Geographic distribution

Check current limits at: [https://www.agora.io/en/pricing/](https://www.agora.io/en/pricing/)

#### 2. Upgrade to a Paid Plan

**Steps to upgrade:**

1. **Log in to Agora Console**

   - Visit: [https://console.agora.io](https://console.agora.io)

2. **Navigate to Your Project**

   - Go to Project Management
   - Select your collaboration app project

3. **Review Pricing Options**

   - Video Calling pricing
   - Signaling (RTM) pricing
   - Screen sharing capabilities
   - Choose based on expected usage

4. **Enable Token Authentication (Recommended)**

   - For production, switch from App ID to token-based authentication
   - Provides better security
   - Prevents unauthorized usage
   - Requires backend implementation

5. **Configure Production Features**

   - Set up proper datacenter regions
   - Enable required features (Signaling, Video, Screen Share)
   - Configure recording if needed
   - Set up usage monitoring and alerts

6. **Update Billing Information**
   - Add payment method
   - Set budget alerts
   - Review usage reports regularly

#### Production Considerations

- **Security:** Implement token-based authentication (requires a backend server)
- **Scalability:** Choose appropriate pricing tier for expected user count
- **Geographic Coverage:** Select datacenters close to your users
- **Monitoring:** Set up usage alerts to control costs
- **Recording:** Consider if you need cloud recording (additional cost)

**Cost Estimation:**

- Video calling is typically charged per minute per user
- Signaling (RTM) has separate pricing
- Check [Agora Pricing Calculator](https://www.agora.io/en/pricing/) for estimates

---

## Liveblocks Production Services

### Current Setup (Development)

The development configuration uses Liveblocks' free tier for:

- Real-time presence
- Collaborative whiteboard synchronization
- Cursor tracking

### Production Requirements

For production deployment with Liveblocks:

#### 1. Review Free Tier Limitations

Liveblocks free tier typically includes:

- Limited monthly active users (MAU)
- Limited concurrent connections
- Basic features only
- Community support

Check current limits at: [https://liveblocks.io/pricing](https://liveblocks.io/pricing)

#### 2. Upgrade to a Paid Plan

**Steps to upgrade:**

1. **Log in to Liveblocks Dashboard**

   - Visit: [https://liveblocks.io/dashboard](https://liveblocks.io/dashboard)

2. **Navigate to Your Project**

   - Select your collaboration app project
   - View current usage and limits

3. **Choose a Plan**

   - **Starter:** For small production apps
   - **Pro:** For growing applications
   - **Enterprise:** For large-scale deployments
   - Review MAU limits and features

4. **Update Your Subscription**

   - Select appropriate tier
   - Add billing information
   - Confirm subscription

5. **Configure Production Settings**
   - Review API keys (public key remains the same)
   - Set up webhooks if needed
   - Configure room limits and permissions
   - Enable advanced features if available

#### Production Considerations

- **User Limits:** Ensure your plan supports expected concurrent users
- **Room Limits:** Consider how many collaboration rooms you need
- **Storage:** Some plans include persistence/storage features
- **Support:** Paid plans typically include better support options
- **Monitoring:** Use dashboard to track usage and performance

**Cost Estimation:**

- Usually based on Monthly Active Users (MAU)
- May include per-connection or per-room pricing
- Check [Liveblocks Pricing](https://liveblocks.io/pricing) for current rates

---

## Cost Summary

### Minimum Production Costs

For a **non-commercial/personal project**:

| Service        | License/Tier  | Estimated Cost                        |
| -------------- | ------------- | ------------------------------------- |
| **tldraw**     | Hobby License | **Free** (with watermark)             |
| **Agora**      | Pay-as-you-go | **~$0.99-$3.99/1000 minutes** (video) |
| **Liveblocks** | Starter Tier  | **Check current pricing**             |

### For Commercial Projects:

| Service        | License/Tier       | Estimated Cost                     |
| -------------- | ------------------ | ---------------------------------- |
| **tldraw**     | Commercial License | **Contact Sales** (custom pricing) |
| **Agora**      | Production Tier    | **Based on usage**                 |
| **Liveblocks** | Pro/Enterprise     | **Based on MAU**                   |

### Cost Optimization Tips

1. **Start Small:** Begin with minimum tiers and scale as needed
2. **Monitor Usage:** Set up alerts to avoid unexpected charges
3. **Optimize Features:** Disable unused features to reduce costs
4. **Geographic Targeting:** Use regional datacenters to minimize latency costs
5. **User Limits:** Implement user limits or authentication to control access
6. **Cache Strategy:** Optimize API calls to reduce usage

---

## Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Obtained and integrated tldraw license key (hobby/commercial)
- [ ] Upgraded Agora to production tier (if needed)
- [ ] Configured Agora token authentication (recommended)
- [ ] Upgraded Liveblocks to appropriate tier
- [ ] Updated all API keys in production environment
- [ ] Set up monitoring and usage alerts for all services
- [ ] Tested the application with production credentials
- [ ] Configured proper error handling for API failures
- [ ] Reviewed and accepted all service terms of service
- [ ] Set up billing alerts to control costs
- [ ] Implemented security best practices (rate limiting, authentication)

---

## Additional Resources

### tldraw Resources

- [tldraw License Information](https://tldraw.dev/docs/license)
- [tldraw Pricing](https://tldraw.dev/pricing)
- [Request a License](https://tldraw.dev/community/license)
- [tldraw Documentation](https://tldraw.dev/docs)

### Agora Resources

- [Agora Pricing](https://www.agora.io/en/pricing/)
- [Agora Console](https://console.agora.io)
- [Token Authentication Guide](https://docs.agora.io/en/video-calling/get-started/authentication-workflow)
- [Agora Documentation](https://docs.agora.io/en/)

### Liveblocks Resources

- [Liveblocks Pricing](https://liveblocks.io/pricing)
- [Liveblocks Dashboard](https://liveblocks.io/dashboard)
- [Liveblocks Documentation](https://liveblocks.io/docs)

---

## Support and Questions

If you encounter issues with licensing or production deployment:

1. **tldraw:** Contact their team through the license request form or support channels
2. **Agora:** Use the Agora Console support or documentation
3. **Liveblocks:** Reach out via their dashboard or support email

For application-specific issues, refer to the project's main README and documentation.
