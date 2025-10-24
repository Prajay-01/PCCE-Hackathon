# Instagram Basic Display API Setup Guide

This guide provides step-by-step instructions on how to generate an Instagram App ID and configure the Instagram Basic Display API to connect it with your application.

## 📋 Table of Contents

1.  [Overview](#1-overview)
2.  [Step 1: Register as a Meta Developer](#2-step-1-register-as-a-meta-developer)
3.  [Step 2: Create a Facebook App](#3-step-2-create-a-facebook-app)
4.  [Step 3: Configure the Instagram Basic Display API](#4-step-3-configure-the-instagram-basic-display-api)
5.  [Step 4: Add an Instagram Test User](#5-step-4-add-an-instagram-test-user)
6.  [Step 5: Authenticate and Get an Access Token](#6-step-5-authenticate-and-get-an-access-token)
7.  [Next Steps](#7-next-steps)

---

### 1. Overview

The Instagram Basic Display API allows you to get basic profile information, photos, and videos from a user's Instagram account. To use it, you need to set up a Facebook App and go through an OAuth 2.0 authentication flow.

**What you will get:**
*   **Instagram App ID**: A unique identifier for your app.
*   **Instagram App Secret**: A secret key to authenticate your app's API calls.
*   **Redirect URI**: A URL to which users are redirected after they authorize your app.

---

### 2. Step 1: Register as a Meta Developer

If you haven't already, you need to register for a Meta Developer account.

1.  Go to the [Meta for Developers](https://developers.facebook.com/) website.
2.  Click on **"Get Started"** and follow the prompts to register with your Facebook account.
3.  Complete the registration process by agreeing to the terms and verifying your account.

---

### 3. Step 2: Create a Facebook App

Every application that uses a Meta API needs to be registered as a Facebook App.

1.  From the Meta for Developers dashboard, go to **"My Apps"**.
2.  Click **"Create App"**.
3.  Select **"Other"** as the app type and click **"Next"**.
4.  Choose **"Consumer"** as the app type. This is suitable for apps that connect to individual user accounts.
5.  Enter an **"App Display Name"** (e.g., "Content Growth Assistant") and provide your contact email.
6.  Click **"Create App"**. You may need to re-enter your Facebook password.

You now have a Facebook App and will be redirected to its dashboard.

---

### 4. Step 3: Configure the Instagram Basic Display API

Now, you need to add the Instagram Basic Display API product to your new app.

1.  On your app's dashboard, scroll down to find the **"Add products to your app"** section.
2.  Find **"Instagram Basic Display"** and click **"Set Up"**.
3.  On the Basic Display page, read the information and click **"Create New App"**.
    *   **Important**: Do not change the App Name. It should match your Facebook App.
4.  After creating the app, you will be taken to the Instagram Basic Display configuration page. Here you will find your **Instagram App ID** and **Instagram App Secret**.

#### Configure Client OAuth Settings

You must provide a **Redirect URI**, which is where users will be sent after they approve or deny your app's request for permissions.

1.  In the **"Client OAuth Settings"** section, enter the following URL into the **"Valid OAuth Redirect URIs"** field:
    ```
    https://auth.expo.io/@your-expo-username/your-app-slug
    ```
    *   You can find your Expo username and app slug in your `app.json` file. If you are using a custom development client, you may need a different URL. For testing, `https://localhost:19006/` can also work.
2.  Enter the same URL in the **"Deauthorize Callback URL"** and **"Data Deletion Request URL"** fields for now.
3.  Click **"Save Changes"** at the bottom of the page.

---

### 5. Step 4: Add an Instagram Test User

Before your app is approved for public use, you can only test it with Instagram accounts that you have added as "testers."

1.  On the Instagram Basic Display configuration page, scroll down to the **"User Token Generator"** section.
2.  Click **"Add or Remove Instagram Testers"**.
3.  On the Testers page, scroll down to the **"Instagram Testers"** section and click **"Add Instagram Testers"**.
4.  Enter the Instagram username of the account you want to use for testing and send the invitation.
5.  **Accept the Invitation**:
    *   Log in to the Instagram account you just invited.
    *   Navigate to **(Profile) > Edit Profile > Apps and Websites > Tester Invites**.
    *   Accept the invitation from your app.

The user is now ready to be authenticated.

---

### 6. Step 5: Authenticate and Get an Access Token

Now that you have a test user, you can generate a long-lived access token to make API calls.

1.  Go back to your app's dashboard in the Meta for Developers portal.
2.  Navigate to **"Instagram Basic Display" > "Basic Display"**.
3.  Find the **"User Token Generator"** section.
4.  Your test user should now be listed. Click **"Generate Token"** next to their username.
5.  Follow the on-screen prompts to log in with your test user's Instagram account and authorize the app.
6.  After authorization, you will be redirected and a **User Access Token** will be displayed.

**This is a long-lived token, valid for 60 days.** You should copy this token and store it securely. You will use this token in the `Authorization` header of your API requests.

---

### 7. Next Steps

You now have everything you need to start making calls to the Instagram Basic Display API.

*   **Instagram App ID**: Found on the Basic Display page.
*   **Long-Lived Access Token**: Generated in the User Token Generator section.

You can now use these credentials in your application's code (e.g., in `src/services/instagramService.js`) to fetch the user's profile and media. Remember to store your App ID and token securely and never expose them on the client-side.
