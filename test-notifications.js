// Test script to check if notification system is working
// Run this in browser console on Feed page

async function testNotificationSystem() {
    console.log('🧪 Testing Notification System...\n');

    const API_URL = 'http://localhost:5000';
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('❌ No token found. Please login first.');
        return;
    }

    console.log('✅ Token found');

    // Test 1: Check if notification routes exist
    console.log('\n📡 Test 1: Checking notification routes...');
    try {
        const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Notification routes working!');
            console.log('📊 Unread count:', data.count);
        } else {
            console.error('❌ Notification routes not working');
            console.error('Status:', response.status);
            console.error('Response:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error connecting to backend:', error.message);
        console.log('💡 Tip: Make sure backend server is running on port 5000');
    }

    // Test 2: Fetch all notifications
    console.log('\n📡 Test 2: Fetching all notifications...');
    try {
        const response = await fetch(`${API_URL}/api/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Notifications fetched successfully!');
            console.log('📊 Total notifications:', data.notifications.length);
            if (data.notifications.length > 0) {
                console.log('📝 Latest notification:', data.notifications[0]);
            } else {
                console.log('ℹ️ No notifications yet. Try liking a post!');
            }
        } else {
            console.error('❌ Failed to fetch notifications');
            console.error('Status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    // Test 3: Check if notification count state exists
    console.log('\n📡 Test 3: Checking React state...');
    const feedComponent = document.querySelector('.feed-container');
    if (feedComponent) {
        console.log('✅ Feed component found');
    } else {
        console.log('❌ Feed component not found');
    }

    // Test 4: Check if notification bell exists
    const notificationBell = document.querySelector('.btn-notifications');
    if (notificationBell) {
        console.log('✅ Notification bell button found');
        const badge = notificationBell.querySelector('.notification-badge');
        if (badge) {
            console.log('✅ Notification badge found');
            console.log('📊 Badge count:', badge.textContent);
        } else {
            console.log('ℹ️ No badge (means 0 unread notifications)');
        }
    } else {
        console.log('❌ Notification bell button not found');
        console.log('💡 Tip: Make sure Feed.jsx has been updated with notification bell');
    }

    console.log('\n✅ Test complete!');
    console.log('\n📋 Summary:');
    console.log('1. Backend routes:', response ? '✅' : '❌');
    console.log('2. Notification bell:', notificationBell ? '✅' : '❌');
    console.log('\n💡 Next steps:');
    console.log('- If backend routes failed: Restart backend server');
    console.log('- If notification bell not found: Refresh the page');
    console.log('- To create test notification: Like a post from another user');
}

// Run the test
testNotificationSystem();
