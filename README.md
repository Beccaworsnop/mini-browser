🌐 BecX Browser

A custom mini web browser built with Electron, powered by webviews

This project was made to practice vanilla Js and get to use Electron for the first time

✨ Features

🗂️ Multi-Tab Support
Open, close, and switch between multiple tabs with ease.

🎨 Dark/Light Mode + Themes
Built-in dark/light mode toggle, with a roadmap for Opera GX–style theme presets.

🏠 Custom Home Page (BecX Search)
Beautiful startup page with search bar, quick links, and custom wallpaper option (planned).

📚 Bookmarks & History
Save, view, and manage your favorite sites and browsing history.

📥 Download Manager
Downloads tracked directly inside settings.

🚫 Ad Blocker
Block common ad/tracker domains with an on/off toggle inside settings.


⚙️ Settings Panel
Change theme, manage bookmarks/history/downloads, and toggle features like ad-block.


Storage

LocalStorage → Save bookmarks, history, downloads, and theme/user prefs.

⚡ How It Works

Electron Window

main.js creates a BrowserWindow with webviewTag: true enabled, allowing embedded browsing sessions.

```CODE
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    webviewTag: true,
    webSecurity: false
  }
});
```

Tabs & Navigation

Each tab is represented by an object with its own webview.

Switching tabs hides/shows active webviews.

Navigation (back, forward, home, URL input) updates the active webview.


Ad Blocker

Implemented via Electron’s webRequest filter in main.js.

```CODE
session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
  const blocked = ["doubleclick.net","googlesyndication.com","adservice.google.com"];
  cb({ cancel: blocked.some(domain => details.url.includes(domain)) });
});
```

Toggleable from Settings UI.



