# API Keys and Environment Setup Guide

This guide covers setting up API keys for **development and testing**. To run this application, you need to provide API keys for the real-time services it relies on: **Liveblocks** and **Agora**.

**⚠️ Important:** The free tier keys described in this guide are suitable for development and testing only. For production deployment, you must upgrade to paid service tiers. See the **[Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** for complete details.

## 1. Create a `.env` File

In the root directory of the project, create a new file named `.env`. This file will store your secret keys and is ignored by Git to prevent them from being committed.

Your `.env` file should look like this:

```
VITE_LIVEBLOCKS_PUBLIC_KEY="pk_..."
VITE_AGORA_APP_ID="..."
```

## 2. Get Liveblocks API Keys

Liveblocks powers the real-time collaboration features like cursor presence and data synchronization for the whiteboard.

**For Development:**

1.  **Sign Up:** Go to [liveblocks.io](https://liveblocks.io) and create a free account.
2.  **Find Your Public Key:**
    *   Navigate to your project dashboard.
    *   In the "API Keys" section, you will find your **Public key**.
    *   Copy this key.
3.  **Update `.env`:** Paste the key into your `.env` file as the value for `VITE_LIVEBLOCKS_PUBLIC_KEY`.

**Free Tier Limitations:**
- Limited monthly active users
- Limited concurrent connections
- Suitable for development and testing only

**For Production:** You will need to upgrade to a paid tier. See the [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md#liveblocks-production-services) for details.

## 3. Get Agora App ID

Agora provides the real-time video and audio streaming capabilities.

**For Development:**

1.  **Sign Up:** Go to [agora.io](https://www.agora.io/en/) and create a developer account.
2.  **Create a Project:**
    *   Navigate to the "Project Management" section in your Agora console.
    *   Click "Create" to start a new project.
    *   Give your project a name (e.g., "Collaboration App").
    *   For the "Use case" dropdown, select "Video Calling".
    *   For authentication, choose **"App ID"** for simplicity during development.
3.  **Find Your App ID:**
    *   Once the project is created, you will see your **App ID** on the project details page.
    *   Copy this ID.
4.  **Configure the App**
    * On the "Overview" page, click the "configure" button of your project
    * Scroll down to the "ALL FEATURES" area and configure these settings:
        * Signaling: (Set up a datacenter: Ex. NA)
            * Make sure this is active
            * Enable: Stream Channel Configuration
        * For any other feature you may want, you can activate it, and implement it within the app.
5.  **Update `.env`:** Paste the App ID into your `.env` file as the value for `VITE_AGORA_APP_ID`.

**Free Tier Limitations:**
- Limited monthly usage minutes
- Limited concurrent users
- App ID authentication only (not secure for production)
- Suitable for development and testing only

**For Production:** You must upgrade to a paid tier and implement token-based authentication. See the [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md#agora-production-services) for details.

## 4. Restart Your Development Server

After you have updated the `.env` file with both keys, make sure to **stop and restart** your development server (`npm run dev`) for the changes to take effect.

Your application should now be configured to connect to both Liveblocks and Agora services.
