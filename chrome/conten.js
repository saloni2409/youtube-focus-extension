// ─── YouTube Focus — Content Script ───────────────────────────────────────────
let profile = null;

async function getProfile() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, res => {
      resolve(res?.activeProfile || null);
    });
  });
}

const SEL = {
  shorts:   ["ytd-rich-shelf-renderer[is-shorts]", "ytd-reel-shelf-renderer",
             "a[href^='/shorts']", "#shortsLockupViewModelHost"],
  sidebar:  ["#secondary", "ytd-watch-next-secondary-results-renderer"],
  comments: ["#comments"],
  endCards: [".ytp-ce-element", ".ytp-endscreen-content"],
  videoCards: ["ytd-rich-item-renderer", "ytd-video-renderer", "ytd-compact-video-renderer"],
};

function hide(selectors) {
  selectors.forEach(sel =>
    document.querySelectorAll(sel).forEach(el =>
      el.style.setProperty("display", "none", "important")));
}

function filterVideoCards() {
  if (!profile) return;
  const { allowedKeywords = [], blockedKeywords = [] } = profile;
  const hasAllowed = allowedKeywords.length > 0;

  document.querySelectorAll(SEL.videoCards.join(",")).forEach(card => {
    const title = card.querySelector("#video-title, #title")?.textContent?.toLowerCase() || "";
    const channel = card.querySelector("#channel-name, .ytd-channel-name")?.textContent?.toLowerCase() || "";
    const text = title + " " + channel;

    const isBlocked = blockedKeywords.some(k => text.includes(k.toLowerCase()));
    const isAllowed = !hasAllowed || allowedKeywords.some(k => text.includes(k.toLowerCase()));

    card.style.setProperty("display", (isBlocked || !isAllowed) ? "none" : "", "important");
  });
}

function handleHomepage() {
  if (location.pathname !== "/" || !profile) return;

  if (profile.homepageMode === "subscriptions") {
    location.replace("https://www.youtube.com/feed/subscriptions");
  } else if (profile.homepageMode === "blank") {
    // Wait for feed to render then replace it
    const tryBlank = setInterval(() => {
      const feed = document.querySelector("#contents");
      if (feed) {
        clearInterval(tryBlank);
        feed.innerHTML = `
          <div style="text-align:center;padding:80px 20px;color:#aaa;font-family:sans-serif">
            <div style="font-size:48px">🎯</div>
            <h2 style="color:#fff;margin:16px 0 8px">Focus Mode Active</h2>
            <p>Profile: <strong style="color:${profile.color}">${profile.name}</strong></p>
            <p style="margin-top:8px">Use the search bar to find specific content.</p>
          </div>`;
      }
    }, 300);
  } else if (profile.homepageMode === "search" && profile.defaultSearchQuery) {
    location.replace(`https://www.youtube.com/results?search_query=${encodeURIComponent(profile.defaultSearchQuery)}`);
  }
}

function injectFocusBar() {
  if (document.getElementById("yt-focus-bar")) return;
  if (!profile) return;

  const bar = document.createElement("div");
  bar.id = "yt-focus-bar";

  const shortcuts = (profile.playlistShortcuts || [])
    .map(s => `<a class="yt-focus-shortcut" href="${s.url}">${s.label}</a>`)
    .join("");

  bar.innerHTML = `
    <div id="yt-focus-inner">
      <span id="yt-focus-badge" style="background:${profile.color}">${profile.name}</span>
      <div id="yt-focus-shortcuts">${shortcuts}</div>
      <button id="yt-focus-settings">⚙ Switch</button>
    </div>`;

  document.body.appendChild(bar);

  document.getElementById("yt-focus-settings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });
}

function applyProfile() {
  if (!profile) return;
  if (profile.blockShorts)   hide(SEL.shorts);
  if (profile.blockSidebar)  hide(SEL.sidebar);
  if (profile.blockComments) hide(SEL.comments);
  if (profile.blockEndCards) hide(SEL.endCards);
  filterVideoCards();
  injectFocusBar();
}

// Re-apply on YouTube SPA navigations
let lastPath = location.pathname;
const observer = new MutationObserver(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    handleHomepage();
  }
  applyProfile();
});

(async () => {
  profile = await getProfile();
  if (!profile) return;
  handleHomepage();
  applyProfile();
  observer.observe(document.body, { childList: true, subtree: true });
})();
