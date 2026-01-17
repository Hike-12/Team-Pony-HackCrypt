# Google Meet Attendance Tracker Extension

## Features

✅ **Accurate Name Extraction** - Multiple fallback strategies to capture real participant names  
✅ **Rejoin Tracking** - Detects when participants leave and rejoin  
✅ **Proper CSV Export** - Correctly formatted CSV with no column misalignment  
✅ **Persistent Tracking** - Continues tracking even if popup is closed  
✅ **Real-time Updates** - Live participant count display  
✅ **Detailed Logging** - Console logs with emojis for easy debugging  

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `meet-extension` folder
5. The extension icon should appear in your toolbar

## Usage

### Starting Attendance Tracking

1. Join a Google Meet session
2. Click the extension icon
3. Enter a session code (e.g., "CS101-Lecture-1")
4. Click "Start Tracking"
5. The extension will now track all participants

### Stopping and Exporting

1. Click the extension icon
2. Click "Stop Tracking"
3. Confirm the download
4. Choose where to save the CSV file

## CSV Format

The exported CSV includes:

- **Participant Name** - Full name of the participant
- **Joined At** - Timestamp when they joined (MM/DD/YYYY HH:MM:SS AM/PM)
- **Left At** - Timestamp when they left (or "Still in meeting")
- **Duration** - Total time in meeting (e.g., "1h 23m 45s")
- **Rejoins** - Number of times they rejoined after leaving
- **Status** - "Active" or "Left"

## Troubleshooting

### "Failed to start tracking"
- Refresh the Google Meet page
- Make sure you're in an active meeting
- Check that the extension is enabled

### Names showing as "User has joined"
- This has been fixed with multiple fallback selectors
- If it still happens, check the console logs (F12 → Console)

### CSV columns misaligned
- This has been fixed with proper CSV escaping
- Names with commas are now properly quoted

### Popup closes too quickly
- The popup can be closed, but tracking continues in the background
- Click the icon again to see current status
- Tracking persists until you explicitly stop it

## Console Logs

The extension uses emoji-prefixed logs for easy debugging:

- ✅ Success messages
- ❌ Error messages
- 👥 Participant list updates
- 🔄 Rejoin events
- 📊 Data operations
- 📥 Download operations

## Privacy

- All tracking happens locally in your browser
- No data is sent to external servers (except optional backend integration)
- Participant data is only stored during active tracking
- CSV export is completely local

## Technical Details

### Name Extraction Strategies

1. **Aria-label parsing** - Extracts from accessibility attributes
2. **Child element scanning** - Searches for name-containing elements
3. **Direct text filtering** - Filters out system messages

### Edge Cases Handled

- Participants rejoining after leaving
- Names with special characters (commas, quotes)
- Multiple participants with similar names
- Network disconnections and reconnections
- Meet UI changes and updates

## Support

If you encounter issues:

1. Check the browser console (F12 → Console tab)
2. Look for error messages with ❌ prefix
3. Verify you're on a Google Meet page
4. Try refreshing the page and restarting tracking

## Version

**v2.0** - Enhanced tracking with better name extraction and CSV formatting
