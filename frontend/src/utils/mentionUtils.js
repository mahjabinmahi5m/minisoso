// Mention Utility Functions
// Handles @mention detection, parsing, and formatting

/**
 * Extract all @mentions from text
 * @param {string} text - Text to search for mentions
 * @returns {Array} - Array of mentioned usernames (without @)
 */
export function extractMentions(text) {
    if (!text) return [];

    // Match @username pattern (letters, numbers, underscore, dot)
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        const username = match[1];
        if (!mentions.includes(username)) {
            mentions.push(username);
        }
    }

    return mentions;
}

/**
 * Convert @mentions to clickable links in text
 * @param {string} text - Text with @mentions
 * @returns {JSX} - Text with clickable mention links
 */
export function renderMentions(text) {
    if (!text) return text;

    const parts = [];
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        // Add mention as clickable link
        const username = match[1];
        parts.push({
            type: 'mention',
            username: username,
            text: `@${username}`
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}

/**
 * Highlight @mentions in textarea as user types
 * @param {string} text - Current text
 * @returns {string} - HTML with highlighted mentions
 */
export function highlightMentions(text) {
    if (!text) return text;

    return text.replace(
        /@([a-zA-Z0-9_.]+)/g,
        '<span class="mention-highlight">@$1</span>'
    );
}

/**
 * Get cursor position for mention autocomplete
 * @param {string} text - Text before cursor
 * @returns {Object} - { isMentioning: boolean, query: string, startPos: number }
 */
export function getMentionContext(text) {
    if (!text) return { isMentioning: false, query: '', startPos: -1 };

    // Find last @ symbol
    const lastAtIndex = text.lastIndexOf('@');

    if (lastAtIndex === -1) {
        return { isMentioning: false, query: '', startPos: -1 };
    }

    // Get text after @
    const afterAt = text.substring(lastAtIndex + 1);

    // Check if there's a space (mention ended)
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
        return { isMentioning: false, query: '', startPos: -1 };
    }

    // Check if @ is at start or after space/newline
    const beforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
    const isValidStart = beforeAt === ' ' || beforeAt === '\n' || lastAtIndex === 0;

    if (!isValidStart) {
        return { isMentioning: false, query: '', startPos: -1 };
    }

    return {
        isMentioning: true,
        query: afterAt,
        startPos: lastAtIndex
    };
}

/**
 * Validate username for mentions
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
export function isValidMentionUsername(username) {
    if (!username) return false;

    // Username should be 3-30 characters, alphanumeric, underscore, dot
    const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
    return usernameRegex.test(username);
}

/**
 * Format mention notification message
 * @param {string} mentionerUsername - User who mentioned
 * @param {string} context - 'post' or 'comment'
 * @returns {string} - Formatted message
 */
export function formatMentionNotification(mentionerUsername, context = 'post') {
    if (context === 'comment') {
        return `mentioned you in a comment`;
    }
    return `mentioned you in a post`;
}

/**
 * Search users for mention autocomplete
 * @param {Array} users - Array of user objects
 * @param {string} query - Search query
 * @returns {Array} - Filtered users
 */
export function searchUsersForMention(users, query) {
    if (!query) return users.slice(0, 5);

    const lowerQuery = query.toLowerCase();

    return users
        .filter(user =>
            user.username.toLowerCase().includes(lowerQuery) ||
            (user.full_name && user.full_name.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 5);
}

export default {
    extractMentions,
    renderMentions,
    highlightMentions,
    getMentionContext,
    isValidMentionUsername,
    formatMentionNotification,
    searchUsersForMention
};
