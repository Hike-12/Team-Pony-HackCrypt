// Popup script for Meet Attendance Tracker
document.addEventListener('DOMContentLoaded', async () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const sessionCodeInput = document.getElementById('sessionCodeInput');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const sessionInfo = document.getElementById('sessionInfo');
    const inputSection = document.getElementById('inputSection');
    const sessionCodeDisplay = document.getElementById('sessionCode');
    const participantCountDisplay = document.getElementById('participantCount');

    // Get current status from content script
    await updateStatus();

    startBtn.addEventListener('click', async () => {
        const sessionCode = sessionCodeInput.value.trim();

        if (!sessionCode) {
            alert('Please enter a session code');
            return;
        }

        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url?.includes('meet.google.com')) {
            alert('Please open a Google Meet session first');
            return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
            action: 'START_TRACKING',
            sessionCode
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error:', chrome.runtime.lastError);
                alert('Failed to start tracking. Please refresh the Meet page.');
                return;
            }

            if (response?.success) {
                // Store session code
                chrome.storage.local.set({ sessionCode });
                updateStatus();
            }
        });
    });

    stopBtn.addEventListener('click', async () => {
        // First ask for confirmation
        const confirmed = confirm('Download attendance CSV and stop tracking?');

        if (!confirmed) {
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        console.log('Stop button clicked, getting attendance data...');

        // Get the attendance data
        chrome.tabs.sendMessage(tab.id, {
            action: 'GET_ATTENDANCE_DATA'
        }, async (attendanceResponse) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting attendance data:', chrome.runtime.lastError);
                alert('Error: Could not retrieve attendance data. Please try again.');
                return;
            }

            console.log('Attendance response:', attendanceResponse);

            if (attendanceResponse?.success && attendanceResponse.data) {
                console.log('Attendance data received, downloading CSV...');

                // Generate and download CSV using Chrome downloads API
                try {
                    await downloadCSVWithChromeAPI(attendanceResponse.data, attendanceResponse.sessionCode);
                } catch (error) {
                    console.error('Download error:', error);
                    alert('Error downloading CSV: ' + error.message);
                }
            } else {
                alert('No attendance data found. Make sure tracking was active and participants joined.');
            }

            // Then stop tracking
            chrome.tabs.sendMessage(tab.id, {
                action: 'STOP_TRACKING'
            }, (response) => {
                if (response?.success) {
                    chrome.storage.local.remove('sessionCode');
                    updateStatus();
                }
            });
        });
    });

    async function updateStatus() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.url?.includes('meet.google.com')) {
            statusText.textContent = 'Not in Meet';
            return;
        }

        chrome.tabs.sendMessage(tab.id, {
            action: 'GET_STATUS'
        }, (response) => {
            if (chrome.runtime.lastError) {
                statusText.textContent = 'Not Tracking';
                return;
            }

            if (response?.isTracking) {
                statusIndicator.classList.add('active');
                statusText.textContent = 'Tracking Active';
                sessionInfo.style.display = 'block';
                inputSection.style.display = 'none';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'block';

                sessionCodeDisplay.textContent = response.sessionCode || '-';
                participantCountDisplay.textContent = response.participantCount || 0;
            } else {
                statusIndicator.classList.remove('active');
                statusText.textContent = 'Not Tracking';
                sessionInfo.style.display = 'none';
                inputSection.style.display = 'block';
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
            }
        });
    }

    // Update status every 2 seconds
    setInterval(updateStatus, 2000);

    // Helper function to download CSV using Chrome downloads API
    async function downloadCSVWithChromeAPI(attendanceData, sessionCode) {
        console.log('Creating CSV with', attendanceData.length, 'participants');

        // Create CSV header
        let csv = 'Participant Name,Joined At,Left At,Duration,Status\n';

        // Add data rows
        attendanceData.forEach(participant => {
            const name = participant.name || 'Unknown';
            const joinedAt = formatDateTime(participant.joinedAt);
            const leftAt = participant.leftAt ? formatDateTime(participant.leftAt) : 'Still in meeting';
            const duration = participant.duration || 'N/A';
            const status = participant.leftAt ? 'Left' : 'Active';

            // Escape commas in names
            const escapedName = name.includes(',') ? `"${name}"` : name;

            csv += `${escapedName},${joinedAt},${leftAt},${duration},${status}\n`;
        });

        console.log('CSV content created, length:', csv.length);

        // Create blob and data URL
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Generate filename with session code and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `meet-attendance-${sessionCode || 'session'}-${timestamp}.csv`;

        console.log('Downloading file:', filename);

        // Use Chrome downloads API
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true  // This will prompt user to choose location
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                alert('Download failed: ' + chrome.runtime.lastError.message);
            } else {
                console.log('Download started with ID:', downloadId);
                alert(`CSV download started!\nFile: ${filename}\nParticipants: ${attendanceData.length}\n\nChoose where to save the file.`);
            }
        });
    }

    function formatDateTime(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
});
