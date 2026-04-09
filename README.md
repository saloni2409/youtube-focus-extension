# 🎯 YouTube Focus

A Chrome extension that gives you full control over your YouTube experience through **profile-based modes**. Switch between Study, Research, Background Music, and Active Watching — each with its own rules for what YouTube shows you.

---

## ✨ Features

- **Profile-based modes** — separate settings for Study, Background Noise, Research, Active Watching, or any custom profile you create
- **Block distractions** — hide Shorts, sidebar recommendations, comments, end cards, and autoplay per profile
- **Keyword filtering** — block videos by keyword, or allowlist only specific topics per profile
- **Smart homepage** — auto-redirect to Subscriptions, a custom search query, or a clean blank slate
- **Playlist shortcuts** — pin your favourite playlists, courses, or music queues to the bottom bar
- **Quick-add shortcut** — hit `+` on the bar to instantly save the current page as a shortcut
- **Persistent bottom bar** — always-visible profile indicator with one-click profile switching

---

## 📁 File Structure

```
youtube-focus-extension/
├── manifest.json          # Extension config and permissions
├── background.js          # Service worker — storage, profile switching, messaging
├── content.js             # Injected into YouTube — applies all profile rules
├── content.css            # Styles for the bottom focus bar
├── popup/
│   ├── popup.html         # Extension toolbar popup
│   ├── popup.js           # Profile switcher logic
│   └── popup.css          # Popup styles
└── options/
    ├── options.html        # Full settings page
    └── options.js          # Profile editor — keywords, shortcuts, toggles
```

---

## 🚀 Installation (Development)

1. Clone or download this repository
   ```bash
   git clone https://github.com/saloni2409/youtube-focus-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer Mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `youtube-focus-extension` folder

5. Pin the extension by clicking the puzzle piece icon in the Chrome toolbar

---

## 🧭 How to Use

### Switching Profiles
- Click the 🎯 icon in the toolbar to open the profile switcher
- Click any profile to activate it — YouTube tabs reload automatically

### Managing Profiles
- Click **Manage profiles & shortcuts →** in the popup, or
- Click **⚙ Switch** in the bottom bar on YouTube
- From the options page you can:
  - Create, edit, or delete profiles
  - Set keyword blocklists and allowlists
  - Configure homepage behavior
  - Add and reorder playlist shortcuts
  - Toggle individual UI elements

### Adding a Shortcut from YouTube
- Navigate to any YouTube page or playlist
- Click the **＋** button in the bottom bar
- Label and URL are auto-filled — edit if needed
- Press **Enter** or click **Save**

---

## 🎛 Profile Settings

Each profile can independently configure:

| Setting | Description |
|---|---|
| **Homepage Mode** | Redirect to Subscriptions, Auto-Search, or Blank |
| **Default Search Query** | Used when Homepage Mode is set to Auto-Search |
| **Block Shorts** | Hides all Shorts content from the feed |
| **Block Sidebar** | Removes recommended videos while watching |
| **Block Comments** | Hides the comments section |
| **Block Autoplay** | Stops automatic next video |
| **Block End Cards** | Hides end-of-video overlays |
| **Blocked Keywords** | Videos matching these are hidden |
| **Allowed Keywords** | Only videos matching these are shown (leave empty for no filter) |
| **Playlist Shortcuts** | Quick-access links pinned to the bottom bar |

---

## 🏗 Default Profiles

| Profile | Use Case | Key Settings |
|---|---|---|
| 📚 Study Mode | Deep focus work | Blocks Shorts, sidebar, comments, autoplay. Redirects to Subscriptions |
| 🎵 Background Noise | Ambient sound while working | Allows autoplay. Filters to lofi/ambient keywords only |
| 🎬 Active Watch | Normal YouTube browsing | Everything visible, no filters |
| 🔬 Research | Finding specific information | Blocks Shorts, sidebar, autoplay. Comments visible for context |

---

## 🔧 Tech Stack

- **Manifest V3** Chrome Extension API
- **Vanilla JS** — no frameworks, fast and lightweight
- **`chrome.storage.sync`** — settings sync across devices
- **MutationObserver** — handles YouTube's SPA navigation
- **`yt-navigate-finish` event** — YouTube's internal navigation hook

---

## 🗺 Roadmap

- [ ] Scheduled profile switching (e.g. auto-enable Study between 9am–5pm)
- [ ] Watch time analytics per profile
- [ ] Channel blocklist per profile
- [ ] Import / export profiles as JSON
- [ ] Keyboard shortcut to switch profiles
- [ ] Firefox support

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

Inspired by [Unhook](https://unhook.app) and [DF YouTube](https://chrome.google.com/webstore/detail/df-tube-distraction-free/mjdepdfccjgcndkmemponafgioodelna). Built to add profile-based context switching that neither tool offers.

---

*Made with ☕ for anyone who's ever opened YouTube to study and ended up watching videos for 3 hours.*
