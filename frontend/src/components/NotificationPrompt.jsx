import React, { useState, useEffect } from 'react';
import { IoNotificationsOutline, IoClose } from 'react-icons/io5';
import notificationManager from '../utils/notificationManager';
import '../styles/NotificationPrompt.css';

function NotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        // Check if we should show the prompt
        const hasAsked = localStorage.getItem('notificationPromptShown');
        const currentPermission = notificationManager.getPermissionStatus();

        setPermission(currentPermission);

        // Show prompt if not asked before and permission is default
        if (!hasAsked && currentPermission === 'default') {
            // Show after 3 seconds to not overwhelm user
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        }
    }, []);

    const handleEnable = async () => {
        const granted = await notificationManager.requestPermission();
        setPermission(granted ? 'granted' : 'denied');
        setShowPrompt(false);
        localStorage.setItem('notificationPromptShown', 'true');

        if (granted) {
            // Show test notification
            notificationManager.showGenericNotification(
                'You will now receive notifications for likes, comments, and follows!',
                'success'
            );
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('notificationPromptShown', 'true');
    };

    if (!showPrompt || permission !== 'default') {
        return null;
    }

    return (
        <div className="notification-prompt-overlay">
            <div className="notification-prompt">
                <button className="btn-close-prompt" onClick={handleDismiss}>
                    <IoClose />
                </button>

                <div className="prompt-icon">
                    <IoNotificationsOutline />
                </div>

                <h3>Enable Notifications?</h3>
                <p>
                    Get instant alerts when someone likes your posts, comments, or follows you.
                    Stay connected with your community!
                </p>

                <div className="prompt-actions">
                    <button className="btn-enable" onClick={handleEnable}>
                        Enable Notifications
                    </button>
                    <button className="btn-dismiss" onClick={handleDismiss}>
                        Maybe Later
                    </button>
                </div>

                <div className="prompt-features">
                    <div className="feature-item">
                        <span className="feature-icon">❤️</span>
                        <span>New likes</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">💬</span>
                        <span>Comments</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">👤</span>
                        <span>New followers</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationPrompt;
