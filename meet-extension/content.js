// Content script for Google Meet attendance tracking
console.log('Meet Attendance Tracker: Content script loaded');

let isTracking = false;
let sessionCode = null;
let participantMap = new Map();
// Structure: name -> { 
//   firstJoinedAt: ISOString, 
//   totalDurationMs: number, 
//   lastJoinedAt: ISOString (or null if offline),
//   rejoinCount: number,
//   status: 'Active' | 'Left',
//   lastLeftAt: ISOString (or null if active)
// }

let observerInstance = null;
let checkInterval = null;

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_TRACKING') {
        isTracking = true;
        sessionCode = message.sessionCode;
        participantMap.clear();
        console.log('✅ Started tracking session:', sessionCode);
        initializeTracking();
        sendResponse({ success: true });
    } else if (message.action === 'STOP_TRACKING') {
        isTracking = false;
        if (observerInstance) {
            observerInstance.disconnect();
            observerInstance = null;
        }
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        console.log('⏹️ Stopped tracking');
        sendResponse({ success: true, sessionCode });
    } else if (message.action === 'GET_STATUS') {
        sendResponse({
            isTracking,
            sessionCode,
            participantCount: getActiveParticipantCount()
        });
    } else if (message.action === 'GET_ATTENDANCE_DATA') {
        const attendanceData = generateAttendanceReport();
        sendResponse({ success: true, data: attendanceData, sessionCode });
    }
    return true;
});

function getActiveParticipantCount() {
    let count = 0;
    for (let [name, data] of participantMap) {
        if (data.status === 'Active') count++;
    }
    return count;
}

function generateAttendanceReport() {
    const report = [];
    const now = new Date();

    for (let [name, data] of participantMap) {
        let currentSessionDuration = 0;
        let lastLeaveTime = 'Still in meeting';

        if (data.status === 'Active' && data.lastJoinedAt) {
            currentSessionDuration = now - new Date(data.lastJoinedAt);
        } else {
            // For 'Left' status, we don't have a single "Last Leave" easily stored in this simplified model 
            // without a full logs array, but we can imply it or just say 'Left'
            // To keep it simple as requested, we'll just say 'Left' or calculate based on the update moment.
            // Actually, let's store `lastLeftAt` in the map for better reporting.
            lastLeaveTime = data.lastLeftAt ? new Date(data.lastLeftAt).toLocaleString() : 'N/A';
        }

        const totalDurationMs = data.totalDurationMs + currentSessionDuration;

        report.push({
            name: name,
            firstJoinedAt: data.firstJoinedAt,
            lastLeaveAt: data.status === 'Active' ? 'Still in meeting' : lastLeaveTime,
            status: data.status,
            rejoins: data.rejoinCount,
            duration: formatDuration(totalDurationMs)
        });
    }
    return report;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    const mRemaining = m % 60;

    if (h > 0) return `${h}h ${mRemaining}m ${s}s`;
    return `${mRemaining}m ${s}s`;
}

function initializeTracking() {
    console.log('🔍 Initializing participant tracking...');

    // Set up mutation observer
    observerInstance = new MutationObserver((mutations) => {
        if (!isTracking) return;
        checkParticipants();
    });

    // Start observing immediately
    observerInstance.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-participant-id', 'aria-label']
    });

    // Also check periodically (every 2 seconds) as backup
    checkInterval = setInterval(() => {
        if (isTracking) {
            checkParticipants();
        }
    }, 2000);

    // Initial check
    setTimeout(() => checkParticipants(), 1000);
}

const IGNORED_STRINGS = new Set([
    'you', 'your', 'presentation', 'presenting',
    'more_vert', 'search', 'close', 'menu', 'check', 'check_circle',
    'people', 'chat', 'activities', 'info', 'settings',
    'mic', 'mic_off', 'videocam', 'videocam_off',
    'keyboard_arrow_down', 'keyboard_arrow_up', 'expand_more', 'expand_less',
    'arrow_back', 'arrow_forward', 'open_in_new', 'logout',
    'present_to_all', 'stop_screen_share', 'call_end',
    'raised_hand', 'frame_person', 'full_screen', 'exit_full_screen',
    'captions', 'cc', 'turn_on_captions', 'turn_off_captions',
    'participant_list', 'meeting_details', 'security',
    'keep_outline', 'keep_public', 'alarm', 'add_people', 'person_add',
    'keyboard', 'keyboard_alt', 'others', 'skin_tone', 'search',
    'cancel', 'done', 'warning', 'error', 'help', 'history',
    'meeting_host', 'admit', 'deny', 'view', 'join', 'guest', 'remove',
    'mute', 'pin', 'volume_up', 'volume_off', 'more_options',
    'keep', 'off', 'on', 'auto', 'frame', 'person', 'unknown',
    'am', 'pm'
]);

function extractParticipantName(element) {
    // Immediate rejection for obvious button/icon containers
    if (element.tagName === 'BUTTON' ||
        element.getAttribute('role') === 'button' ||
        element.classList.contains('material-icons') ||
        element.classList.contains('google-material-icons') ||
        element.classList.contains('material-symbols-outlined')) {
        return null;
    }

    const candidates = [];

    // Use TreeWalker to find pure text nodes
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Traverse up to check if this text is inside a blocked container
                let ptr = node.parentElement;
                while (ptr && ptr !== element) {
                    if (ptr.tagName === 'BUTTON' ||
                        ptr.getAttribute('role') === 'button' ||
                        ptr.tagName === 'I' ||
                        ptr.classList.contains('material-icons-extended') ||
                        ptr.classList.contains('material-icons') ||
                        ptr.getAttribute('aria-hidden') === 'true') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    ptr = ptr.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (isValidName(text)) {
            candidates.push(text);
        }
    }

    if (candidates.length > 0) {
        // Sort by length (descending) but penalize very long strings that look like sentences
        candidates.sort((a, b) => b.length - a.length);

        for (const candidate of candidates) {
            // Strict check
            if (!candidate.includes('\n') && !candidate.match(/^\d+:\d+$/)) {
                return candidate;
            }
        }
    }

    // Fallback: Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
        if (!ariaLabel.includes('More options') &&
            !ariaLabel.includes('Pin') &&
            !ariaLabel.includes('Mute') &&
            !ariaLabel.includes('Remove')) {

            let clean = ariaLabel.replace(/\(You\)$/, '').trim();
            clean = clean.replace(/\(Presentation\)$/, '').trim();
            clean = clean.replace(/^Remove\s+/, '').trim();

            if (isValidName(clean)) return clean;
        }
    }

    return null;
}

function isValidName(text) {
    if (!text) return false;

    const lower = text.toLowerCase().trim();

    // 1. Basic length check
    if (lower.length < 2 || lower.length > 50) return false;

    // 2. Ignore blocklisted strings
    if (IGNORED_STRINGS.has(lower)) return false;

    // 3. Ignore sentences and UI phrases (Starts with or Contains)
    if (lower.startsWith('admit ')) return false;    // "Admit 1 guest"
    if (lower.startsWith('allow ')) return false;
    if (lower.startsWith('deny ')) return false;
    if (lower.includes('others might')) return false; // "Others might see..."
    if (lower.includes('are you talking')) return false; // "Are you talking?"
    if (lower.includes('meeting host')) return false;
    if (lower.includes('participant')) return false;
    if (lower.includes('has joined')) return false;
    if (lower.includes('has left')) return false;
    if (lower.includes('would like to join')) return false; // "Someone would like to join"

    // 4. Ignore URLs
    if (lower.includes('http:') || lower.includes('https:') || lower.includes('.com') || lower.includes('.org') || lower.includes('meet.google')) return false;

    // 5. Ignore Meeting Codes (xxx-xxxx-xxx)
    if (lower.match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/)) return false;

    // 6. Ignore timestamps
    if (text.match(/^\d{1,2}:\d{2}\s?(AM|PM)?$/i)) return false;

    // 7. Ignore numeric/single char/truncation
    if (text.match(/^\d+$/)) return false;
    if (text.length === 1) return false;
    if (lower.match(/^\d+\s+more$/)) return false; // "5 more"

    // 8. Ignore strings containing only special chars
    if (text.match(/^[^a-zA-Z0-9]+$/)) return false;

    // 9. Ignore purely numeric + chars usually in codes
    if (text.match(/^[a-z0-9\-]+$/) && text.includes('-')) return false; // aggressively block hyphenated codes

    return true;
}

function checkParticipants() {
    // Multiple selector strategies for finding participants
    const selectors = [
        '[data-participant-id]',
        '[data-requested-participant-id]',
        'div[data-self-name]',
        '[aria-label*="participant"]',
        'div[jscontroller][jsname]'
    ];

    const visibleParticipants = new Set();
    const scannedElements = new Set();

    // 1. Scan DOM for currently visible participants
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!scannedElements.has(el)) {
                scannedElements.add(el);
                const name = extractParticipantName(el);
                if (name) {
                    visibleParticipants.add(name);
                }
            }
        });
    }

    const now = new Date();
    const nowISO = now.toISOString();

    // 2. Handle Joins & Rejoins
    visibleParticipants.forEach(name => {
        if (!participantMap.has(name)) {
            // -- First Time Join --
            participantMap.set(name, {
                firstJoinedAt: nowISO,
                lastJoinedAt: nowISO,
                lastLeftAt: null,
                totalDurationMs: 0,
                rejoinCount: 0,
                status: 'Active'
            });
            console.log(`✅ ${name} joined`);
        } else {
            // -- Already known --
            const data = participantMap.get(name);
            if (data.status === 'Left') {
                // -- Rejoin --
                data.status = 'Active';
                data.lastJoinedAt = nowISO;
                data.lastLeftAt = null; // Reset last left since they are back
                data.rejoinCount += 1;
                console.log(`🔄 ${name} rejoined (Count: ${data.rejoinCount})`);
            }
            // If status is Active, update nothing (session continues)
        }
    });

    // 3. Handle Leaves
    // Iterate over our map to see who is missing from visibleParticipants
    for (let [name, data] of participantMap) {
        if (data.status === 'Active' && !visibleParticipants.has(name)) {
            // -- Leave Detected --
            data.status = 'Left';

            // Add session duration to total
            const sessionStart = new Date(data.lastJoinedAt);
            const sessionDuration = now - sessionStart;
            data.totalDurationMs += sessionDuration;

            data.lastJoinedAt = null; // No longer active session
            data.lastLeftAt = nowISO;

            console.log(`❌ ${name} left (Session: ${formatDuration(sessionDuration)})`);
        }
    }
}

// Log when script is ready
console.log('📊 Meet Attendance Tracker ready. Waiting for tracking to start...');
