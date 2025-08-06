import api from './services/api';

// Helper function to convert the VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function initializePushNotifications() {
    // 1. Check if service workers and push are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
    }

    try {
        // 2. Register the service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);

        // 3. Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription === null) {
            // 4. If no subscription, ask for permission and create one
            const permission = await window.Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Permission for notifications was denied');
                return;
            }

            const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log('New push subscription created.');
        } else {
            console.log('User is already subscribed.');
        }

        // 5. Send the subscription to the backend to be saved
        await api.post('/notifications/subscribe', subscription);
        console.log('Push subscription sent to server.');

    } catch (error) {
        console.error('Failed to initialize push notifications', error);
    }
}