/**
 * API Drift Sentinel UI Controller
 * 100% Client-Side, Externalized CSP-Safe JS, 0-EUR Validation Waitlist Mode
 */

const CHECKOUT_ENABLED = false;
const WAITLIST_ENDPOINT = "https://conversionlogic-waitlist.conversionlogic.workers.dev";

let currentDiff = null;
let currentFilter = "ALL";
let isSampleMode = false;

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
  const specA = document.getElementById("specAInput");
  const specB = document.getElementById("specBInput");

  specA?.addEventListener("input", () => {
    isSampleMode = false;
    updateLineCount("lenSpecA", specA.value);
  });

  specB?.addEventListener("input", () => {
    isSampleMode = false;
    updateLineCount("lenSpecB", specB.value);
  });

  document.getElementById("fileSpecA")?.addEventListener("change", (e) => loadSpecFile(e, specA, "lenSpecA"));
  document.getElementById("fileSpecB")?.addEventListener("change", (e) => loadSpecFile(e, specB, "lenSpecB"));

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => loadSample(btn.dataset.sample));
  });

  document.getElementById("runDiffBtn")?.addEventListener("click", executeDiff);
  document.getElementById("clearSpecsBtn")?.addEventListener("click", clearSpecs);
  document.getElementById("btn-inspect-breaking")?.addEventListener("click", () => filterChanges("BREAKING"));

  document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => filterChanges(btn.dataset.filter));
  });

  document.getElementById("btn-dl-md")?.addEventListener("click", downloadMarkdown);
  document.getElementById("btn-dl-json")?.addEventListener("click", downloadJSON);
  document.getElementById("btn-dl-sarif")?.addEventListener("click", downloadSARIF);
  document.getElementById("btn-print")?.addEventListener("click", () => window.print());

  setupWaitlistForm();
}

function loadSpecFile(event, textarea, counterId) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert("Spec file exceeds 5MB limit.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    textarea.value = String(ev.target.result || "");
    isSampleMode = false;
    updateLineCount(counterId, textarea.value);
  };
  reader.readAsText(file);
}

function updateLineCount(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  const count = text ? text.split("\n").length : 0;
  el.textContent = `${count} lines`;
}

function loadSample(type) {
  const sample = window.SAMPLE_API_SPECS && window.SAMPLE_API_SPECS[type];
  if (!sample) return;
  document.getElementById("specAInput").value = sample.specA;
  document.getElementById("specBInput").value = sample.specB;
  updateLineCount("lenSpecA", sample.specA);
  updateLineCount("lenSpecB", sample.specB);
  isSampleMode = true;
}

function clearSpecs() {
  document.getElementById("specAInput").value = "";
  document.getElementById("specBInput").value = "";
  updateLineCount("lenSpecA", "");
  updateLineCount("lenSpecB", "");
  isSampleMode = false;
  currentDiff = null;
  document.getElementById("resultsSection").hidden = true;
  document.getElementById("emptyStateNote").hidden = false;
}

function executeDiff() {
  const rawA = document.getElementById("specAInput").value;
  const rawB = document.getElementById("specBInput").value;

  if (!rawA.trim() || !rawB.trim()) {
    alert("Please paste both Base Spec (v1) and Target Spec (v2) before comparing.");
    return;
  }

  try {
    currentDiff = window.apiDriftEngine.compareSpecs(rawA, rawB);
    currentFilter = "ALL";
    document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === "ALL");
    });
    renderDiffResults(currentDiff);
  } catch (err) {
    alert(`Error comparing specs: ${err.message}`);
  }
}

function renderDiffResults(diff) {
  document.getElementById("emptyStateNote").hidden = true;
  const section = document.getElementById("resultsSection");
  section.hidden = false;

  document.getElementById("sampleDemoBanner").hidden = !isSampleMode;
  document.getElementById("breakingAlertBanner").hidden = !diff.isBreaking;

  document.getElementById("scoreValue").textContent = diff.score;
  document.getElementById("statBreaking").textContent = diff.breakingCount;
  document.getElementById("statNonBreaking").textContent = diff.nonBreakingCount;

  const semVerEl = document.getElementById("statSemVer");
  const semVerSubEl = document.getElementById("statSemVerSub");
  if (diff.breakingCount > 0) {
    semVerEl.textContent = "MAJOR (x.0.0)";
    semVerEl.className = "metric-val is-fail";
    semVerSubEl.textContent = "Breaking drift requires major version";
  } else if (diff.nonBreakingCount > 0) {
    semVerEl.textContent = "MINOR (1.x.0)";
    semVerEl.className = "metric-val is-pass";
    semVerSubEl.textContent = "Backward-compatible additions";
  } else {
    semVerEl.textContent = "PATCH (1.0.x)";
    semVerEl.className = "metric-val";
    semVerSubEl.textContent = "Metadata update only";
  }

  const scoreEl = document.getElementById("scoreValue");
  const scoreLabel = document.getElementById("scoreLabel");
  if (diff.isBreaking) {
    scoreEl.className = "metric-val is-fail";
    scoreLabel.textContent = "Breaking drift detected";
    document.getElementById("statBreakingSub").textContent = `${diff.breakingCount} breaking mutations`;
  } else {
    scoreEl.className = "metric-val is-pass";
    scoreLabel.textContent = "Backward compatible";
    document.getElementById("statBreakingSub").textContent = "0 breaking mutations";
  }

  document.getElementById("count-ALL").textContent = diff.totalChanges;
  document.getElementById("count-BREAKING").textContent = diff.breakingCount;
  document.getElementById("count-NON_BREAKING").textContent = diff.nonBreakingCount;

  renderEndpointRail(diff.changes);
  renderChangeItems(diff.changes);
}

function renderEndpointRail(changes) {
  const rail = document.getElementById("endpointRailList");
  if (!rail) return;
  rail.innerHTML = "";

  if (!changes.length) {
    rail.innerHTML = `<div class="endpoint-item">No path mutations found</div>`;
    return;
  }

  changes.forEach((c) => {
    const row = document.createElement("div");
    row.className = "endpoint-item";
    const pathSpan = document.createElement("span");
    pathSpan.className = "endpoint-path";
    pathSpan.textContent = c.path;

    const tag = document.createElement("span");
    tag.className = `tag-flat ${c.severity === "BREAKING" ? "tag-breaking" : "tag-safe"}`;
    tag.textContent = c.severity === "BREAKING" ? "BREAK" : "ADD";

    row.append(pathSpan, tag);
    rail.appendChild(row);
  });
}

function renderChangeItems(changes) {
  const container = document.getElementById("changesContainer");
  const filtered = changes.filter((c) => currentFilter === "ALL" || c.severity === currentFilter);
  document.getElementById("paneSummaryMeta").textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;
  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = `<div class="diff-entry"><div class="diff-details">No changes match the selected filter.</div></div>`;
    return;
  }

  filtered.forEach((c, idx) => {
    const item = document.createElement("div");
    item.className = "diff-entry";
    const symbol = c.severity === "BREAKING" ? "- BREAKING" : (c.severity === "NON_BREAKING" ? "+ NON_BREAKING" : "~ INFO");

    item.innerHTML = `
      <div class="diff-entry-top">
        <div class="diff-header-left">
          <span class="mono diff-idx">#${idx + 1}</span>
          <span class="diff-marker ${escapeHtml(c.severity)}">${symbol}</span>
          <span class="diff-type">${escapeHtml(c.type)}${c.compatibility ? " · " + escapeHtml(c.compatibility) : ""}</span>
        </div>
        <code class="diff-path">${escapeHtml(c.path)}</code>
      </div>
      <div class="diff-msg">${escapeHtml(c.message)}</div>
      <div class="diff-details">${escapeHtml(c.details)}</div>
    `;
    container.appendChild(item);
  });
}

function filterChanges(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn[data-filter]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.filter === filter);
  });
  if (currentDiff) {
    renderChangeItems(currentDiff.changes);
  }
}

function downloadMarkdown() {
  if (!currentDiff) return;
  downloadBlob(window.apiDriftEngine.generateMarkdownChangelog(currentDiff), "api-drift-changelog.md", "text/markdown");
}

function downloadJSON() {
  if (!currentDiff) return;
  downloadBlob(JSON.stringify(currentDiff, null, 2), "api-drift-report.json", "application/json");
}

function downloadSARIF() {
  if (!currentDiff) return;
  downloadBlob(window.apiDriftEngine.generateSARIF(currentDiff), "api-drift-report.sarif.json", "application/sarif+json");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function setupWaitlistForm() {
  const form = document.getElementById("proWaitlistForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (CHECKOUT_ENABLED) return;

    const emailEl = document.getElementById("proWaitlistEmail");
    const consentEl = document.getElementById("proWaitlistConsent");
    const adviceEl = document.getElementById("proWaitlistAdvice");
    const msgEl = document.getElementById("proWaitlistMsg");
    const btn = document.getElementById("proWaitlistSubmit");

    const email = (emailEl.value || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msgEl.className = "waitlist-msg is-err";
      msgEl.textContent = "Please enter a valid email address.";
      emailEl.focus();
      return;
    }
    if (!consentEl.checked) {
      msgEl.className = "waitlist-msg is-err";
      msgEl.textContent = "Explicit GDPR consent is required before submitting.";
      consentEl.focus();
      return;
    }

    const adviceFocus = (adviceEl && adviceEl.value ? adviceEl.value : "").trim();
    const consentText = (consentEl.closest("label")?.textContent || "Explicit GDPR consent for one-time launch notification.").replace(/\s+/g, " ").trim().slice(0, 500);
    const consentTs = new Date().toISOString();

    btn.disabled = true;
    msgEl.className = "waitlist-msg";
    msgEl.textContent = "Registering...";

    try {
      const resp = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email,
          project: form.dataset.project || "api-drift-sentinel",
          advice_focus: adviceFocus,
          consent: true,
          consent_text: consentText,
          consent_ts: consentTs
        })
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        msgEl.className = "waitlist-msg is-ok";
        msgEl.textContent = "Registered on the Priority Waitlist (0 EUR today).";
        form.reset();
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (err) {
      msgEl.className = "waitlist-msg is-err";
      msgEl.textContent = `Connection error: ${err.message}. Please retry.`;
    } finally {
      btn.disabled = false;
    }
  });
}
