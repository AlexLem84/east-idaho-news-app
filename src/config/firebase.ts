import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserId, setUserProperties, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // This is your Google Analytics ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics with platform-specific handling
let analytics: any = null;

const initializeAnalytics = async () => {
  try {
    // Check if analytics is supported on this platform
    const analyticsSupported = await isSupported();
    
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.log('✅ Firebase Analytics initialized successfully');
    } else {
      console.log('⚠️ Firebase Analytics not supported on this platform');
    }
  } catch (error) {
    console.log('⚠️ Firebase Analytics initialization failed:', error);
  }
};

// Initialize analytics
initializeAnalytics();

// Safe wrapper functions for analytics
const safeLogEvent = async (eventName: string, parameters?: any) => {
  try {
    if (analytics) {
      await logEvent(analytics, eventName, parameters);
    } else {
      console.log('📊 Analytics Event (mock):', eventName, parameters);
    }
  } catch (error) {
    console.log('⚠️ Analytics event failed:', error);
  }
};

const safeSetUserId = async (userId: string) => {
  try {
    if (analytics) {
      await setUserId(analytics, userId);
    } else {
      console.log('📊 Set User ID (mock):', userId);
    }
  } catch (error) {
    console.log('⚠️ Set user ID failed:', error);
  }
};

const safeSetUserProperties = async (properties: any) => {
  try {
    if (analytics) {
      await setUserProperties(analytics, properties);
    } else {
      console.log('📊 Set User Properties (mock):', properties);
    }
  } catch (error) {
    console.log('⚠️ Set user properties failed:', error);
  }
};

export { analytics, safeLogEvent as logEvent, safeSetUserId as setUserId, safeSetUserProperties as setUserProperties };
export default app;
