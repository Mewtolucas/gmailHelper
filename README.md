# Gmail Helper

A comprehensive Gmail management application with AI-powered email categorization, prioritization, and advanced filtering capabilities.

## Features

### Core Features
- **Custom Email Categories** - Create unlimited custom categories with colors and icons
- **AI-Powered Categorization** - Automatically categorize emails using Claude AI
- **Important Email Detection** - Identify and pin critical emails at the top
- **VIP Contact Management** - Flag and prioritize emails from important contacts
- **Spam & Phishing Detection** - Intelligent filtering of suspicious emails
- **Advanced Sweep Function** - Delete similar emails in bulk with AI similarity detection
- **Auto-Delete Stale Drafts** - Automatically clean up old draft emails

### Management Features
- Category management (create, edit, delete, organize)
- Auto-categorization rules (sender, subject, content-based)
- Category statistics and analytics
- Email filtering and sorting
- Bulk operations
- Manual email re-categorization

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Gmail API**: Official Google Gmail API with OAuth 2.0
- **AI**: Claude 3.5 Sonnet from Anthropic
- **Storage**: Local JSON files (privacy-first approach)
- **CLI**: Yargs-based command-line interface
- **Web**: Express.js (optional web dashboard)

## Installation

### Prerequisites
- Node.js 16+
- Google Cloud project with Gmail API enabled
- Anthropic API key for Claude AI

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd gmailHelper
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your credentials:
```bash
cp .env.example .env
```

4. Fill in the required environment variables:
   - `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` from Google Cloud Console
   - `ANTHROPIC_API_KEY` from Anthropic

5. Build the project:
```bash
npm run build
```

## Usage

### CLI Commands

#### Authentication
```bash
# Login to your Gmail account
npm run dev -- auth login

# Check authentication status
npm run dev -- auth status

# Logout
npm run dev -- auth logout
```

#### Email Synchronization
```bash
# Sync emails from the last 30 days
npm run dev -- sync

# Full sync of all recent emails
npm run dev -- sync --full

# Sync last 7 days
npm run dev -- sync --days=7
```

#### Category Management
```bash
# Create a new category
npm run dev -- category:create "Projects" --color=#FF5733

# List all categories
npm run dev -- category:list

# Edit a category
npm run dev -- category:edit <category-id> --name="Project Alpha"

# Delete a category
npm run dev -- category:delete <category-id>
```

#### Email Operations
```bash
# List emails (with optional filtering)
npm run dev -- email:list
npm run dev -- email:list --category=<id>
npm run dev -- email:list --priority=high

# Assign email to category
npm run dev -- email:assign <email-id> <category-id>

# Mark email as important
npm run dev -- email:flag-important <email-id>

# Report email as spam
npm run dev -- email:report-spam <email-id>
```

#### VIP Management
```bash
# Add VIP contact
npm run dev -- vip:add "John Doe" "john@example.com"

# List VIP contacts
npm run dev -- vip:list

# Remove VIP contact
npm run dev -- vip:remove "john@example.com"
```

#### Advanced Actions
```bash
# Analyze similar emails for sweep
npm run dev -- sweep:analyze

# Execute sweep (delete similar emails)
npm run dev -- sweep:execute --confirm

# Cleanup old drafts
npm run dev -- drafts:cleanup --days=30 --dry-run
```

## Configuration

The application stores configuration and data in `~/.gmailHelper/`:

```
~/.gmailHelper/
├── config.json           # App configuration
├── categories.json       # Custom categories
├── vipList.json          # VIP contacts
├── rules.json            # Email rules
├── tokens.json           # Encrypted OAuth tokens
└── cache/
    ├── emails.json       # Cached email metadata
    └── analysis.json     # AI analysis cache
```

### Default Categories
- Work
- Personal
- Finance
- Shopping
- Social
- Other

## Environment Variables

See `.env.example` for all available configuration options:

- `GMAIL_CLIENT_ID` - Google OAuth Client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth Client Secret
- `GMAIL_REDIRECT_URI` - OAuth redirect URI
- `ANTHROPIC_API_KEY` - Claude AI API key
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `ENABLE_AI` - Enable AI features
- `ENABLE_SPAM_DETECTION` - Enable spam detection
- `ENABLE_DRAFT_CLEANUP` - Enable draft cleanup
- `ENABLE_SWEEP` - Enable sweep functionality

## Development

### Build the project
```bash
npm run build
```

### Run in development mode
```bash
npm run dev
```

### Run tests
```bash
npm test
npm test:watch
```

### Linting and formatting
```bash
npm run lint
npm run format
```

## Architecture

The application uses a layered architecture:

```
CLI/Web Interface (src/cli, src/web)
         ↓
Business Logic (services/)
  - categorizer: Category assignment and rules
  - prioritizer: Importance detection
  - spamDetector: Spam/phishing detection
  - analyzer: AI-powered analysis
  - sweepEngine: Similarity detection
         ↓
Gmail Service (services/gmail)
  - OAuth authentication
  - Email fetching and syncing
         ↓
Storage Layer (services/storage)
  - File-based persistence
  - Category/VIP/Config management
         ↓
Data Models (models/)
  - Email, Category, VIP, Config types
```

## Security & Privacy

- **Tokens**: OAuth tokens are stored encrypted locally
- **Data Storage**: All data stored locally in `~/.gmailHelper/`
- **No Email Logging**: Email content is never logged or stored unnecessarily
- **API Credentials**: Never commit `.env` or credential files
- **Secure Defaults**: Sensitive files created with mode 0o700

## Performance

- **Caching**: Email metadata and AI analysis results are cached
- **Batch Processing**: Large email datasets processed in batches
- **Incremental Sync**: Only fetches modified emails after first sync
- **Rate Limiting**: Respects Gmail API quotas and Claude API limits

## Troubleshooting

### Authentication Issues
- Ensure Google Cloud project has Gmail API enabled
- Check OAuth credentials in `.env`
- Run `npm run dev -- auth login` again to re-authenticate

### API Rate Limiting
- Application automatically implements exponential backoff
- Check `LOG_LEVEL=debug` for detailed retry information

### Performance
- Check cache directory size in `~/.gmailHelper/cache/`
- Reduce `SYNC_INTERVAL_MINUTES` if syncing too frequently

## Contributing

Contributions are welcome! Please follow the TypeScript style guide and add tests for new features.

## License

MIT

## Support

For issues, questions, or suggestions, please open an issue in the repository.
