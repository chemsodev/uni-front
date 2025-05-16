// demandes.js

// --- GLOBALS ---
let currentUser = null;
let authToken = null;
let isBackendAvailable = true;

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", async function () {
  // 1. Load navbar
  await loadNavbar();

  // 2. Auth & user data
  try {
    authToken =
      sessionStorage.getItem("etudiant_token") ||
      localStorage.getItem("etudiant_token");
    if (!authToken) {
      window.location.href = "etudiant-login.html";
      return;
    }
    // Verify token
    const userData = await verifyToken();
    if (!userData) return;
    if (userData.adminRole !== "etudiant")
      throw new Error("Access restricted to students");
    currentUser = { id: userData.userId, email: userData.email };
    // Load user data and requests
    await loadUserData();
    loadUserRequests();
  } catch (e) {
    isBackendAvailable = false;
    loadFallbackData();
  }

  // Tab logic
  setupTabs();

  // Form submit buttons
  document
    .getElementById("section-change-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      submitRequest("SECTION_CHANGE", "section");
    });
  document.getElementById("td-change-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitRequest("TD_GROUP_CHANGE", "td");
  });
  document.getElementById("tp-change-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitRequest("TP_GROUP_CHANGE", "tp");
  });
});

// --- NAVBAR ---
async function loadNavbar() {
  const nav = await fetch("etudiant-nav.html").then((r) => r.text());
  document.getElementById("navbar-container").innerHTML = nav;
  // Set active link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (
      link.getAttribute("href") === window.location.pathname.split("/").pop()
    ) {
      link.classList.add("active");
    }
  });
}

// --- AUTH ---
async function verifyToken() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Token verification failed");
    return await res.json();
  } catch (e) {
    isBackendAvailable = false;
    return null;
  }
}

// --- TABS ---
function setupTabs() {
  // Main tabs
  document.querySelectorAll(".tab-buttons > .tab-button").forEach((btn) => {
    btn.addEventListener("click", function (evt) {
      // Remove active from all main tab buttons
      document
        .querySelectorAll(".tab-buttons > .tab-button")
        .forEach((b) => b.classList.remove("active"));
      // Hide all main tab contents
      document
        .querySelectorAll(".tab-content")
        .forEach((tc) => tc.classList.remove("active"));
      // Activate the clicked tab
      btn.classList.add("active");
      const tabName = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
      const tabContent = document.getElementById(tabName);
      if (tabContent) {
        tabContent.classList.add("active");
        tabContent.style.display = "block";
      }
      // Hide all other tab contents
      document.querySelectorAll(".tab-content").forEach((tc) => {
        if (tc !== tabContent) tc.style.display = "none";
      });
      // If switching to formulaires, reset sub-tabs to first
      if (tabName === "formulaires") {
        const firstSubBtn = document.querySelector(
          "#formulaires .tab-buttons .tab-button"
        );
        if (firstSubBtn) firstSubBtn.click();
      }
    });
  });
  // Sub-tabs (forms)
  document
    .querySelectorAll("#formulaires .tab-buttons .tab-button")
    .forEach((btn) => {
      btn.addEventListener("click", function (evt) {
        // Remove active from all sub-tab buttons
        document
          .querySelectorAll("#formulaires .tab-buttons .tab-button")
          .forEach((b) => b.classList.remove("active"));
        // Hide all sub-tab contents
        document
          .querySelectorAll("#formulaires .tab-content.form-card")
          .forEach((tc) => {
            tc.classList.remove("active");
            tc.style.display = "none";
          });
        // Activate the clicked sub-tab
        btn.classList.add("active");
        const tabName = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
        const tabContent = document.getElementById(tabName);
        if (tabContent) {
          tabContent.classList.add("active");
          tabContent.style.display = "block";
        }
      });
    });
}

// --- USER DATA & FORM OPTIONS ---
async function loadUserData() {
  let studentData = null;
  try {
    const studentDataJson =
      localStorage.getItem("studentData") ||
      sessionStorage.getItem("studentData");
    if (studentDataJson) studentData = JSON.parse(studentDataJson);
    if (isBackendAvailable && currentUser?.id) {
      const res = await fetch(
        `http://localhost:3000/api/etudiants/${currentUser.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (res.ok) {
        studentData = await res.json();
        localStorage.setItem("studentData", JSON.stringify(studentData));
      }
    }
    // Set current values
    document.getElementById("current-section").value =
      studentData.sections?.[0]?.name || "Non assigné";
    document.getElementById("current-td").value =
      studentData.tdGroupe?.name || "Non assigné";
    document.getElementById("current-tp").value =
      studentData.tpGroupe?.name || "Non assigné";
    // Load options
    await loadAvailableSections(studentData.sections?.[0]?.id);
    await loadAvailableTdGroups(studentData.tdGroupe?.id);
    await loadAvailableTpGroups(studentData.tpGroupe?.id);
  } catch (e) {
    isBackendAvailable = false;
    loadFallbackData();
  }
}

async function loadAvailableSections(currentSectionId) {
  const sectionSelect = document.getElementById("requested-section");
  sectionSelect.innerHTML =
    '<option value="">Sélectionnez une section</option>';
  try {
    if (!isBackendAvailable) throw new Error("Backend unavailable");
    const res = await fetch("http://localhost:3000/api/sections", {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Failed to fetch sections");
    const sections = await res.json();
    sections.forEach((section) => {
      if (section.id !== currentSectionId) {
        const option = document.createElement("option");
        option.value = section.id;
        option.textContent = section.name || `Section ${section.id}`;
        sectionSelect.appendChild(option);
      }
    });
  } catch (e) {
    ["A", "C", "D"].forEach((section) => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = `Section ${section}`;
      sectionSelect.appendChild(option);
    });
  }
}
async function loadAvailableTdGroups(currentTdId) {
  const tdSelect = document.getElementById("requested-td");
  tdSelect.innerHTML = '<option value="">Sélectionnez un groupe</option>';
  try {
    if (!isBackendAvailable) throw new Error("Backend unavailable");
    const res = await fetch("http://localhost:3000/api/td-groupes", {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Failed to fetch TD groups");
    const groups = await res.json();
    groups.forEach((group) => {
      if (group.id !== currentTdId) {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.name || `Groupe TD ${group.id}`;
        tdSelect.appendChild(option);
      }
    });
  } catch (e) {
    [1, 2, 4, 5].forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = `Groupe TD ${group}`;
      tdSelect.appendChild(option);
    });
  }
}
async function loadAvailableTpGroups(currentTpId) {
  const tpSelect = document.getElementById("requested-tp");
  tpSelect.innerHTML = '<option value="">Sélectionnez un groupe</option>';
  try {
    if (!isBackendAvailable) throw new Error("Backend unavailable");
    const res = await fetch("http://localhost:3000/api/tp-groupes", {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Failed to fetch TP groups");
    const groups = await res.json();
    groups.forEach((group) => {
      if (group.id !== currentTpId) {
        const option = document.createElement("option");
        option.value = group.id;
        option.textContent = group.name || `Groupe TP ${group.id}`;
        tpSelect.appendChild(option);
      }
    });
  } catch (e) {
    [1, 3, 4].forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = `Groupe TP ${group}`;
      tpSelect.appendChild(option);
    });
  }
}

// --- FORM SUBMISSION ---
async function submitRequest(type, formPrefix) {
  const form = document.getElementById(`${formPrefix}-change-form`);
  const errorDiv = document.getElementById(`${formPrefix}-form-error`);
  const successDiv = document.getElementById(`${formPrefix}-form-success`);
  errorDiv.style.display = "none";
  successDiv.style.display = "none";
  // Gather data
  let data = {};
  try {
    if (formPrefix === "section") {
      data = {
        type,
        current: document.getElementById("current-section").value,
        requested: document.getElementById("requested-section").value,
        reason: document.getElementById("section-reason").value,
        justification: document.getElementById("section-justification").value,
      };
    } else if (formPrefix === "td") {
      data = {
        type,
        current: document.getElementById("current-td").value,
        requested: document.getElementById("requested-td").value,
        reason: document.getElementById("td-reason").value,
        justification: document.getElementById("td-justification").value,
      };
    } else if (formPrefix === "tp") {
      data = {
        type,
        current: document.getElementById("current-tp").value,
        requested: document.getElementById("requested-tp").value,
        reason: document.getElementById("tp-reason").value,
        justification: document.getElementById("tp-justification").value,
      };
    }
    // File
    const fileInput = document.getElementById(`${formPrefix}-document`);
    const file =
      fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
    // Backend
    if (!isBackendAvailable)
      throw new Error("Mode hors ligne: demande non envoyée");
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    if (file) formData.append("document", file);
    const res = await fetch("http://localhost:3000/api/demandes", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Erreur lors de l'envoi de la demande");
    successDiv.textContent = "Demande soumise avec succès.";
    successDiv.style.display = "block";
    form.reset();
    loadUserRequests();
  } catch (e) {
    errorDiv.textContent = e.message || "Erreur lors de la soumission.";
    errorDiv.style.display = "block";
  }
}
window.submitRequest = submitRequest;

// --- REQUESTS TABLE ---
async function loadUserRequests() {
  const table = document.getElementById("requests-table");
  const tbody = document.getElementById("requests-table-body");
  const loading = document.getElementById("requests-loading");
  const empty = document.getElementById("no-requests-message");
  tbody.innerHTML = "";
  loading.style.display = "block";
  table.style.display = "none";
  empty.style.display = "none";
  try {
    if (!isBackendAvailable) throw new Error("offline");
    const res = await fetch("http://localhost:3000/api/demandes/mes", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error("Erreur lors du chargement des demandes");
    const demandes = await res.json();
    if (!demandes.length) {
      empty.style.display = "block";
      loading.style.display = "none";
      return;
    }
    demandes.forEach((req) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${getRequestTypeLabel(req.type)}</td>
        <td>${formatDate(req.createdAt)}</td>
        <td>${req.current} → ${req.requested}</td>
        <td>${getStatusLabel(req.status)}</td>
        <td><button class="action-btn" onclick="alert('Détails: ' + JSON.stringify(${JSON.stringify(
          req
        )}))">Voir détails</button></td>
      `;
      tbody.appendChild(row);
    });
    table.style.display = "table";
    loading.style.display = "none";
  } catch (e) {
    // Fallback: show nothing or offline sample
    loading.style.display = "none";
    table.style.display = "none";
    empty.style.display = "block";
  }
}

// --- HELPERS ---
function getRequestTypeLabel(type) {
  switch (type) {
    case "SECTION_CHANGE":
      return "Changement de Section";
    case "TD_GROUP_CHANGE":
      return "Changement de Groupe TD";
    case "TP_GROUP_CHANGE":
      return "Changement de Groupe TP";
    default:
      return type;
  }
}
function getStatusLabel(status) {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return '<span class="status-chip status-pending">En cours</span>';
    case "APPROVED":
      return '<span class="status-chip status-approved">Acceptée</span>';
    case "REJECTED":
      return '<span class="status-chip status-rejected">Refusée</span>';
    default:
      return status;
  }
}
function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
}

// --- OFFLINE FALLBACK ---
function loadFallbackData() {
  // Add offline mode notice
  if (!document.querySelector(".alert.alert-warning")) {
    const offlineNotice = document.createElement("div");
    offlineNotice.className = "alert alert-warning";
    offlineNotice.innerHTML = `<strong>Mode hors ligne:</strong> Le serveur est actuellement indisponible. Certaines fonctionnalités sont limitées. Les demandes ne seront pas envoyées tant que la connexion ne sera pas rétablie. <button style='margin-left:10px;padding:5px 10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer' onclick='location.reload()'>Réessayer la connexion</button>`;
    document.querySelector(".tab-container").prepend(offlineNotice);
  }
  // Set placeholder values
  document.getElementById("current-section").value = "B";
  document.getElementById("current-td").value = "3";
  document.getElementById("current-tp").value = "2";
  // Dummy options
  ["A", "C", "D"].forEach((section) => {
    const option = document.createElement("option");
    option.value = section;
    option.textContent = `Section ${section}`;
    document.getElementById("requested-section").appendChild(option);
  });
  [1, 2, 4, 5].forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = `Groupe TD ${group}`;
    document.getElementById("requested-td").appendChild(option);
  });
  [1, 3, 4].forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = `Groupe TP ${group}`;
    document.getElementById("requested-tp").appendChild(option);
  });
  // Sample requests
  const tbody = document.getElementById("requests-table-body");
  tbody.innerHTML = "";
  [
    {
      type: "SECTION_CHANGE",
      createdAt: new Date(Date.now() - 86400000 * 5),
      current: "B",
      requested: "A",
      status: "APPROVED",
    },
    {
      type: "TD_GROUP_CHANGE",
      createdAt: new Date(),
      current: "3",
      requested: "2",
      status: "PENDING",
    },
  ].forEach((req) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${getRequestTypeLabel(req.type)}</td>
      <td>${formatDate(req.createdAt)}</td>
      <td>${req.current} → ${req.requested}</td>
      <td>${getStatusLabel(req.status)}</td>
      <td><button class="action-btn" onclick="alert('Mode hors ligne: détails non disponibles')">Voir détails</button></td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById("requests-table").style.display = "table";
  document.getElementById("requests-loading").style.display = "none";
}
