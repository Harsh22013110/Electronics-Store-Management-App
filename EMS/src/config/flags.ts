import { FIREBASE_CONFIG } from './firebaseConfig';

export const IS_FIREBASE_CONFIGURED =
  !!FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

