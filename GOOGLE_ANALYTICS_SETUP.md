# Google Analytics Setup Guide

## 🎯 **What You'll Get in Google Analytics:**

✅ **Article Performance Tracking**
- Which articles are most popular
- Read time for each article
- Completion rates
- Author performance

✅ **Category Analytics**
- Most viewed categories
- Category engagement rates
- User behavior by section

✅ **User Behavior**
- Session duration
- Page views per session
- User engagement metrics
- Platform usage (web vs mobile)

✅ **Real-time Data**
- Live article views
- Current active users
- Real-time engagement

## 🚀 **Setup Steps:**

### 1. **Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "East Idaho News App"
4. Enable Google Analytics when prompted

### 2. **Get Your Firebase Config**
1. In Firebase Console, click the gear icon → Project settings
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Copy the config object

### 3. **Update Firebase Config**
Replace the placeholder config in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "G-XXXXXXXXXX" // This is your Google Analytics ID
};
```

### 4. **View Analytics**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your Firebase project
3. Navigate to "Events" to see custom events
4. Check "Real-time" for live data

## 📊 **Events You'll See in Google Analytics:**

### **Article Events:**
- `article_view` - When someone views an article
- `article_read_time` - Read time and completion data
- `news_article_engagement` - Overall engagement metrics

### **Category Events:**
- `category_view` - When someone switches categories
- `session_start` - When app is opened

### **Custom Parameters:**
- `article_id` - Specific article identifier
- `article_title` - Article title
- `category` - News category
- `author` - Article author
- `read_time_seconds` - Time spent reading
- `completion_rate` - How much of article was read
- `platform` - Web or mobile

## 🔍 **Analytics Dashboard Examples:**

### **Popular Articles Report:**
- Go to Events → article_view
- See which articles get the most views
- Track engagement by author

### **Category Performance:**
- Go to Events → category_view
- See which categories are most popular
- Track user navigation patterns

### **User Engagement:**
- Go to Events → article_read_time
- See average read times
- Track completion rates

## 🎉 **Benefits:**

1. **Individual Article Tracking** - See exactly which articles perform best
2. **Author Performance** - Track which authors drive engagement
3. **Category Insights** - Understand what content resonates
4. **User Behavior** - See how users interact with your app
5. **Real-time Monitoring** - Watch engagement as it happens

## 🚨 **Important Notes:**

- Analytics work in development mode
- Data appears in Google Analytics within 24-48 hours
- Real-time data appears immediately
- No user personal data is collected (privacy compliant)

**Once you update the Firebase config, all your article views, read times, and category switches will be tracked in Google Analytics!**
