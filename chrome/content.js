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
  shorts:     ["ytd-rich-shelf-renderer[is-shorts]", "ytd-reel-shelf-renderer",
               "a[href^='/shorts']", "#shortsLockupViewModelHost"],
  sidebar:    ["#secondary", "ytd-watch-next-secondary-results-renderer"],
  comments:   ["#comments"],
  endCards:   [".ytp-ce-element", ".ytp-endscreen-content"],
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

// ─── BAR INJECTION — waits for body, survives SPA navigation ─────────────────
function saveShortcut(label, url) {
  if (!label || !url) return;
  profile.playlistShortcuts = profile.playlistShortcuts || [];
  profile.playlistShortcuts.push({ label, url });

  // Persist to storage
  chrome.runtime.sendMessage({ type: "GET_STATE" }, res => {
    const profiles = res.profiles.map(p =>
      p.id === profile.id ? { ...p, playlistShortcuts: profile.playlistShortcuts } : p
    );
    chrome.runtime.sendMessage({ type: "SAVE_PROFILES", profiles }, () => {
      injectFocusBar(); // re-render bar with new shortcut
    });
  });
}

function injectFocusBar() {
  if (!profile) return;

  document.getElementById("yt-focus-bar")?.remove();

  const bar = document.createElement("div");
  bar.id = "yt-focus-bar";

  const shortcuts = (profile.playlistShortcuts || [])
    .map(s => `<a class="yt-focus-shortcut" href="${s.url}">${s.label}</a>`)
    .join("");

  bar.innerHTML = `
    <div id="yt-focus-inner">
      <span id="yt-focus-badge" style="background:${profile.color}">${profile.name}</span>
      <div id="yt-focus-shortcuts">${shortcuts}</div>

      <div id="yt-focus-add-form" style="display:none">
        <input id="yt-focus-label" type="text" placeholder="Label" />
        <input id="yt-focus-url"   type="text" placeholder="URL" />
        <button id="yt-focus-save">Save</button>
        <button id="yt-focus-cancel">✕</button>
      </div>

      <button id="yt-focus-add" title="Add shortcut">＋</button>
      <button id="yt-focus-settings">⚙ Switch</button>
    </div>`;

  const tryInject = setInterval(() => {
    if (document.body) {
      clearInterval(tryInject);
      document.body.appendChild(bar);

      const form    = document.getElementById("yt-focus-add-form");
      const addBtn  = document.getElementById("yt-focus-add");
      const saveBtn = document.getElementById("yt-focus-save");
      const cancelBtn = document.getElementById("yt-focus-cancel");
      const labelIn = document.getElementById("yt-focus-label");
      const urlIn   = document.getElementById("yt-focus-url");

      // Show form, pre-fill URL
      addBtn.addEventListener("click", () => {
        form.style.display = "flex";
        addBtn.style.display = "none";
        urlIn.value = location.href;
        labelIn.value = document.title.replace(" - YouTube", "").trim();
        labelIn.focus();
        labelIn.select();
      });

      // Cancel
      cancelBtn.addEventListener("click", () => {
        form.style.display = "none";
        addBtn.style.display = "";
      });

      // Save on button click
      saveBtn.addEventListener("click", () => {
        saveShortcut(labelIn.value.trim(), urlIn.value.trim());
      });

      // Save on Enter key
      [labelIn, urlIn].forEach(input => {
        input.addEventListener("keydown", e => {
          if (e.key === "Enter") saveShortcut(labelIn.value.trim(), urlIn.value.trim());
          if (e.key === "Escape") cancelBtn.click();
        });
      });

      document.getElementById("yt-focus-settings")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
      });
    }
  }, 100);
}

function applyProfile() {
  if (!profile) return;
  if (profile.blockShorts)   hide(SEL.shorts);
  if (profile.blockSidebar)  hide(SEL.sidebar);
  if (profile.blockComments) hide(SEL.comments);
  if (profile.blockEndCards) hide(SEL.endCards);
  filterVideoCards();
}

// ─── SPA navigation — YouTube fires this on every page change ────────────────
document.addEventListener("yt-navigate-finish", () => {
  handleHomepage();
  applyProfile();
  injectFocusBar(); // re-inject after every SPA navigation
});

// ─── MutationObserver — catches dynamically loaded content ───────────────────
let lastPath = location.pathname;
const observer = new MutationObserver(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    handleHomepage();
    injectFocusBar();
  }
  applyProfile();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
(async () => {
  profile = await getProfile();
  if (!profile) return;

  handleHomepage();
  applyProfile();
  injectFocusBar(); // initial inject with body-wait loop

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
