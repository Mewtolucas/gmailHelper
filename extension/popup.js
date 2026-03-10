// Gmail Helper Popup Script

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

async function initializePopup() {
  // Check authentication status
  const authenticated = await checkAuthentication();

  // Update UI based on auth status
  const statusEl = document.getElementById('status');
  const authSection = document.getElementById('auth-section');
  const mainSection = document.getElementById('main-section');
  const loginBtn = document.getElementById('login-btn');

  if (authenticated) {
    statusEl.textContent = '✓ Authenticated';
    statusEl.className = 'status authenticated';
    authSection.style.display = 'none';
    mainSection.style.display = 'block';

    // Load categories
    loadCategories();

    // Setup event listeners
    document.getElementById('create-category-btn').addEventListener('click', createNewCategory);
    document.getElementById('sync-btn').addEventListener('click', syncEmails);
    document.getElementById('logout-btn').addEventListener('click', logout);
  } else {
    statusEl.textContent = '✗ Not authenticated';
    statusEl.className = 'status unauthenticated';
    authSection.style.display = 'block';
    mainSection.style.display = 'none';

    loginBtn.addEventListener('click', login);
  }
}

async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
      resolve(response.authenticated);
    });
  });
}

function login() {
  chrome.runtime.sendMessage({ action: 'login' }, (response) => {
    if (response.success && response.authUrl) {
      chrome.tabs.create({ url: response.authUrl });
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  });
}

function logout() {
  chrome.runtime.sendMessage({ action: 'logout' }, () => {
    location.reload();
  });
}

function loadCategories() {
  const container = document.getElementById('categories-container');
  container.innerHTML = '<div class="loading">Loading categories...</div>';

  chrome.runtime.sendMessage({ action: 'getCategories' }, (response) => {
    if (response.success) {
      renderCategories(response.categories);
    }
  });
}

function renderCategories(categories) {
  const container = document.getElementById('categories-container');

  if (categories.length === 0) {
    container.innerHTML = '<div class="loading">No categories yet. Create one below!</div>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'categories-grid';

  categories.forEach(category => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.style.borderColor = category.color;
    item.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 4px;">${category.icon}</div>
      <div>${category.name}</div>
    `;
    grid.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}

function createNewCategory() {
  const name = document.getElementById('category-name').value.trim();
  const color = document.getElementById('category-color').value;

  if (!name) {
    alert('Please enter a category name');
    return;
  }

  chrome.runtime.sendMessage({
    action: 'createCategory',
    data: {
      name,
      color,
      icon: '📁'
    }
  }, (response) => {
    if (response.success) {
      document.getElementById('category-name').value = '';
      loadCategories();
    }
  });
}

function syncEmails() {
  const btn = document.getElementById('sync-btn');
  btn.disabled = true;
  btn.textContent = '🔄 Syncing...';

  chrome.runtime.sendMessage({ action: 'syncEmails', days: 30 }, () => {
    btn.disabled = false;
    btn.textContent = '🔄 Sync Emails';
    alert('Sync started in the background');
  });
}
