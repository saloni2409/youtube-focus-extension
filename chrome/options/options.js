let profiles = [];
let activeId = null;
let selectedId = null;

const COLORS = ["#4f8ef7","#2ecc71","#e74c3c","#9b59b6","#f39c12","#1abc9c","#e67e22"];

async function load() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, res => {
      profiles = res.profiles || [];
      activeId = res.activeProfileId;
      selectedId = selectedId || activeId;
      resolve();
    });
  });
}

async function save() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "SAVE_PROFILES", profiles }, () => resolve());
  });
}

function getSelected() { return profiles.find(p => p.id === selectedId); }

function renderSidebar() {
  const tabs = document.getElementById("profile-tabs");
  tabs.innerHTML = "";
  profiles.forEach(p => {
    const div = document.createElement("div");
    div.className = "profile-tab" + (p.id === selectedId ? " active" : "");
    div.style.setProperty("--c", p.color);
    div.innerHTML = `<div class="tab-dot"></div><span>${p.name}</span>`;
    div.addEventListener("click", () => { selectedId = p.id; renderAll(); });
    tabs.appendChild(div);
  });
}

function toggle(key, checked) {
  getSelected()[key] = checked;
}

function renderEditor() {
  const p = getSelected();
  if (!p) return;
  const editor = document.getElementById("editor");

  editor.innerHTML = `
    <h2>
      <div class="color-dot" style="background:${p.color}"></div>
      <input type="text" id="f-name" value="${p.name}" style="background:none;border:none;color:#fff;font-size:20px;font-weight:700;width:300px;outline:none">
    </h2>

    <div class="section">
      <div class="section-title">Profile Color</div>
      <div style="display:flex;gap:8px">
        ${COLORS.map(c => `
          <div data-color="${c}" style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;
            border:2px solid ${c === p.color ? "#fff" : "transparent"};transition:.15s"></div>
        `).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Homepage Behavior</div>
      <div class="field">
        <label>When opening YouTube, go to:</label>
        <select id="f-homepage">
          <option value="subscriptions" ${p.homepageMode==="subscriptions"?"selected":""}>Subscriptions Feed</option>
          <option value="search" ${p.homepageMode==="search"?"selected":""}>Auto-Search (set query below)</option>
          <option value="blank" ${p.homepageMode==="blank"?"selected":""}>Blank / Search Only</option>
        </select>
      </div>
      <div class="field">
        <label>Default search query (for Auto-Search mode)</label>
        <input type="text" id="f-query" value="${p.defaultSearchQuery}" placeholder="e.g. lofi hip hop">
      </div>
    </div>

    <div class="section">
      <div class="section-title">UI Controls</div>
      ${[
        ["blockShorts",   "Block YouTube Shorts", "Hides all Shorts content"],
        ["blockSidebar",  "Block Sidebar Recommendations", "Removes the right-side suggested videos"],
        ["blockComments", "Block Comments Section", "Hides comments on all videos"],
        ["blockAutoplay", "Block Autoplay", "Prevents automatic next video"],
        ["blockEndCards", "Block End Cards", "Hides the end-of-video overlays"],
      ].map(([key, label, hint]) => `
        <div class="toggle-row">
          <div class="toggle-label">${label}<small>${hint}</small></div>
          <label class="toggle">
            <input type="checkbox" data-key="${key}" ${p[key] ? "checked" : ""}>
            <span class="slider"></span>
          </label>
        </div>`).join("")}
    </div>

    <div class="section">
      <div class="section-title">Keyword Filters</div>
      <div class="field">
        <label>🚫 Blocked Keywords (comma-separated)</label>
        <textarea id="f-blocked" placeholder="prank, drama, reaction">${p.blockedKeywords.join(", ")}</textarea>
      </div>
      <div class="field">
        <label>✅ Allowed Keywords — only show these (leave empty for no filter)</label>
        <textarea id="f-allowed" placeholder="lofi, tutorial, lecture">${p.allowedKeywords.join(", ")}</textarea>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Playlist Shortcuts</div>
      <div id="shortcuts-list">
        ${p.playlistShortcuts.map((s, i) => shortcutRow(s.label, s.url, i)).join("")}
      </div>
      <button class="add-btn" id="add-shortcut">+ Add Shortcut</button>
    </div>

    <div class="actions">
      <button class="save-btn" id="save-btn">💾 Save Changes</button>
      ${profiles.length > 1 ? `<button class="delete-btn" id="delete-btn">Delete Profile</button>` : ""}
    </div>`;

  // Color picker
  editor.querySelectorAll("[data-color]").forEach(dot => {
    dot.addEventListener("click", () => {
      getSelected().color = dot.dataset.color;
      renderAll();
    });
  });

  // Toggles
  editor.querySelectorAll("input[type=checkbox][data-key]").forEach(cb => {
    cb.addEventListener("change", () => toggle(cb.dataset.key, cb.checked));
  });

  // Shortcut actions
  editor.getElementById = id => editor.querySelector("#" + id);
  document.getElementById("add-shortcut")?.addEventListener("click", () => {
    getSelected().playlistShortcuts.push({ label: "New Shortcut", url: "https://www.youtube.com/playlist?list=" });
    renderEditor();
  });

  refreshShortcutListeners();

  // Save
  document.getElementById("save-btn")?.addEventListener("click", async () => {
    collectForm();
    await save();
    showToast();
    renderSidebar();
  });

  // Delete
  document.getElementById("delete-btn")?.addEventListener("click", async () => {
    if (!confirm(`Delete profile "${p.name}"?`)) return;
    profiles = profiles.filter(x => x.id !== selectedId);
    selectedId = profiles[0]?.id;
    await save();
    renderAll();
  });
}

function shortcutRow(label, url, i) {
  return `<div class="shortcut-row" data-i="${i}">
    <input class="sc-label" type="text" value="${label}" placeholder="Label">
    <input class="sc-url" type="text" value="${url}" placeholder="Playlist URL">
    <button class="rm-btn" data-rm="${i}">✕</button>
  </div>`;
}

function refreshShortcutListeners() {
  document.querySelectorAll("[data-rm]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.rm);
      getSelected().playlistShortcuts.splice(i, 1);
      renderEditor();
    });
  });
}

function collectForm() {
  const p = getSelected();
  p.name            = document.getElementById("f-name")?.value || p.name;
  p.homepageMode    = document.getElementById("f-homepage")?.value;
  p.defaultSearchQuery = document.getElementById("f-query")?.value || "";
  p.blockedKeywords = document.getElementById("f-blocked")?.value.split(",").map(s=>s.trim()).filter(Boolean) || [];
  p.allowedKeywords = document.getElementById("f-allowed")?.value.split(",").map(s=>s.trim()).filter(Boolean) || [];

  // Collect shortcuts
  const rows = document.querySelectorAll(".shortcut-row");
  p.playlistShortcuts = Array.from(rows).map(row => ({
    label: row.querySelector(".sc-label")?.value || "",
    url:   row.querySelector(".sc-url")?.value || ""
  }));
}

function showToast() {
  const t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

function renderAll() { renderSidebar(); renderEditor(); }

// ── New Profile ───────────────────────────────────────────────────────────────
document.getElementById("add-profile-btn").addEventListener("click", () => {
  const id = "profile_" + Date.now();
  profiles.push({
    id, name: "New Profile",
    color: COLORS[profiles.length % COLORS.length],
    blockShorts: true, blockSidebar: false, blockComments: false,
    blockAutoplay: true, blockEndCards: false,
    homepageMode: "subscriptions", defaultSearchQuery: "",
    allowedKeywords: [], blockedKeywords: [], playlistShortcuts: []
  });
  selectedId = id;
  renderAll();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
load().then(renderAll);
