// Content script for Google Meet attendance tracking
console.log('Meet Attendance Tracker: Content script loaded');

let isTracking = false;
let sessionCode = null;
let participantMap = new Map(); // name -> {joinedAt, leftAt}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TRACKING') {
        isTracking = true;
        sessionCode = message.sessionCode;
        participantMap.clear(); // Clear previous data
        console.log('Started tracking session:', sessionCode);
        initializeTracking();
        sendResponse({ success: true });
    } else if (message.action === 'STOP_TRACKING') {
        isTracking = false;
        console.log('Stopped tracking');
        sendResponse({ success: true, sessionCode });
    } else if (message.action === 'GET_STATUS') {
        sendResponse({
            isTracking,
            sessionCode,
            participantCount: participantMap.size
        });
    } else if (message.action === 'GET_ATTENDANCE_DATA') {
        // Return all participant data for CSV export
        const attendanceData = Array.from(participantMap.entries()).map(([name, data]) => ({
            name,
            joinedAt: data.joinedAt,
            leftAt: data.leftAt,
            duration: calculateDuration(data.joinedAt, data.leftAt)
        }));
        sendResponse({ success: true, data: attendanceData, sessionCode });
    }
    return true;
});

function initializeTracking() {
    // Observe the participant list for changes
    const observer = new MutationObserver((mutations) => {
        if (!isTracking) return;
        checkParticipants();
    });

    // Wait for Meet UI to load
    const checkForParticipantPanel = setInterval(() => {
        // Google Meet uses different selectors, we'll target the participant panel
        const participantPanel = document.querySelector('[data-participant-id]')?.parentElement?.parentElement;

        if (participantPanel) {
            clearInterval(checkForParticipantPanel);
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Initial check
            checkParticipants();
        }
    }, 1000);
}

function checkParticipants() {
    // Get all participant elements
    // Note: Google Meet's DOM structure changes frequently
    // This selector targets participant name elements
    const participantElements = document.querySelectorAll('[data-participant-id]');

    const currentParticipants = new Set();

    participantElements.forEach(element => {
        // Extract participant name
        const nameElement = element.querySelector('[data-self-name], [jsname]');
        const participantName = nameElement?.textContent?.trim();

        if (participantName && participantName !== 'You') {
            currentParticipants.add(participantName);

            // New participant joined
            if (!participantMap.has(participantName)) {
                const joinedAt = new Date().toISOString();
                participantMap.set(participantName, { joinedAt, leftAt: null });

                console.log('Participant joined:', participantName);

                // Send to background script
                chrome.runtime.sendMessage({
                    action: 'PARTICIPANT_JOINED',
                    data: {
                        sessionCode,
                        participantName,
                        joinedAt
                    }
                });
            }
        }
    });

    // Check for participants who left
    participantMap.forEach((data, name) => {
        if (!currentParticipants.has(name) && data.leftAt === null) {
            const leftAt = new Date().toISOString();
            data.leftAt = leftAt;

            console.log('Participant left:', name);

            // Send to background script
            chrome.runtime.sendMessage({
                action: 'PARTICIPANT_LEFT',
                data: {
                    sessionCode,
                    participantName: name,
                    joinedAt: data.joinedAt,
                    leftAt
                }
            });
        }
    });
}

// Alternative approach: Monitor the participant count badge
function monitorParticipantCount() {
    const observer = new MutationObserver(() => {
        if (!isTracking) return;

        // Find the participant count button
        const participantButton = document.querySelector('[aria-label*="participant"], [aria-label*="people"]');

        if (participantButton) {
            const countText = participantButton.textContent;
            console.log('Participant count:', countText);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// Helper function to calculate duration
function calculateDuration(joinedAt, leftAt) {
    if (!joinedAt) return 'N/A';

    const start = new Date(joinedAt);
    const end = leftAt ? new Date(leftAt) : new Date();

    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}
