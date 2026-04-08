chrome.runtime.sendMessage({ type: "GET_STATE" }, ({ profiles, activeProfileId }) => {
  const list = document.getElementById("profiles-list");

  profiles.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "profile-btn" + (p.id === activeProfileId ? " active" : "");
    btn.style.setProperty("--c", p.color);

    const shortcuts = p.playlistShortcuts?.length
      ? `${p.playlistShortcuts.length} shortcut${p.playlistShortcuts.length > 1 ? "s" : ""}`
      : "no shortcuts";
    const kw = p.blockedKeywords?.length ? `blocking ${p.blockedKeywords.length} keywords` : "no blocks";

    btn.innerHTML = `
      <div class="profile-dot"></div>
      <div>
        <div>${p.name}</div>
        <div class="profile-meta">${kw} · ${shortcuts}</div>
      </div>`;

    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "SET_PROFILE", profileId: p.id }, () => window.close());
    });

    list.appendChild(btn);
  });

  // Settings / manage link
  document.getElementById("settings-link").addEventListener("click", e => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("manage-link").addEventListener("click", e => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});
