const { shell, ipcRenderer } = require('electron');

let history = [];
let currentIndex = -1;
let currentTheme = 'dark';


let tabs = new Map();
let currentTabId = 'tab-1';
let tabCounter = 1;
let bookmarks = [];
let browserHistory = [];
let downloads = [];


tabs.set('tab-1', {
  id: 'tab-1',
  url: 'becx.html',
  title: 'search'
});

document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  const savedTheme = localStorage.getItem('becx-theme') || 'dark';
  applyTheme(savedTheme);
  
  const webview = document.getElementById('webview-tab-1');
  
  webview.addEventListener('dom-ready', () => {
    console.log('Webview is ready');
  });

  webview.addEventListener('did-fail-load', (event) => {
    console.log('Failed to load:', event.errorDescription);
  });

  webview.addEventListener('page-title-updated', (event) => {
    updateTabTitle('tab-1', event.title);
  });

  webview.addEventListener('did-navigate', (event) => {
    document.getElementById('url').value = event.url;
    addToBrowserHistory(event.url, event.title || 'Unknown');
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettings();
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
  const adblockCheckbox = document.getElementById("adblock-toggle");
  const storedAdblock = localStorage.getItem("becx-adblock");

  if (adblockCheckbox) {
    adblockCheckbox.checked = storedAdblock === "true";
    adblockCheckbox.addEventListener("change", () => {
      localStorage.setItem("becx-adblock", adblockCheckbox.checked);
      location.reload(); // Force reload to apply
    });
  }
});


  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettings();
    }
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      createNewTab();
    }
  });

  setupDownloadListeners();
});

function loadStoredData() {
  try {
    bookmarks = JSON.parse(localStorage.getItem('becx-bookmarks')) || [];
    browserHistory = JSON.parse(localStorage.getItem('becx-browser-history')) || [];
    downloads = JSON.parse(localStorage.getItem('becx-downloads')) || [];
  } catch (e) {
    console.log('Error loading stored data:', e);
  }
}

function saveData() {
  localStorage.setItem('becx-bookmarks', JSON.stringify(bookmarks));
  localStorage.setItem('becx-browser-history', JSON.stringify(browserHistory));
  localStorage.setItem('becx-downloads', JSON.stringify(downloads));
}

function setupDownloadListeners() {
  if (ipcRenderer) {
    ipcRenderer.on('download-started', (event, downloadInfo) => {
      downloads.push({
        id: Date.now(),
        filename: downloadInfo.filename,
        url: downloadInfo.url,
        status: 'downloading',
        date: new Date().toISOString()
      });
      saveData();
    });

    ipcRenderer.on('download-completed', (event, completedInfo) => {
      const download = downloads.find(d => d.filename === completedInfo.filename);
      if (download) {
        download.status = 'completed';
        saveData();
      }
    });
  }
}


function createNewTab() {
  tabCounter++;
  const newTabId = `tab-${tabCounter}`;
  
  tabs.set(newTabId, {
    id: newTabId,
    url: 'becx.html',
    title: 'New Tab'
  });

  const tabBar = document.getElementById('tab-bar');
  const newTabBtn = tabBar.querySelector('.new-tab-btn');
  
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.setAttribute('data-tab-id', newTabId);
  tabElement.onclick = () => switchTab(newTabId);
  tabElement.innerHTML = `
    <div class="tab-title">New Tab</div>
    <button class="tab-close" onclick="closeTab(event, '${newTabId}')">&times;</button>
  `;
  
  tabBar.insertBefore(tabElement, newTabBtn);

  const webviewContainer = document.getElementById('webview-container');
  const newWrapper = document.createElement('div');
  newWrapper.className = 'webview-wrapper';
  newWrapper.setAttribute('data-tab-id', newTabId);
  newWrapper.innerHTML = `<webview id="webview-${newTabId}" src="becx.html"></webview>`;
  
  webviewContainer.appendChild(newWrapper);

  switchTab(newTabId);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`[data-tab-id="${tabId}"].tab`).classList.add('active');

  document.querySelectorAll('.webview-wrapper').forEach(wrapper => wrapper.classList.remove('active'));
  document.querySelector(`[data-tab-id="${tabId}"].webview-wrapper`).classList.add('active');

  currentTabId = tabId;
  const tabData = tabs.get(tabId);
  document.getElementById('url').value = tabData.url;
}

function closeTab(event, tabId) {
  if (event) event.stopPropagation();
  
  if (tabs.size === 1) {
    goHome();
    return;
  }

  tabs.delete(tabId);
  document.querySelector(`[data-tab-id="${tabId}"].tab`).remove();
  document.querySelector(`[data-tab-id="${tabId}"].webview-wrapper`).remove();

  if (currentTabId === tabId) {
    const remainingTabs = Array.from(tabs.keys());
    switchTab(remainingTabs[0]);
  }
}

function updateTabTitle(tabId, title) {
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"].tab .tab-title`);
  if (tabElement) {
    tabElement.textContent = title.length > 20 ? title.substring(0, 20) + '...' : title;
  }
  if (tabs.has(tabId)) {
    tabs.get(tabId).title = title;
  }
}

function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'block';
  
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
    if (option.dataset.theme === currentTheme) {
      option.classList.add('active');
    }
  });
  
  document.getElementById('current-theme').textContent = 
    currentTheme === 'dark' ? 'Dark' : 'Light';
  
  updateBookmarksList();
  updateHistoryList();
  updateDownloadsList();
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

function changeTheme(theme) {
  currentTheme = theme;
  applyTheme(theme);
  
  localStorage.setItem('becx-theme', theme);
  
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
    if (option.dataset.theme === theme) {
      option.classList.add('active');
    }
  });
  
  document.getElementById('current-theme').textContent = 
    theme === 'dark' ? 'Dark' : 'Light';
  
  console.log(`Theme changed to: ${theme}`);
}

function applyTheme(theme) {
  currentTheme = theme;
  if (theme === 'light') {
    document.body.setAttribute('data-theme', 'light');
  } else {
    document.body.removeAttribute('data-theme');
  }
}


function loadPage(url = null) {
  const input = document.getElementById('url');
  let finalUrl = url || input.value;

  if (!finalUrl.startsWith("http")) {
    finalUrl = `https://${finalUrl}`;
  }

  const webview = document.getElementById(`webview-${currentTabId}`);

  try {
    webview.src = finalUrl;
    input.value = finalUrl;

    if (url === null) {
      history = history.slice(0, currentIndex + 1);
      history.push(finalUrl);
      currentIndex++;
    }
  } catch (error) {
    console.log("Error loading page:", error);
    shell.openExternal(finalUrl);
  }
}

function goBack() {
  const webview = document.getElementById(`webview-${currentTabId}`);
  if (webview.canGoBack()) {
    webview.goBack();
  } else if (currentIndex > 0) {
    currentIndex--;
    loadPage(history[currentIndex]);
  }
}

function goForward() {
  const webview = document.getElementById(`webview-${currentTabId}`);
  if (webview.canGoForward()) {
    webview.goForward();
  } else if (currentIndex < history.length - 1) {
    currentIndex++;
    loadPage(history[currentIndex]);
  }
}

function goHome() {
  document.getElementById('url').value = "wikipedia.org";
  loadPage();
}

document.getElementById('url').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loadPage();
  }
});

document.getElementById('input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    talkToBecbop();
  }
});


function bookmarkCurrentPage() {
  const currentTab = tabs.get(currentTabId);
  const url = document.getElementById('url').value;
  const title = currentTab.title || url;

  if (bookmarks.some(bookmark => bookmark.url === url)) {
    alert('Page already bookmarked!');
    return;
  }

  bookmarks.push({
    id: Date.now(),
    title: title,
    url: url,
    date: new Date().toISOString()
  });

  saveData();
  alert('Page bookmarked!');
}

function removeBookmark(id) {
  bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
  saveData();
  updateBookmarksList();
}

function clearBookmarks() {
  if (confirm('Clear all bookmarks?')) {
    bookmarks = [];
    saveData();
    updateBookmarksList();
  }
}

function exportBookmarks() {
  const data = JSON.stringify(bookmarks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'becx-bookmarks.json';
  a.click();
}


function addToBrowserHistory(url, title) {
  browserHistory = browserHistory.filter(item => item.url !== url);
  
  browserHistory.unshift({
    id: Date.now(),
    title: title,
    url: url,
    date: new Date().toISOString()
  });

  if (browserHistory.length > 100) {
    browserHistory = browserHistory.slice(0, 100);
  }

  saveData();
}

function removeHistoryItem(id) {
  browserHistory = browserHistory.filter(item => item.id !== id);
  saveData();
  updateHistoryList();
}

function clearHistory() {
  if (confirm('Clear all history?')) {
    browserHistory = [];
    saveData();
    updateHistoryList();
  }
}

function exportHistory() {
  const data = JSON.stringify(browserHistory, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'becx-history.json';
  a.click();
}


function clearDownloads() {
  if (confirm('Clear downloads list?')) {
    downloads = [];
    saveData();
    updateDownloadsList();
  }
}

function openDownloadsFolder() {
  if (ipcRenderer) {
    ipcRenderer.invoke('open-downloads-folder');
  } else {
    alert('Downloads folder functionality needs electron main process');
  }
}


function updateBookmarksList() {
  const container = document.getElementById('bookmarks-list');
  
  if (bookmarks.length === 0) {
    container.innerHTML = '<div class="empty-list">No bookmarks yet</div>';
    return;
  }

  container.innerHTML = bookmarks.map(bookmark => `
    <div class="list-item" onclick="loadPage('${bookmark.url}')">
      <div class="list-item-info">
        <div class="list-item-title">${bookmark.title}</div>
        <div class="list-item-url">${bookmark.url}</div>
      </div>
      <div class="list-item-actions">
        <button class="list-item-btn" onclick="event.stopPropagation(); removeBookmark(${bookmark.id})" title="Remove">🗑️</button>
      </div>
    </div>
  `).join('');
}

function updateHistoryList() {
  const container = document.getElementById('history-list');
  
  if (browserHistory.length === 0) {
    container.innerHTML = '<div class="empty-list">No history yet</div>';
    return;
  }

  container.innerHTML = browserHistory.slice(0, 20).map(item => `
    <div class="list-item" onclick="loadPage('${item.url}')">
      <div class="list-item-info">
        <div class="list-item-title">${item.title}</div>
        <div class="list-item-url">${item.url}</div>
      </div>
      <div class="list-item-actions">
        <button class="list-item-btn" onclick="event.stopPropagation(); removeHistoryItem(${item.id})" title="Remove">🗑️</button>
      </div>
    </div>
  `).join('');
}

function updateDownloadsList() {
  const container = document.getElementById('downloads-list');
  
  if (downloads.length === 0) {
    container.innerHTML = '<div class="empty-list">No downloads yet</div>';
    return;
  }

  container.innerHTML = downloads.map(download => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${download.filename}</div>
        <div class="list-item-url">${download.status}</div>
      </div>
    </div>
  `).join('');
}


async function talkToBecbop() {
  const input = document.getElementById("input");
  const resBox = document.getElementById("response");
  const message = input.value;

  if (!message.trim()) return;

  resBox.textContent = "Thinking... ";
  input.value = "";

  try {
    console.log("🚀 Sending message to backend:", message);

    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    console.log("📬 Received from backend:", data);

    resBox.textContent = data.reply || "No reply call becca for fixing";

  } catch (err) {
    console.error("💥 Fetch error:", err);
    resBox.textContent = "Error: " + err.message;
  }
}