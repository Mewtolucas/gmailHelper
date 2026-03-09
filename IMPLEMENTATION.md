# Gmail Helper - Complete Implementation Guide

## 📋 Overview

Gmail Helper is a comprehensive email management system built with Node.js, TypeScript, and Claude AI. It provides intelligent email categorization, prioritization, spam detection, and advanced management features through both CLI and programmatic APIs.

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│        CLI Interface (yargs)         │
│  auth, sync, category, vip, email   │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Business Logic Services         │
│  • Categorizer (rule engine)        │
│  • Prioritizer (importance)         │
│  • SpamDetector (phishing)          │
│  • SweepEngine (similarity)         │
│  • DraftManager (cleanup)           │
│  • AIAnalyzer (Claude)              │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      Gmail Service Layer            │
│  • GmailClient (API wrapper)        │
│  • EmailFetcher (sync & cache)      │
│  • OAuthHandler (auth)              │
│  • TokenManager (persistence)       │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      Storage Layer (FileStore)      │
│  • CategoryStore (categories)       │
│  • VIPListStore (contacts)          │
│  • ConfigStore (settings)           │
│  • File-based persistence           │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│    Utilities & Configuration        │
│  • Logger (structured logging)      │
│  • Helpers (file I/O, validation)   │
│  • Environment config               │
│  • Constants & defaults             │
└─────────────────────────────────────┘
```

## 📦 Core Services

### 1. Authentication (`src/auth/`)

**OAuthHandler** - Manages OAuth 2.0 flow
- Generate authorization URLs
- Exchange auth codes for tokens
- Refresh access tokens
- Manage OAuth2 client instance

**TokenManager** - Secure token persistence
- Save tokens to encrypted files
- Auto-detect token expiration
- Refresh on demand
- Graceful logout

### 2. Gmail Integration (`src/services/gmail/`)

**GmailClient** - Authenticated API wrapper
```typescript
// Fetch emails with retry logic
await gmailClient.fetchEmails({ query: 'newer_than:3d', maxResults: 100 })

// Get full message details
const message = await gmailClient.getEmail(messageId)

// Modify labels
await gmailClient.modifyEmail(messageId, { addLabelIds: [labelId] })

// Get user profile
const profile = await gmailClient.getProfile()
```

**EmailFetcher** - Smart email synchronization
```typescript
// Full sync (first run)
const emails = await fetcher.fullSync(days: 30)

// Incremental sync (subsequent runs)
const newEmails = await fetcher.incrementalSync()

// Get cached emails
const cached = fetcher.getEmailCache()
```

### 3. Storage Layer (`src/services/storage/`)

**FileStore** - Generic file-based persistence
- CRUD operations
- Atomic writes with backups
- In-memory caching
- Data validation

**CategoryStore** - Manage email categories
```typescript
// Create category
const cat = categoryStore.create({
  name: 'Projects',
  color: '#FF5733',
  rules: [],
  autoApply: true
})

// List categories
const categories = categoryStore.getSortedCategories()

// Update category
categoryStore.rename(categoryId, 'New Name')
```

**VIPListStore** - Manage important contacts
```typescript
// Add VIP contact
vipStore.add('boss@company.com', 'CEO', 'vip')

// Check if VIP
const isVIP = vipStore.isVIP('boss@company.com')

// Search contacts
const results = vipStore.search('boss')
```

**ConfigStore** - Application settings
```typescript
// Get config
const config = configStore.getConfig()

// Update settings
configStore.setFeaturesConfig({ enableAI: true })

// Validate configuration
const isValid = configStore.validate()
```

### 4. Email Services (`src/services/email/`)

**Categorizer** - Rule-based email categorization
```typescript
// Categorize email based on rules
const categoryId = categorizer.categorizeEmail(email)

// Bulk categorization
const count = categorizer.bulkCategorize(emails)

// Get statistics
const stats = categorizer.getStatistics(emails)
// { 'Work': 45, 'Personal': 23, 'Uncategorized': 12 }
```

Rules support:
- Sender patterns (with wildcards)
- Subject keywords
- Body content matching
- Attachment presence
- Date ranges
- AND/OR logic

**Prioritizer** - Importance detection
```typescript
// Calculate importance score
const score = prioritizer.calculateImportanceScore(email)
// Returns 0-100

// Assign priority level
prioritizer.assignPriority(email)
// Sets: critical, high, medium, or low

// Sort by importance
const sorted = prioritizer.sortByImportance(emails)
// Pinned → Important → VIP → Critical → High → Medium → Low

// Get important emails
const important = prioritizer.getImportantEmails(emails)
```

Considers:
- VIP sender status (30 pts)
- Urgency keywords (25 pts)
- Direct recipient (15 pts)
- Attachments (10 pts)
- Subject quality (10 pts)

**SpamDetector** - Spam/phishing detection
```typescript
// Detect spam
const spamScore = spamDetector.detectSpam(email) // 0-100

// Detect phishing
const phishingScore = spamDetector.detectPhishing(email) // 0-100

// Bulk detection
spamDetector.bulkDetect(emails)

// Get statistics
const stats = spamDetector.getStatistics(emails)
// { spam: 5, phishing: 2, safe: 93 }
```

**SweepEngine** - Similarity-based email grouping
```typescript
// Find similar emails
const similar = sweep.findSimilarEmails(sourceEmail, allEmails, threshold: 70)
// Returns emails with similarity scores

// Group similar emails
const groups = sweep.groupSimilarEmails(emails, threshold: 70)
// Returns arrays of similar emails grouped together

// Detect duplicates
const isDuplicate = sweep.isDuplicate(email1, email2)

// Suggest deletion
const toDelete = sweep.suggestForDeletion(similar, 'keep-newest')
```

Similarity factors:
- Exact sender match (40 pts)
- Subject similarity (30 pts)
- Category match (20 pts)
- Keywords (10 pts)

**DraftManager** - Draft email handling
```typescript
// Find stale drafts
const stale = draftManager.findStaleDrafts(emails, maxAgeInDays: 30)

// Get draft statistics
const stats = draftManager.getStatistics(emails)
// { totalDrafts: 10, recentDrafts: 3, staleDrafts: 7, avgAge: 42 }

// Get cleanup suggestion
const suggestion = draftManager.getCleanupSuggestion(emails, 30)
// { toDelete: [...], reason: 'Found 7 drafts older than 30 days' }

// Group by subject
const groups = draftManager.groupBySubject(emails)
```

### 5. AI Analysis (`src/services/ai/`)

**AIAnalyzer** - Claude-powered email intelligence
```typescript
// Suggest category
const analysis = await analyzer.suggestCategory(email, categories)
// { categoryName: 'Projects', confidence: 85, reasoning: '...' }

// Analyze importance
const score = await analyzer.analyzeImportance(email) // 0-100

// Detect spam/phishing
const threats = await analyzer.detectSpamPhishing(email)
// { spamScore: 20, phishingScore: 15 }

// Extract keywords
const keywords = await analyzer.extractKeywords(email)
// ['deadline', 'project', 'urgent']

// Clear old cache
analyzer.clearOldCache(maxAgeHours: 24)
```

Features:
- Claude 3.5 Sonnet integration
- Result caching for cost/performance
- Graceful API error handling
- Configurable cache expiration

## 🎮 CLI Commands

### Authentication
```bash
# Login to Gmail
npm run dev -- auth login

# Check status
npm run dev -- auth status

# Logout
npm run dev -- auth logout
```

### Synchronization
```bash
# Incremental sync (recommended)
npm run dev -- sync

# Full sync (last 30 days)
npm run dev -- sync --full

# Custom date range
npm run dev -- sync --full --days=60
```

### Category Management
```bash
# Create category
npm run dev -- category create "Projects" --color="#FF5733"

# List categories
npm run dev -- category list

# Delete category
npm run dev -- category delete <category-id>
```

### VIP Contacts
```bash
# Add VIP contact
npm run dev -- vip add "boss@company.com" "CEO" --priority=vip

# List VIP contacts
npm run dev -- vip list

# Remove VIP contact
npm run dev -- vip remove "boss@company.com"
```

### Email Operations
```bash
# List emails with filters
npm run dev -- email list --limit=20
npm run dev -- email list --category=<id>
npm run dev -- email list --priority=high
npm run dev -- email list --vip
npm run dev -- email list --important

# Show statistics
npm run dev -- email stats
```

## 📊 Data Models

### Email
```typescript
{
  id: string,                          // Gmail message ID
  threadId: string,                    // Gmail thread ID
  from: string,                        // Sender email
  to: string[],                        // Recipients
  subject: string,                     // Subject line
  body: string,                        // Full email body
  snippet: string,                     // Preview text
  date: Date,                          // Received date
  category?: string,                   // Category ID
  priority: 'low' | 'medium' | 'high' | 'critical',
  isImportant: boolean,                // User marked important
  isPinned: boolean,                   // Pinned to top
  isVIP: boolean,                      // From VIP contact
  isSpam: boolean,                     // Spam detected
  isPhishing: boolean,                 // Phishing detected
  isDraft: boolean,                    // Draft status
  hasAttachments: boolean,             // Has files
  analysisMetadata?: {
    aiCategory?: string,
    confidence?: number,
    spamScore?: number,
    phishingScore?: number
  }
}
```

### Category
```typescript
{
  id: string,
  name: string,                        // e.g., "Projects"
  color: string,                       // Hex color "#FF5733"
  icon?: string,                       // Optional emoji
  description?: string,
  rules: CategoryRule[],               // Auto-apply rules
  autoApply: boolean,                  // Enable auto-categorization
  priority: number                     // Display order
}
```

### VIPContact
```typescript
{
  id: string,
  email: string,
  name: string,
  priority: 'vip' | 'important' | 'normal',
  tags?: string[],
  notifyOnEmail: boolean
}
```

## 🗄️ File Structure

```
~/.gmailHelper/
├── config.json              # App configuration
├── categories.json          # Custom categories (with rules)
├── vipList.json            # VIP contacts
├── tokens.json             # OAuth tokens (encrypted)
└── cache/
    ├── emails.json         # Cached email metadata
    ├── analysis.json       # AI analysis cache
    └── sync-metadata.json  # Last sync info
```

## 🔒 Security

- OAuth tokens stored securely locally
- File operations atomic (write to temp, then rename)
- Automatic backups before modifications
- No email content logged
- Encrypted token storage
- Configuration validation
- Error messages don't expose sensitive data

## ⚡ Performance

- **Caching**: Email metadata and AI results cached locally
- **Batch Processing**: Emails processed in batches to avoid API limits
- **Incremental Sync**: Only fetches modified emails after first run
- **Exponential Backoff**: Automatic retry on API rate limiting
- **Memory Efficient**: In-memory cache with LRU eviction

## 🧪 Testing & Quality

Ready for:
- Unit tests (Jest configuration included)
- Integration tests with mock Gmail API
- E2E CLI testing
- Performance benchmarks

## 🛠️ Extension Points

### Add New Service
```typescript
// Extend FileStore for custom data
export class CustomStore extends FileStore<CustomItem> {
  constructor() {
    super('custom.json')
  }

  customMethod(): void {
    // Implementation
  }
}
```

### Add New CLI Command
```typescript
// Add to yargs in src/cli/index.ts
.command('custom', 'Custom command', customCommand)
```

### Add New Rule Type
```typescript
// Extend Categorizer.ruleMatches()
// Add new condition types to CategoryRule
```

## 📈 Usage Examples

### Complete Email Processing Pipeline
```typescript
// 1. Authenticate
const gmailClient = new GmailClient(config.gmail)
await gmailClient.handleAuthCallback(authCode)

// 2. Sync emails
const fetcher = new EmailFetcher(gmailClient)
const emails = await fetcher.fullSync(30)

// 3. Categorize
const categorizer = new Categorizer(categoryStore)
categorizer.bulkCategorize(emails)

// 4. Prioritize
const prioritizer = new Prioritizer(vipStore)
prioritizer.bulkPrioritize(emails)

// 5. Detect threats
const detector = new SpamDetector()
detector.bulkDetect(emails)

// 6. Sort and display
const sorted = prioritizer.sortByImportance(emails)
for (const email of sorted.slice(0, 10)) {
  console.log(`${email.priority}: ${email.subject}`)
}
```

### Find and Sweep Duplicates
```typescript
const sweep = new SweepEngine()
const groups = sweep.groupSimilarEmails(emails, threshold: 85)

for (const group of groups) {
  const toDelete = sweep.suggestForDeletion(
    group.map(e => ({ email: e, score: 100 })),
    'keep-newest'
  )
  console.log(`Sweeping ${toDelete.length} duplicates...`)
}
```

### Clean Up Old Drafts
```typescript
const drafts = new DraftManager()
const stale = drafts.findStaleDrafts(emails, 30)

console.log(`Found ${stale.length} stale drafts older than 30 days`)
for (const draft of stale) {
  console.log(`  - ${draft.email.subject} (${draft.ageInDays} days old)`)
}
```

## 🚀 Next Steps

1. **Implement Tests**
   - Unit tests for each service
   - Mock Gmail API responses
   - Test rule engine combinations

2. **Add Web Dashboard**
   - React frontend for visualization
   - Real-time email display
   - Drag-and-drop categorization

3. **Enhance AI Analysis**
   - Fine-tune Claude prompts
   - Add email thread analysis
   - Implement custom training

4. **Add More Features**
   - Email templates
   - Scheduled actions
   - Email forwarding rules
   - Bulk operations
   - Export/backup functionality

5. **Performance Optimization**
   - Database instead of JSON files
   - Advanced caching strategies
   - Async email processing
   - Message queuing

## 📝 Commit History

1. **Phase 1**: Project structure & models
2. **Phase 2**: Gmail API & OAuth
3. **Phase 3**: Storage layer
4. **Phase 4-5**: Categorization & assignment
5. **Phase 6**: AI analysis (Claude)
6. **Phase 7**: Prioritization & VIP detection
7. **Phase 8**: CLI interface
8. **Phase 9-10**: Advanced features & documentation

## 📄 License

MIT

## 📞 Support

For issues or questions about the implementation:
- Check README.md for setup instructions
- Review specific service documentation
- Check logs with `DEBUG=true LOG_LEVEL=debug`
