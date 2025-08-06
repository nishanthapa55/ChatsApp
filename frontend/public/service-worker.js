self.addEventListener('push', event => {
    let data;
    try {
        // Try to parse the data as JSON, which is what our server will send
        data = event.data.json();
    } catch (e) {
        // If it fails, it's probably the plain text from the DevTools test
        data = {
            title: 'Test Notification',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body,
        icon: data.icon || '/logo192.png',
        badge: '/logo192.png'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/chat')
    );
});