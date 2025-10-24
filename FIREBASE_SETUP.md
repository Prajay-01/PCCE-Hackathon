# Firebase Setup Guide

## Step 1: Enable Authentication

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **growify-ai-925ae**
3. Click on **Authentication** in the left sidebar
4. Click on **Get Started** (if not already enabled)
5. Go to **Sign-in method** tab
6. Enable **Email/Password**:
   - Click on Email/Password
   - Toggle **Enable**
   - Click **Save**

## Step 2: Create Firestore Database

1. In Firebase Console, click on **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in test mode** (for development)
   - This allows read/write access for 30 days
   - We'll secure it later for production
4. Choose a Cloud Firestore location (select closest to your users)
   - Recommended: `asia-south1` (Mumbai) for India
5. Click **Enable**

## Step 3: Test Mode Security Rules

The default test mode rules are:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 2, 15);
    }
  }
}
```

## Step 4: Verify App Configuration

Your app is already configured with:
- ✅ google-services.json added to project root
- ✅ Firebase packages installed
- ✅ Authentication service connected
- ✅ Login/SignUp screens connected
- ✅ Auto navigation on auth state change

## Step 5: Run Your App

```powershell
# Make sure you're in the project directory
cd "c:\Users\ROG\OneDrive\Desktop\pcce hackathon\ContentGrowthAssistant"

# Start the development server
npm start
```

## Step 6: Test Authentication

1. Open your app in Expo Go
2. Try creating a new account:
   - Enter your name
   - Enter a valid email
   - Enter a password (minimum 6 characters)
   - Confirm password
   - Check "I agree to terms"
   - Click Sign Up
3. Check Firebase Console → Authentication → Users
   - You should see your new user!
4. Try logging out and logging in again
5. Test invalid credentials to see error handling

## What Happens After Setup

- ✅ Users can register with email/password
- ✅ Users can login with their credentials
- ✅ User data is stored in Firestore (users collection)
- ✅ Auto-navigation: Login redirects to Dashboard
- ✅ Auto-logout: Logout redirects to Login screen
- ✅ Session persistence: Users stay logged in

## Troubleshooting

### "Firebase not initialized" error
- Make sure google-services.json is in the project root
- Restart the Expo development server

### "Auth/email-already-in-use" error
- The email is already registered
- Try logging in instead or use a different email

### "Auth/weak-password" error
- Password must be at least 6 characters

### Can't see users in Firebase Console
- Refresh the Authentication page
- Make sure you're in the correct Firebase project

## Next Steps (Optional Enhancements)

1. **Add Google Sign-In**
   - Configure Google Sign-In in Firebase Console
   - Install @react-native-google-signin/google-signin
   - Update authService.js with Google auth

2. **Secure Firestore Rules** (Before Production)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. **Add Password Reset**
   - Use Firebase's sendPasswordResetEmail()
   - Create a "Forgot Password" screen

4. **Add Profile Picture Upload**
   - Configure Firebase Storage
   - Upload images from user's device

5. **Add Email Verification**
   - Send verification email on signup
   - Check if email is verified before allowing login

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
