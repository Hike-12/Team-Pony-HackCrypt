// Background service worker for Meet Attendance Tracker
console.log('Meet Attendance Tracker: Background service worker loaded');

const API_BASE_URL = 'http://localhost:8000/api/meet';
let attendanceQueue = [];

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PARTICIPANT_JOINED') {
        handleParticipantJoined(message.data);
    } else if (message.action === 'PARTICIPANT_LEFT') {
        handleParticipantLeft(message.data);
    }
});

async function handleParticipantJoined(data) {
    console.log('Background: Participant joined', data);

    // Store in queue
    attendanceQueue.push({
        type: 'JOIN',
        ...data,
        timestamp: new Date().toISOString()
    });

    // Send to backend
    await sendToBackend({
        sessionCode: data.sessionCode,
        participantName: data.participantName,
        joinedAt: data.joinedAt,
        eventType: 'JOIN'
    });
}

async function handleParticipantLeft(data) {
    console.log('Background: Participant left', data);

    // Calculate duration
    const joinedTime = new Date(data.joinedAt);
    const leftTime = new Date(data.leftAt);
    const durationMinutes = Math.round((leftTime - joinedTime) / 60000);

    // Store in queue
    attendanceQueue.push({
        type: 'LEAVE',
        ...data,
        durationMinutes,
        timestamp: new Date().toISOString()
    });

    // Send to backend
    await sendToBackend({
        sessionCode: data.sessionCode,
        participantName: data.participantName,
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
        durationMinutes,
        eventType: 'LEAVE'
    });
}

async function sendToBackend(attendanceData) {
    try {
        // Get auth token from storage
        const { authToken } = await chrome.storage.local.get('authToken');

        const response = await fetch(`${API_BASE_URL}/attendance/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify(attendanceData)
        });

        if (!response.ok) {
            console.error('Failed to send attendance data:', response.statusText);
            // Keep in queue for retry
            return;
        }

        const result = await response.json();
        console.log('Attendance data sent successfully:', result);

    } catch (error) {
        console.error('Error sending attendance data:', error);
        // Keep in queue for retry
    }
}

// Periodic sync of queued data (every 30 seconds)
setInterval(async () => {
    if (attendanceQueue.length > 0) {
        console.log(`Syncing ${attendanceQueue.length} queued attendance records...`);
        // In a production app, you'd batch send these
        // For now, they're already sent individually
    }
}, 30000);

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open popup (handled by manifest)
});
