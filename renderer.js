const { shell } = require('electron');

let history = [];
let currentIndex = -1;

let currentTheme = 'dark';

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('becx-theme') || 'dark';
  applyTheme(savedTheme);
  
  const webview = document.getElementById('view');
  
  webview.addEventListener('dom-ready', () => {
    console.log('Webview is ready');
  });

  webview.addEventListener('did-fail-load', (event) => {
    console.log('Failed to load:', event.errorDescription);
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettings();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettings();
    }
  });
});

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

// Browser Functions
function loadPage(url = null) {
  const input = document.getElementById('url');
  let finalUrl = url || input.value;

  if (!finalUrl.startsWith("http")) {
    finalUrl = `https://${finalUrl}`;
  }

  const webview = document.getElementById('view');

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
  const webview = document.getElementById('view');
  if (webview.canGoBack()) {
    webview.goBack();
  } else if (currentIndex > 0) {
    currentIndex--;
    loadPage(history[currentIndex]);
  }
}

function goForward() {
  const webview = document.getElementById('view');
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

// you can ignore this , it's about the AI assisstance feature , it worked but openAI called me broke for using their API so it's useless to dig here X)
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