// Browser Push Notification Utility
// Handles permission requests and notification display

class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.isSupported = 'Notification' in window;
    }

    // Check if notifications are supported
    isNotificationSupported() {
        return this.isSupported;
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('Browser notifications are not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            console.warn('Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Show browser notification
    showNotification(title, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            console.warn('Cannot show notification: permission not granted');
            return null;
        }

        const defaultOptions = {
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            silent: false
        };

        const notificationOptions = { ...defaultOptions, ...options };

        try {
            const notification = new Notification(title, notificationOptions);

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Handle click
            notification.onclick = function (event) {
                event.preventDefault();
                window.focus();
                if (options.url) {
                    window.location.href = options.url;
                }
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    // Show notification for like
    showLikeNotification(username, postImage = null) {
        const options = {
            body: `@${username} liked your post`,
            icon: '/logo192.png',
            image: postImage,
            tag: 'like-notification',
            url: '/notifications'
        };

        return this.showNotification('New Like! ❤️', options);
    }

    // Show notification for comment
    showCommentNotification(username, commentText, postImage = null) {
        const options = {
            body: `@${username} commented: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
            icon: '/logo192.png',
            image: postImage,
            tag: 'comment-notification',
            url: '/notifications'
        };

        return this.showNotification('New Comment! 💬', options);
    }

    // Show notification for follow
    showFollowNotification(username, profilePicture = null) {
        const options = {
            body: `@${username} started following you`,
            icon: profilePicture || '/logo192.png',
            tag: 'follow-notification',
            url: '/notifications'
        };

        return this.showNotification('New Follower! 👤', options);
    }

    // Show generic notification
    showGenericNotification(message, type = 'info') {
        const icons = {
            info: '📢',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const options = {
            body: message,
            icon: '/logo192.png',
            tag: `${type}-notification`
        };

        return this.showNotification(`${icons[type]} Notification`, options);
    }

    // Register service worker
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }

    // Check permission status
    getPermissionStatus() {
        return this.permission;
    }

    // Check if permission is granted
    isPermissionGranted() {
        return this.permission === 'granted';
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
