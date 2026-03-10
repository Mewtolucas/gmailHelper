// Gmail Helper Background Service Worker
const API_BASE = 'http://localhost:3000/api';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gmail Helper extension installed');
  chrome.storage.local.set({
    apiBase: API_BASE,
    authenticated: false,
    categories: [],
    vipList: []
  });
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Allow async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'checkAuth':
        const authStatus = await checkAuthentication();
        sendResponse({ success: true, authenticated: authStatus });
        break;

      case 'login':
        const loginUrl = await getLoginUrl();
        sendResponse({ success: true, authUrl: loginUrl });
        break;

      case 'logout':
        await logout();
        sendResponse({ success: true });
        break;

      case 'getCategories':
        const categories = await fetchCategories();
        sendResponse({ success: true, categories });
        break;

      case 'createCategory':
        const newCategory = await createCategory(request.data);
        sendResponse({ success: true, category: newCategory });
        break;

      case 'categorizeEmail':
        await categorizeEmail(request.emailId, request.categoryId);
        sendResponse({ success: true });
        break;

      case 'flagImportant':
        await flagEmailImportant(request.emailId);
        sendResponse({ success: true });
        break;

      case 'reportSpam':
        await reportSpam(request.emailId);
        sendResponse({ success: true });
        break;

      case 'analyzeEmail':
        const analysis = await analyzeEmail(request.emailId);
        sendResponse({ success: true, analysis });
        break;

      case 'syncEmails':
        await syncEmails(request.days || 30);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// API Helper Functions
async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE}/auth/status`);
    const data = await response.json();
    chrome.storage.local.set({ authenticated: data.authenticated });
    return data.authenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

async function getLoginUrl() {
  const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST' });
  const data = await response.json();
  return data.authUrl;
}

async function logout() {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  chrome.storage.local.set({ authenticated: false });
}

async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`);
  const categories = await response.json();
  chrome.storage.local.set({ categories });
  return categories;
}

async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoryData)
  });
  return await response.json();
}

async function categorizeEmail(emailId, categoryId) {
  await fetch(`${API_BASE}/emails/${emailId}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId })
  });
}

async function flagEmailImportant(emailId) {
  await fetch(`${API_BASE}/emails/${emailId}/flag-important`, {
    method: 'POST'
  });
}

async function reportSpam(emailId) {
  await fetch(`${API_BASE}/emails/${emailId}/spam`, {
    method: 'POST'
  });
}

async function analyzeEmail(emailId) {
  const response = await fetch(`${API_BASE}/emails/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailId })
  });
  return await response.json();
}

async function syncEmails(days) {
  await fetch(`${API_BASE}/sync/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days })
  });
}
