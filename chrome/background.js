// Default profiles — stored in chrome.storage.sync
const DEFAULT_PROFILES = [
  {
    id: "study",
    name: "📚 Study Mode",
    color: "#4f8ef7",
    blockShorts: true,
    blockSidebar: true,
    blockComments: true,
    blockAutoplay: true,
    blockEndCards: true,
    homepageMode: "subscriptions", // "subscriptions" | "search" | "blank"
    allowedKeywords: [],           // if non-empty, only show videos matching these
    blockedKeywords: ["prank", "reaction", "drama", "beef"],
    playlistShortcuts: [
      { label: "CS Course", url: "https://www.youtube.com/playlist?list=PLAYLIST_ID" },
      { label: "Math Lectures", url: "https://www.youtube.com/playlist?list=PLAYLIST_ID" }
    ],
    defaultSearchQuery: ""
  },
  {
    id: "background",
    name: "🎵 Background Noise",
    color: "#2ecc71",
    blockShorts: true,
    blockSidebar: false,
    blockComments: true,
    blockAutoplay: false,
    blockEndCards: false,
    homepageMode: "search",
    allowedKeywords: ["lofi", "ambient", "rain", "jazz", "chill", "focus music"],
    blockedKeywords: [],
    playlistShortcuts: [
      { label: "Lofi Playlist", url: "https://www.youtube.com/playlist?list=PLAYLIST_ID" },
      { label: "Rain Sounds", url: "https://www.youtube.com/playlist?list=PLAYLIST_ID" }
    ],
    defaultSearchQuery: "lofi hip hop study"
  },
  {
    id: "active",
    name: "🎬 Active Watch",
    color: "#e74c3c",
    blockShorts: false,
    blockSidebar: false,
    blockComments: false,
    blockAutoplay: false,
    blockEndCards: false,
    homepageMode: "subscriptions",
    allowedKeywords: [],
    blockedKeywords: [],
    playlistShortcuts: [],
    defaultSearchQuery: ""
  },
  {
    id: "research",
    name: "🔬 Research",
    color: "#9b59b6",
    blockShorts: true,
    blockSidebar: true,
    blockComments: false, // comments useful for research
    blockAutoplay: true,
    blockEndCards: true,
    homepageMode: "blank",
    allowedKeywords: [],
    blockedKeywords: ["shorts", "compilation", "funny"],
    playlistShortcuts: [],
    defaultSearchQuery: ""
  }
];

// Initialize storage with defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const { profiles, activeProfileId } = await chrome.storage.sync.get(["profiles", "activeProfileId"]);
  if (!profiles) await chrome.storage.sync.set({ profiles: DEFAULT_PROFILES });
  if (!activeProfileId) await chrome.storage.sync.set({ activeProfileId: "study" });
});

// Listen for messages from content/popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    chrome.storage.sync.get(["profiles", "activeProfileId"], (data) => {
      const active = (data.profiles || []).find(p => p.id === data.activeProfileId);
      sendResponse({ profiles: data.profiles, activeProfileId: data.activeProfileId, activeProfile: active });
    });
    return true; // async
  }

  if (msg.type === "SET_PROFILE") {
    chrome.storage.sync.set({ activeProfileId: msg.profileId }, () => {
      // Reload all YouTube tabs to apply new profile
      chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
        tabs.forEach(t => chrome.tabs.reload(t.id));
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "SAVE_PROFILES") {
    chrome.storage.sync.set({ profiles: msg.profiles }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    return true;
  }
});
