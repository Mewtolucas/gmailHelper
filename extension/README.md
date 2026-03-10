# Gmail Helper Chrome Extension

This is a Chrome extension that brings Gmail Helper directly into Gmail.

## Features

- **Instant Email Categorization** - Categorize emails with a single click from the Gmail sidebar
- **Mark Important** - Flag critical emails
- **Spam Detection** - Report emails as spam directly from Gmail
- **Email Analysis** - Get AI-powered analysis of emails
- **Category Management** - Create and manage custom categories
- **Email Sync** - Sync and analyze all your emails

## Installation

### Prerequisites

1. Node.js 16+ installed
2. Gmail Helper backend API running on `http://localhost:3000`

### Setup Steps

1. **Start the backend API**
   ```bash
   npm run server
   ```
   This will start the Express server on `http://localhost:3000`

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

3. **Authenticate**
   - Click the Gmail Helper icon in Chrome's extension menu
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - The extension is now ready to use

## Usage

### In Gmail
1. Open Gmail and select an email
2. The Gmail Helper sidebar will appear on the right
3. Use the buttons to:
   - **Categorize** - Click on a category to assign the email
   - **Mark Important** - Flag emails as priority
   - **Report Spam** - Mark emails as spam
   - **Analyze** - Get AI analysis of the email

### In the Popup
1. Click the Gmail Helper extension icon
2. **Manage Categories** - View, create, and manage your custom categories
3. **Sync Emails** - Start a background sync of your emails
4. **Logout** - Sign out of Gmail Helper

## Architecture

```
Chrome Extension
├── manifest.json       # Extension configuration (Manifest v3)
├── background.js       # Service worker handling API calls
├── content.js          # Injects sidebar into Gmail
├── popup.html          # Extension popup UI
└── popup.js            # Popup logic

                ↓
         Backend API (Express)
         http://localhost:3000

         /api/auth          # Authentication
         /api/categories    # Category management
         /api/emails        # Email operations
         /api/vip           # VIP management
         /api/sync          # Email synchronization
```

## Security & Privacy

- **Local Storage** - Categories and settings stored in Chrome storage
- **Secure Communication** - Uses HTTPS for Gmail API calls
- **No Data Logging** - Extension doesn't store email content
- **OAuth** - Uses secure OAuth 2.0 for authentication

## Troubleshooting

### Extension not showing in Gmail
- Ensure the backend API is running on `http://localhost:3000`
- Check Chrome console for errors (F12 > Console)
- Reload the extension (chrome://extensions/)

### Authentication fails
- Check that your Google Cloud credentials are valid
- Ensure `.env` file has correct `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`
- Try logging out and logging in again

### Sidebar not appearing
- Refresh Gmail page (Ctrl+R or Cmd+R)
- Check browser console for JavaScript errors
- Make sure the backend API is accessible

### API Connection errors
- Verify backend is running: `npm run server`
- Check CORS is enabled in backend
- Ensure `http://localhost:3000` is accessible

## Development

### Debug Mode
- Open Chrome DevTools (F12) on Gmail
- Check Console and Network tabs for extension activity
- Check Service Worker (chrome://extensions/ > Details > "Inspect views")

### Modify Sidebar UI
Edit `content.js` - look for `injectGmailHelper()` function

### Modify Popup UI
Edit `popup.html` for layout and `popup.js` for logic

### Add New Features
1. Add backend endpoint to `src/server/routes/*.ts`
2. Add message handler in `background.js`
3. Add UI and trigger in `content.js` or `popup.js`

## Contributing

Contributions welcome! Please:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

## License

MIT
