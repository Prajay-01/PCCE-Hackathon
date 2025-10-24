# AI-Powered Content Growth & CRM Assistant

An AI-powered mobile application for content creators, providing tools for content generation, cross-platform analytics, and real-time CRM integration with HubSpot. This app helps creators automate their workflow, gain deep insights into performance, and manage customer relationships seamlessly.

## 🚀 Features

### **AI-Powered Content Creation** 🤖
- **AI Content Generator** - Generate post ideas, captions, and hashtags
- **Platform-Specific Templates** - Optimized for Instagram, LinkedIn, Twitter, TikTok, YouTube
- **Niche Selection** - Tech, Business, Lifestyle, Health, Education
- **Tone Control** - Professional, Casual, Inspirational styles
- **Hashtag Generator** - Trending and niche-specific hashtags
- **Engagement Predictor** - AI-powered engagement score predictions

### **Analytics & Insights** 📊
- **Real-time Dashboard** - Live metrics, charts, and growth analytics
- **Cross-Platform Comparison** - Compare performance across all platforms
- **AI-Powered Insights** - Smart recommendations and trend analysis
- **Performance Reports** - Comprehensive analytics and sentiment analysis
- **Best Time Analysis** - Optimal posting times based on engagement data

### **HubSpot CRM Integration** 🔗
- **Bulk Contact Sync** - One-time sync of all HubSpot contacts to Firestore
- **Real-time Webhooks** - Automatic updates when contacts/deals change
- **Deal Tracking** - Monitor sales pipeline and customer lifecycle
- **Contact Management** - Unified view of customer interactions
- **Firebase Cloud Functions** - Serverless backend for data synchronization

### **Authentication & User Management** 🔐
- Firebase Auth with email/password and Google sign-in
- User profile management with connected social accounts
- Secure session handling and logout functionality

### **Multi-Platform Integration** 📱
- Connect Instagram, YouTube, Twitter, LinkedIn, TikTok
- Real-time data from connected social media accounts
- Platform-specific analytics and insights

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS development)
- An Android emulator or physical device
- Firebase account (for backend services)

## 🛠️ Installation

1. **Clone the repository** (or navigate to the project directory)
   ```bash
   cd ContentGrowthAssistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Firebase Storage
   - Copy your Firebase configuration
   - Update `src/config/firebase.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Configure AI Services** (Optional)
   - Get API keys from OpenAI or HuggingFace
   - Update `src/services/aiService.js` with your API credentials

## 🏃‍♂️ Running the App

### Option 1: Start Expo Development Server
```bash
npm start
```
Then scan the QR code with Expo Go app on your phone.

### Option 2: Run on Android
```bash
npm run android
```
**Note:** Make sure you have an Android emulator running or a physical device connected with USB debugging enabled.

### Option 3: Run on iOS (Mac only)
```bash
npm run ios
```

### Option 4: Run on Web
```bash
npm run web
```

## 📱 Running on Physical Device

### Android:
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect your device via USB
4. Run `npm run android`

### iOS:
1. Install Expo Go from App Store
2. Make sure your device and computer are on the same network
3. Run `npm start`
4. Scan the QR code with your camera

## 🔧 Troubleshooting

### No Android device found
- Start Android Studio
- Open AVD Manager (Android Virtual Device Manager)
- Create and launch an emulator
- Or connect a physical device with USB debugging enabled

### Package version conflicts
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Metro bundler issues
- Run `npx expo start --clear` to clear the cache

## 📁 Project Structure

```
ContentGrowthAssistant/
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # HubSpot bulk sync & webhook listener
│   ├── package.json
│   ├── WEBHOOK_SETUP_GUIDE.md
│   └── HUBSPOT_SYNC_GUIDE.md
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ContentCreatorScreen.js  (AI Content Generation)
│   │   ├── InsightsScreen.js
│   │   ├── AnalyticsComparisonScreen.js (Platform Comparison)
│   │   └── ProfileScreen.js
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API and service integrations
│   │   ├── authService.js
│   │   ├── contentGeneratorService.js (AI Service)
│   │   └── socialMediaService.js
│   ├── config/          # Configuration files
│   ├── assets/          # Images, fonts, etc.
│   ├── context/         # React Context for state management
│   └── utils/           # Utility functions
├── App.js               # Entry point
└── package.json         # Dependencies
```

## 🔐 Firebase & HubSpot Setup Checklist

- [ ] Create Firebase project
- [ ] Enable Email/Password & Google authentication
- [ ] Create Firestore database with collections:
  - `users` - User profiles and connected accounts
  - `analytics` - Aggregated user analytics data
  - `hubspot_contacts` - Synced contacts from HubSpot
  - `hubspot_deals` - Synced deals from HubSpot
- [ ] Enable Firebase Storage (for future media uploads)
- [ ] Deploy Cloud Functions (`functions/`)
- [ ] Configure HubSpot Private App with required scopes
- [ ] Set up HubSpot Webhooks for real-time updates
- [ ] Configure environment variables for Cloud Functions
- [ ] Update `src/config/firebase.js` with your client-side credentials

## 🎨 Tech Stack

- **Frontend:** React Native (Expo)
- **Navigation:** React Navigation
- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions)
- **API Communication:** Axios
- **AI Services:** OpenAI / HuggingFace APIs
- **CRM:** HubSpot API V3

## ✅ What's Implemented

### **AI & Analytics Features (NEW!)**
- ✅ **AI Content Creator** - Fully functional screen for generating posts, captions, and hashtags
- ✅ **Analytics Comparison Tool** - Compare performance metrics across different platforms
- ✅ **Real-time Data** - Dashboard, Insights, and Profile screens now show live data from Firebase
- ✅ **HubSpot Integration** - Cloud Functions for bulk sync and real-time webhooks
- ✅ **Updated Navigation** - 5 tabs: Dashboard, AI Creator, Insights, Compare, Profile

### **Core Features**
- ✅ **Beautiful Login & Sign Up Screens** - Gradient UI with full validation
- ✅ **Firebase Auth Service** - Ready for email/password & Google sign-in
- ✅ **Authentication Context** - State management for user sessions
- ✅ **Enhanced Dashboard** - 4 metric cards, AI insights, charts, top posts
- ✅ **Content Management** - Search, filters, grid/list views, FAB
- ✅ **AI Insights Screen** - Trends, recommendations, sentiment analysis
- ✅ **Advanced Scheduler** - Calendar, optimal times, post management
- ✅ **Complete Profile** - Stats, connected platforms, settings, logout
- ✅ Tab-based navigation (5 screens)
- ✅ Stack navigation for auth
- ✅ Form validation & error handling
- ✅ Loading states & pull-to-refresh
- ✅ Charts & visualizations
- ✅ Material Design UI
- ✅ Gradient backgrounds
- ✅ Icon-based navigation

## 🚧 Next Steps / TODO

- [ ] Deploy Cloud Functions to Firebase (`firebase deploy --only functions`)
- [ ] Configure HubSpot webhook subscriptions (see `functions/WEBHOOK_SETUP_GUIDE.md`)
- [ ] Set up environment variables for HubSpot API key and webhook secret
- [ ] Integrate social media APIs (Instagram, YouTube, etc.) for real data
- [ ] Implement image/video upload to Firebase Storage
- [ ] Set up Cloud Messaging for notifications
- [ ] Build PDF export functionality for reports

## 📝 API Integration

### Social Media APIs Required:
- Instagram Graph API
- YouTube Data API v3
- Twitter API v2
- LinkedIn API

### AI Services:
- OpenAI GPT API (for content generation and insights)
- HuggingFace (alternative for NLP tasks)

## 🤝 Contributing

This is a hackathon project. Feel free to extend and customize it for your needs!

## 📄 License

This project is open source and available for educational purposes.

## 📞 Support

For issues or questions, please refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Happy Coding! 🚀**
#   P C C E - H a c k a t h o n  
 