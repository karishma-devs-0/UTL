import { bootstrapAuth } from './authService';
import { resetTo, navigationRef } from '@/navigation/navigationRef';

export const waitForNavigationReady = (timeout = 2000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (navigationRef.isReady()) {
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        reject(new Error('Navigation did not become ready in time.'));
      } else {
        setTimeout(check, 50);
      }
    };

    check();
  });


export const initializeApp = async ({ setUserToken, setIsLoading }) => {
  const result = await bootstrapAuth();

  console.log("initializeApp=>", result)

  if (result.valid) {
    setUserToken(result.token);
    try {
      await waitForNavigationReady(); // waits up to 2000ms by default
      resetTo('MainApp');
    } catch (err) {
      console.warn('[Navigation] Timed out waiting for navigation to become ready.');
    }
    //resetTo('MainApp');

  } else {
    setUserToken(null);
    resetTo('Login'); // or 'MainApp'
  }

  setIsLoading(false);
};