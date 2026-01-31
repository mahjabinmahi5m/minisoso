// Service Worker for Push Notifications
// This file handles background notifications

self.addEventListener('push', function (event) {
    console.log('Push notification received:', event);

    const data = event.data ? event.data.json() : {};

    const title = data.title || 'Minisoso';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/logo192.png',
        badge: '/logo192.png',
        image: data.image,
        data: data.url || '/',
        tag: data.tag || 'notification',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'View',
                icon: '/logo192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/logo192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app or focus existing window
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
            .then(function (clientList) {
                // If app is already open, focus it
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('notificationclose', function (event) {
    console.log('Notification closed:', event);
});
