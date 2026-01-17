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
                alert('Failed to start tracking. Please refresh the Meet page and try again.');
                return;
            }

            if (response?.success) {
                // Store session code
                chrome.storage.local.set({ sessionCode });
                updateStatus();
                console.log('✅ Tracking started successfully');
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

        console.log('⏹️ Stop button clicked, getting attendance data...');

        // Get the attendance data
        chrome.tabs.sendMessage(tab.id, {
            action: 'GET_ATTENDANCE_DATA'
        }, async (attendanceResponse) => {
            if (chrome.runtime.lastError) {
                console.error('Error getting attendance data:', chrome.runtime.lastError);
                alert('Error: Could not retrieve attendance data. Please try again.');
                return;
            }

            console.log('📊 Attendance response:', attendanceResponse);

            if (attendanceResponse?.success && attendanceResponse.data) {
                console.log('📥 Attendance data received, downloading CSV...');

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
                    console.log('✅ Tracking stopped');
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

    // Helper function to properly escape CSV values
    function escapeCSVValue(value) {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }

        return stringValue;
    }

    // Helper function to download CSV using Chrome downloads API
    async function downloadCSVWithChromeAPI(attendanceData, sessionCode) {
        console.log('📝 Creating CSV with', attendanceData.length, 'participants');

        // Create CSV header - properly aligned columns
        const headers = ['Participant Name', 'Joined At', 'Left At', 'Duration', 'Rejoins', 'Status'];
        let csv = headers.join(',') + '\n';

        // Sort by join time
        attendanceData.sort((a, b) => new Date(a.firstJoinedAt) - new Date(b.firstJoinedAt));

        // Add data rows with proper escaping
        attendanceData.forEach(participant => {
            const name = escapeCSVValue(participant.name || 'Unknown');
            const joinedAt = escapeCSVValue(formatDateTime(participant.firstJoinedAt));
            const leftAt = escapeCSVValue(participant.lastLeaveAt); // Already formatted string or 'Still in meeting'
            const duration = escapeCSVValue(participant.duration || 'N/A');
            const rejoins = escapeCSVValue(participant.rejoins || 0);
            const status = participant.status ? escapeCSVValue(participant.status) : escapeCSVValue('Active');

            // Build row with proper column alignment
            const row = [name, joinedAt, leftAt, duration, rejoins, status].join(',');
            csv += row + '\n';
        });

        console.log('✅ CSV content created, length:', csv.length);
        console.log('Preview (first 500 chars):', csv.substring(0, 500));

        // Create blob and data URL
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Generate filename with session code and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `meet-attendance-${sessionCode || 'session'}-${timestamp}.csv`;

        console.log('📥 Downloading file:', filename);

        // Use Chrome downloads API
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true  // This will prompt user to choose location
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Download error:', chrome.runtime.lastError);
                alert('Download failed: ' + chrome.runtime.lastError.message);
            } else {
                console.log('✅ Download started with ID:', downloadId);
                alert(`CSV download started!\n\nFile: ${filename}\nParticipants: ${attendanceData.length}\n\nChoose where to save the file.`);

                // Clean up the blob URL after a delay
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        });
    }

    function formatDateTime(isoString) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);

        // Format: MM/DD/YYYY HH:MM:SS AM/PM
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const hoursStr = String(hours).padStart(2, '0');

        return `${month}/${day}/${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    }
});
