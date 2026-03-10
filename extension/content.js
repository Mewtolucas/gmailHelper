// Gmail Helper Content Script
// This injects the Gmail Helper UI directly into Gmail

let isInjected = false;

// Wait for Gmail to load
const checkGmailLoaded = setInterval(async () => {
  if (isGmailReady() && !isInjected) {
    injectGmailHelper();
    isInjected = true;
    clearInterval(checkGmailLoaded);
  }
}, 500);

function isGmailReady() {
  return (
    document.querySelector('[role="main"]') !== null &&
    document.querySelector('[data-email-address]') !== null
  );
}

function injectGmailHelper() {
  // Create sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'gmail-helper-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    right: 0;
    top: 56px;
    width: 350px;
    height: calc(100vh - 56px);
    background: white;
    border-left: 1px solid #ddd;
    box-shadow: -2px 0 8px rgba(0,0,0,0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    display: flex;
    flex-direction: column;
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 16px;
    border-bottom: 1px solid #eee;
    font-weight: 500;
    font-size: 14px;
  `;
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span>📧 Gmail Helper</span>
      <button id="gmail-helper-close" style="
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
      ">✕</button>
    </div>
  `;

  // Create content area
  const content = document.createElement('div');
  content.id = 'gmail-helper-content';
  content.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  `;

  // Create actions panel
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: grid;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #eee;
  `;

  actions.innerHTML = `
    <button id="btn-categorize" style="
      padding: 8px 12px;
      background: #1f71b8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">📂 Categorize</button>
    <button id="btn-important" style="
      padding: 8px 12px;
      background: #f1c40f;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">⭐ Mark Important</button>
    <button id="btn-spam" style="
      padding: 8px 12px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">🚫 Report Spam</button>
    <button id="btn-analyze" style="
      padding: 8px 12px;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">🔍 Analyze</button>
  `;

  sidebar.appendChild(header);
  sidebar.appendChild(content);
  sidebar.appendChild(actions);

  document.body.appendChild(sidebar);

  // Setup event listeners
  document.getElementById('gmail-helper-close').addEventListener('click', () => {
    sidebar.remove();
    isInjected = false;
  });

  document.getElementById('btn-categorize').addEventListener('click', () => {
    showCategorizePanel(content);
  });

  document.getElementById('btn-important').addEventListener('click', () => {
    flagCurrentEmailImportant();
  });

  document.getElementById('btn-spam').addEventListener('click', () => {
    reportCurrentEmailAsSpam();
  });

  document.getElementById('btn-analyze').addEventListener('click', () => {
    analyzeCurrentEmail();
  });

  // Load initial content
  loadCategoriesPanel(content);
}

function loadCategoriesPanel(container) {
  container.innerHTML = `
    <div style="padding: 8px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Categories</p>
      <div id="categories-list" style="display: grid; gap: 6px;">
        <div style="text-align: center; color: #999; font-size: 12px; padding: 12px;">
          Loading categories...
        </div>
      </div>
    </div>
  `;

  chrome.runtime.sendMessage({ action: 'getCategories' }, (response) => {
    if (response.success) {
      renderCategories(response.categories, container);
    }
  });
}

function renderCategories(categories, container) {
  const list = container.querySelector('#categories-list');
  list.innerHTML = '';

  if (categories.length === 0) {
    list.innerHTML = '<div style="color: #999; font-size: 12px;">No categories yet</div>';
    return;
  }

  categories.forEach(cat => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      background: ${cat.color}20;
      border-left: 3px solid ${cat.color};
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
    `;
    item.textContent = `${cat.icon} ${cat.name}`;
    item.addEventListener('click', () => {
      const emailId = getCurrentEmailId();
      if (emailId) {
        chrome.runtime.sendMessage({
          action: 'categorizeEmail',
          emailId,
          categoryId: cat.id
        }, () => {
          showNotification('Email categorized!');
        });
      }
    });
    list.appendChild(item);
  });
}

function showCategorizePanel(container) {
  loadCategoriesPanel(container);
}

function flagCurrentEmailImportant() {
  const emailId = getCurrentEmailId();
  if (emailId) {
    chrome.runtime.sendMessage({
      action: 'flagImportant',
      emailId
    }, () => {
      showNotification('Email marked as important!');
    });
  }
}

function reportCurrentEmailAsSpam() {
  const emailId = getCurrentEmailId();
  if (emailId) {
    if (confirm('Report this email as spam?')) {
      chrome.runtime.sendMessage({
        action: 'reportSpam',
        emailId
      }, () => {
        showNotification('Email reported as spam');
      });
    }
  }
}

function analyzeCurrentEmail() {
  const emailId = getCurrentEmailId();
  if (emailId) {
    const container = document.getElementById('gmail-helper-content');
    container.innerHTML = '<div style="padding: 12px; color: #999; font-size: 12px;">Analyzing email...</div>';

    chrome.runtime.sendMessage({
      action: 'analyzeEmail',
      emailId
    }, (response) => {
      if (response.success && response.analysis) {
        const analysis = response.analysis;
        container.innerHTML = `
          <div style="padding: 8px 0; font-size: 13px;">
            <p style="margin: 0 0 8px 0; font-weight: 500;">Analysis Results</p>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
              <p style="margin: 4px 0;"><strong>Category:</strong> ${analysis.category?.name || 'Uncategorized'}</p>
              <p style="margin: 4px 0;"><strong>Priority:</strong> ${analysis.isPriority ? 'High' : 'Normal'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                ${new Date(analysis.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        `;
      }
    });
  }
}

function getCurrentEmailId() {
  // Extract email ID from Gmail URL
  const url = window.location.href;
  const match = url.match(/[?&]messageId=([^&]+)/);
  return match ? match[1] : null;
}

function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
