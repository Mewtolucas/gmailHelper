/**
 * Gmail Helper Add-on for Google Apps Script
 * Install: Apps Script > New Project > Copy this code > Deploy as Add-on
 */

// Configuration
const CONFIG = {
  CATEGORIES: {
    'Work': '#FF6B6B',
    'Personal': '#4ECDC4',
    'Shopping': '#FFE66D',
    'Finance': '#95E1D3',
    'Social': '#FF7675',
    'Projects': '#74B9FF'
  },
  PRIORITY_COLORS: {
    'critical': '#E74C3C',
    'high': '#F39C12',
    'medium': '#F1C40F',
    'low': '#95A5A6'
  },
  VIP_CONTACTS: [
    // Users add these through the UI
  ]
};

/**
 * Main entry point - triggered by Gmail add-on
 */
function onOpen(e) {
  // For Gmail add-ons, the menu is handled automatically by Google
  // Just initialize when the add-on loads
  Logger.log('Gmail Helper Add-on loaded');
}

/**
 * Show main sidebar
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutput(getSidebarHtml())
    .setWidth(350)
    .setHeight(600);

  GmailApp.getAddonMenu().addToUi();
  DocumentApp.getUi().showModelessDialog(html, '📧 Gmail Helper');
}

/**
 * Get sidebar HTML
 */
function getSidebarHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          padding: 0;
        }
        .container {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .tabs {
          display: flex;
          border-bottom: 2px solid #ddd;
          background: white;
        }
        .tab-button {
          flex: 1;
          padding: 12px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }
        .tab-button.active {
          color: #1f73e6;
          border-bottom-color: #1f73e6;
        }
        .tab-button:hover {
          background: #f9f9f9;
        }
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .tab-pane {
          display: none;
        }
        .tab-pane.active {
          display: block;
        }

        /* Email Display */
        .email-item {
          background: white;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          border-left: 4px solid #ddd;
          cursor: pointer;
          transition: all 0.2s;
        }
        .email-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .email-item.critical { border-left-color: #E74C3C; }
        .email-item.high { border-left-color: #F39C12; }
        .email-item.medium { border-left-color: #F1C40F; }
        .email-item.low { border-left-color: #95A5A6; }

        .email-subject {
          font-weight: 600;
          color: #333;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .email-from {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
        }
        .email-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .badge {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          background: #f0f0f0;
          color: #666;
        }
        .badge.priority {
          background: #fef5e7;
          color: #d68910;
        }
        .badge.vip {
          background: #fdeef4;
          color: #d63031;
        }
        .badge.category {
          background: #e8f5e9;
          color: #2e7d32;
        }

        /* Category Selector */
        .category-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .category-btn {
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .category-btn:hover {
          border-color: #1f73e6;
          background: #f0f7ff;
        }
        .category-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 3px;
          margin-right: 6px;
        }

        /* VIP List */
        .vip-item {
          padding: 10px;
          background: white;
          border-radius: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .vip-email {
          font-size: 12px;
          color: #666;
        }
        .vip-name {
          font-weight: 600;
          color: #d63031;
        }
        .btn-remove {
          background: #fff5f5;
          color: #d63031;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        /* Stats */
        .stat-card {
          background: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f73e6;
        }

        /* Controls */
        .controls {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: #1f73e6;
          color: white;
          cursor: pointer;
          font-weight: 500;
          font-size: 12px;
          transition: all 0.2s;
        }
        .btn:hover {
          background: #1557b0;
        }
        .btn.secondary {
          background: #f0f0f0;
          color: #333;
        }
        .btn.secondary:hover {
          background: #ddd;
        }

        .loading {
          text-align: center;
          color: #666;
          padding: 20px;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1f73e6;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin: 10px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="tabs">
          <button class="tab-button active" onclick="switchTab('inbox')">📧 Inbox</button>
          <button class="tab-button" onclick="switchTab('categorize')">📂 Categorize</button>
          <button class="tab-button" onclick="switchTab('vip')">⭐ VIP</button>
          <button class="tab-button" onclick="switchTab('stats')">📊 Stats</button>
        </div>

        <div class="content">
          <!-- Inbox Tab -->
          <div id="inbox" class="tab-pane active">
            <div class="controls">
              <button class="btn" onclick="loadImportantEmails()">Load Important</button>
              <button class="btn secondary" onclick="loadAllEmails()">Load All</button>
            </div>
            <div id="inbox-list" class="loading">
              <div class="spinner"></div>
              <p>Click "Load Important" to see emails</p>
            </div>
          </div>

          <!-- Categorize Tab -->
          <div id="categorize" class="tab-pane">
            <p style="font-size: 12px; color: #666; margin-bottom: 12px;">
              Select an email first, then choose a category below
            </p>
            <div class="category-grid" id="category-grid">
              <!-- Populated by JavaScript -->
            </div>
          </div>

          <!-- VIP Tab -->
          <div id="vip" class="tab-pane">
            <div class="controls">
              <button class="btn" onclick="addCurrentAsVIP()">Add Current Email Sender as VIP</button>
            </div>
            <div id="vip-list">
              <!-- Populated by JavaScript -->
            </div>
          </div>

          <!-- Stats Tab -->
          <div id="stats" class="tab-pane">
            <div class="controls">
              <button class="btn" onclick="loadStatistics()">Load Statistics</button>
            </div>
            <div id="stats-content">
              <!-- Populated by JavaScript -->
            </div>
          </div>
        </div>
      </div>

      <script>
        // Tab switching
        function switchTab(tabName) {
          document.querySelectorAll('.tab-pane').forEach(el => {
            el.classList.remove('active');
          });
          document.querySelectorAll('.tab-button').forEach(el => {
            el.classList.remove('active');
          });
          document.getElementById(tabName).classList.add('active');
          event.target.classList.add('active');

          if (tabName === 'categorize') populateCategories();
          if (tabName === 'vip') loadVIPList();
        }

        // Load important emails
        function loadImportantEmails() {
          const list = document.getElementById('inbox-list');
          list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

          google.script.run.withSuccessHandler(displayEmails)
            .withFailureHandler(error => {
              list.innerHTML = '<p style="color: red;">Error: ' + error + '</p>';
            })
            .getImportantEmails();
        }

        // Load all emails
        function loadAllEmails() {
          const list = document.getElementById('inbox-list');
          list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

          google.script.run.withSuccessHandler(displayEmails)
            .withFailureHandler(error => {
              list.innerHTML = '<p style="color: red;">Error: ' + error + '</p>';
            })
            .getAllEmails();
        }

        // Display emails
        function displayEmails(emails) {
          const list = document.getElementById('inbox-list');

          if (!emails || emails.length === 0) {
            list.innerHTML = '<p style="color: #999;">No emails found</p>';
            return;
          }

          list.innerHTML = emails.map(email => \`
            <div class="email-item \${email.priority}" onclick="selectEmail('\${email.id}')">
              <div class="email-subject">\${escapeHtml(email.subject)}</div>
              <div class="email-from">\${escapeHtml(email.from)}</div>
              <div class="email-meta">
                <span class="badge priority">\${email.priority}</span>
                \${email.isVIP ? '<span class="badge vip">⭐ VIP</span>' : ''}
                \${email.category ? '<span class="badge category">' + escapeHtml(email.category) + '</span>' : ''}
              </div>
            </div>
          \`).join('');
        }

        // Populate categories
        function populateCategories() {
          google.script.run.withSuccessHandler(categories => {
            const grid = document.getElementById('category-grid');
            grid.innerHTML = Object.entries(categories).map(([name, color]) => \`
              <button class="category-btn" onclick="categorizeEmail('\${name}')">
                <span class="category-color" style="background: \${color}"></span>
                \${name}
              </button>
            \`).join('');
          }).getCategories();
        }

        // Categorize email
        function categorizeEmail(categoryName) {
          google.script.run.withSuccessHandler(() => {
            alert('Email categorized as: ' + categoryName);
          }).addCategoryToEmail(categoryName);
        }

        // Add current email sender as VIP
        function addCurrentAsVIP() {
          google.script.run.withSuccessHandler(() => {
            alert('Added to VIP contacts!');
            loadVIPList();
          }).addSenderAsVIP();
        }

        // Load VIP list
        function loadVIPList() {
          google.script.run.withSuccessHandler(vipList => {
            const container = document.getElementById('vip-list');

            if (!vipList || vipList.length === 0) {
              container.innerHTML = '<p style="color: #999;">No VIP contacts yet</p>';
              return;
            }

            container.innerHTML = vipList.map(contact => \`
              <div class="vip-item">
                <div>
                  <div class="vip-name">⭐ \${escapeHtml(contact.name)}</div>
                  <div class="vip-email">\${escapeHtml(contact.email)}</div>
                </div>
                <button class="btn-remove" onclick="removeVIP('\${contact.email}')">Remove</button>
              </div>
            \`).join('');
          }).getVIPContacts();
        }

        // Remove VIP contact
        function removeVIP(email) {
          if (confirm('Remove ' + email + ' from VIP?')) {
            google.script.run.withSuccessHandler(() => {
              loadVIPList();
            }).removeVIPContact(email);
          }
        }

        // Load statistics
        function loadStatistics() {
          google.script.run.withSuccessHandler(stats => {
            const container = document.getElementById('stats-content');
            container.innerHTML = \`
              <div class="stat-card">
                <div class="stat-label">📧 Total Emails in Thread</div>
                <div class="stat-value">\${stats.totalEmails}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">⚠️ Important Emails</div>
                <div class="stat-value">\${stats.importantEmails}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">⭐ VIP Senders</div>
                <div class="stat-value">\${stats.vipSenders}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">🚨 Spam/Phishing Detected</div>
                <div class="stat-value">\${stats.suspiciousEmails}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">📂 Categories Applied</div>
                <div class="stat-value">\${stats.categorizedEmails}</div>
              </div>
            \`;
          }).getStatistics();
        }

        // Helper: Select email for operations
        function selectEmail(emailId) {
          google.script.run.selectEmail(emailId);
        }

        // Helper: Escape HTML
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        // Initialize
        window.onload = function() {
          populateCategories();
        };
      </script>
    </body>
    </html>
  `;
}

/**
 * Get important emails from current thread/user's mailbox
 */
function getImportantEmails() {
  try {
    const user = Session.getActiveUser();
    const threads = GmailApp.search('is:important OR from:(' + CONFIG.VIP_CONTACTS.join(' OR ') + ')', 0, 10);

    const emails = [];
    for (const thread of threads) {
      const messages = thread.getMessages();
      for (const message of messages) {
        emails.push({
          id: message.getId(),
          subject: message.getSubject(),
          from: message.getFrom(),
          date: message.getDate(),
          priority: calculatePriority(message),
          isVIP: isFromVIP(message.getFrom()),
          category: getCategory(message),
          snippet: message.getPlainBody().substring(0, 50)
        });
      }
    }

    return emails.slice(0, 15);
  } catch (e) {
    Logger.log('Error: ' + e);
    return [];
  }
}

/**
 * Get all emails from current thread
 */
function getAllEmails() {
  try {
    const threads = GmailApp.getInboxThreads(0, 10);
    const emails = [];

    for (const thread of threads) {
      const messages = thread.getMessages();
      for (const message of messages) {
        emails.push({
          id: message.getId(),
          subject: message.getSubject(),
          from: message.getFrom(),
          date: message.getDate(),
          priority: calculatePriority(message),
          isVIP: isFromVIP(message.getFrom()),
          category: getCategory(message),
          snippet: message.getPlainBody().substring(0, 50)
        });
      }
    }

    return emails;
  } catch (e) {
    Logger.log('Error: ' + e);
    return [];
  }
}

/**
 * Calculate email priority
 */
function calculatePriority(message) {
  let score = 0;
  const subject = message.getSubject().toLowerCase();
  const body = message.getPlainBody().toLowerCase();

  // Urgency keywords
  const urgentKeywords = ['urgent', 'asap', 'critical', 'important', 'action required', 'deadline'];
  for (const keyword of urgentKeywords) {
    if (subject.includes(keyword) || body.includes(keyword)) {
      score += 20;
    }
  }

  // Has attachments
  if (message.getAttachments().length > 0) {
    score += 15;
  }

  // From VIP
  if (isFromVIP(message.getFrom())) {
    score += 30;
  }

  if (score >= 50) return 'critical';
  if (score >= 30) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

/**
 * Check if email is from VIP
 */
function isFromVIP(sender) {
  return CONFIG.VIP_CONTACTS.some(vip => sender.includes(vip));
}

/**
 * Get category for message
 */
function getCategory(message) {
  const labels = message.getLabels();
  for (const label of labels) {
    const name = label.getName();
    if (CONFIG.CATEGORIES[name]) {
      return name;
    }
  }
  return null;
}

/**
 * Add category to current message
 */
function addCategoryToEmail(categoryName) {
  try {
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) return;

    const messages = threads[0].getMessages();
    const message = messages[messages.length - 1];

    let label = GmailApp.getUserLabelByName(categoryName);
    if (!label) {
      label = GmailApp.createLabel(categoryName);
    }

    message.addLabel(label);
    message.star();
  } catch (e) {
    Logger.log('Error: ' + e);
  }
}

/**
 * Get categories
 */
function getCategories() {
  return CONFIG.CATEGORIES;
}

/**
 * Add sender as VIP
 */
function addSenderAsVIP() {
  try {
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) return;

    const messages = threads[0].getMessages();
    const message = messages[messages.length - 1];
    const sender = message.getFrom();

    if (!CONFIG.VIP_CONTACTS.includes(sender)) {
      CONFIG.VIP_CONTACTS.push(sender);
      PropertiesService.getUserProperties().setProperty('VIP_CONTACTS', JSON.stringify(CONFIG.VIP_CONTACTS));
    }
  } catch (e) {
    Logger.log('Error: ' + e);
  }
}

/**
 * Get VIP contacts
 */
function getVIPContacts() {
  const stored = PropertiesService.getUserProperties().getProperty('VIP_CONTACTS');
  if (stored) {
    CONFIG.VIP_CONTACTS = JSON.parse(stored);
  }

  return CONFIG.VIP_CONTACTS.map((email, index) => ({
    name: email.split('@')[0],
    email: email
  }));
}

/**
 * Remove VIP contact
 */
function removeVIPContact(email) {
  CONFIG.VIP_CONTACTS = CONFIG.VIP_CONTACTS.filter(e => e !== email);
  PropertiesService.getUserProperties().setProperty('VIP_CONTACTS', JSON.stringify(CONFIG.VIP_CONTACTS));
}

/**
 * Get statistics
 */
function getStatistics() {
  const threads = GmailApp.getInboxThreads(0, 100);
  let totalEmails = 0;
  let importantEmails = 0;
  let vipSenders = 0;
  let suspiciousEmails = 0;
  let categorizedEmails = 0;

  for (const thread of threads) {
    const messages = thread.getMessages();
    totalEmails += messages.length;

    for (const message of messages) {
      if (message.isStarred()) importantEmails++;
      if (isFromVIP(message.getFrom())) vipSenders++;
      if (message.isSpam()) suspiciousEmails++;
      if (message.getLabels().length > 0) categorizedEmails++;
    }
  }

  return {
    totalEmails,
    importantEmails,
    vipSenders,
    suspiciousEmails,
    categorizedEmails
  };
}

/**
 * Select email for current operations
 */
function selectEmail(emailId) {
  // Store selected email ID for operations
  PropertiesService.getUserProperties().setProperty('SELECTED_EMAIL_ID', emailId);
}

/**
 * Mark as VIP (menu item)
 */
function markAsVIP() {
  try {
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) {
      GmailApp.alert('No email selected');
      return;
    }

    const messages = threads[0].getMessages();
    const message = messages[messages.length - 1];
    const sender = message.getFrom();

    if (!CONFIG.VIP_CONTACTS.includes(sender)) {
      CONFIG.VIP_CONTACTS.push(sender);
      PropertiesService.getUserProperties().setProperty('VIP_CONTACTS', JSON.stringify(CONFIG.VIP_CONTACTS));
    }

    GmailApp.alert('✅ Added to VIP: ' + sender);
  } catch (e) {
    GmailApp.alert('❌ Error: ' + e);
  }
}

/**
 * Pin email (menu item)
 */
function pinEmail() {
  try {
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) {
      GmailApp.alert('No email selected');
      return;
    }

    const message = threads[0].getMessages()[threads[0].getMessageCount() - 1];
    message.star();
    GmailApp.alert('✅ Email pinned!');
  } catch (e) {
    GmailApp.alert('❌ Error: ' + e);
  }
}

/**
 * Mark important (menu item)
 */
function markImportant() {
  try {
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) {
      GmailApp.alert('No email selected');
      return;
    }

    const message = threads[0].getMessages()[threads[0].getMessageCount() - 1];
    message.markImportant();
    GmailApp.alert('✅ Marked as important!');
  } catch (e) {
    GmailApp.alert('❌ Error: ' + e);
  }
}
