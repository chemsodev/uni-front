// GLOBALS
let currentUser = null;
let authToken = null;
let isBackendAvailable = true;

// TAB MANAGEMENT
function openTab(evt, tabName) {
  evt.preventDefault();

  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Deactivate all buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab and activate button
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
    evt.currentTarget.classList.add("active");
  }

  // If switching to forms tab, activate first sub-tab
  if (tabName === "formulaires") {
    const firstSubTab = document.querySelector("[data-target='section-form']");
    firstSubTab?.click();
  }
}

function openSubTab(evt, tabName) {
  evt.preventDefault();

  // Hide all form cards
  document.querySelectorAll(".form-card").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Deactivate all buttons
  document.querySelectorAll("#formulaires .tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected form and activate button
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
    evt.currentTarget.classList.add("active");
  }
}

// INITIAL SETUP
document.addEventListener("DOMContentLoaded", async () => {
  await loadNavbar();

  // Auth setup
  authToken =
    sessionStorage.getItem("etudiant_token") ||
    localStorage.getItem("etudiant_token");
  if (!authToken) {
    window.location.href = "etudiant-login.html";
    return;
  }

  try {
    // Check backend connectivity first
    await checkBackendConnectivity();

    const userData = await verifyToken();
    if (userData) {
      currentUser = { id: userData.userId, email: userData.email };
      await loadUserData();
      loadUserRequests();
    } else if (!isBackendAvailable) {
      // No user data but backend is down
      console.warn("Backend is not available, loading fallback data");
      loadFallbackData();
    } else {
      // Auth issue - redirect to login
      console.error("Authentication failed, redirecting to login");
      sessionStorage.removeItem("etudiant_token");
      localStorage.removeItem("etudiant_token");
      window.location.href = "etudiant-login.html";
      return;
    }
  } catch (e) {
    console.error("Error during initialization:", e);
    isBackendAvailable = false;
    loadFallbackData();
  }

  // Tab event listeners
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const target = this.dataset.target;
      if (target) {
        if (this.closest("#formulaires")) {
          openSubTab(e, target);
        } else {
          openTab(e, target);
        }
      }
    });
  });

  // Add click listeners for the main tab buttons with onclick attributes
  document
    .querySelectorAll(".tab-container > .tab-buttons > .tab-button")
    .forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const target =
          e.target.textContent.trim() === "Formulaires de demande"
            ? "formulaires"
            : "suivi";
        openTab(e, target);
      });
    });

  // Add click listeners for sub-tab buttons with onclick attributes
  document
    .querySelectorAll("#formulaires > .tab-buttons > .tab-button")
    .forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const target = btn.textContent.trim().includes("Section")
          ? "section-form"
          : btn.textContent.trim().includes("TD")
          ? "td-form"
          : "tp-form";
        openSubTab(e, target);
      });
    });

  // Global guard to prevent form submissions
  document.addEventListener(
    "submit",
    function (e) {
      // Prevent ANY form from submitting normally
      e.preventDefault();
      console.log("Global form submission prevented");
      return false;
    },
    true
  ); // Use capture phase

  // Complete removal of standard form behavior for all forms
  document.querySelectorAll("form").forEach((form) => {
    // Remove action attribute if present
    if (form.hasAttribute("action")) {
      form.removeAttribute("action");
    }

    // Remove method attribute if present
    if (form.hasAttribute("method")) {
      form.removeAttribute("method");
    }

    // Add explicit submit-prevention listener
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Form submission prevented:", this.id);
        return false;
      },
      true
    ); // Use capture phase
  });

  // Direct submit button handling for each form
  setupSubmitForForm("section-change-form", "SECTION_CHANGE", "section");
  setupSubmitForForm("td-change-form", "TD_GROUP_CHANGE", "td");
  setupSubmitForForm("tp-change-form", "TP_GROUP_CHANGE", "tp");

  // Also handle the "new-request-btn" if it exists
  const newRequestBtn = document.getElementById("new-request-btn");
  if (newRequestBtn) {
    newRequestBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openTab(e, "formulaires");
    });
  }
});

// Check backend connectivity
async function checkBackendConnectivity() {
  try {
    const response = await fetch("http://localhost:3000/api/health", {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });

    isBackendAvailable = response.ok;
    return response.ok;
  } catch (error) {
    console.warn("Backend connectivity check failed:", error);
    isBackendAvailable = false;
    return false;
  }
}

// Helper function to set up submit handlers for a specific form
function setupSubmitForForm(formId, requestType, prefix) {
  const form = document.getElementById(formId);
  const submitBtn = form?.querySelector(".submit-btn");

  if (!form || !submitBtn) return;

  // Remove any existing click handlers
  submitBtn.replaceWith(submitBtn.cloneNode(true));

  // Get the fresh button reference
  const newSubmitBtn = form.querySelector(".submit-btn");

  // Add click handler directly to button
  newSubmitBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Submit button clicked for ${formId}`);
    submitRequest(requestType, prefix);
    return false;
  });
}

// DATA LOADING
async function loadUserData() {
  try {
    const studentData = isBackendAvailable
      ? await fetchStudentData()
      : JSON.parse(localStorage.getItem("studentData")) || {};

    // Set current values with IDs
    const setCurrent = (elementId, data) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = data?.name || "Non assigné";
        el.dataset.id = data?.id || "";
      }
    };

    setCurrent("current-section", studentData.sections?.[0]);
    setCurrent("current-td", studentData.tdGroupe);
    setCurrent("current-tp", studentData.tpGroupe);

    // Load options
    await loadAvailableOptions("section", studentData.sections?.[0]?.id);
    await loadAvailableOptions("td", studentData.tdGroupe?.id);
    await loadAvailableOptions("tp", studentData.tpGroupe?.id);
  } catch (e) {
    console.error("Error loading user data:", e);
    loadFallbackData();
  }
}

async function fetchStudentData() {
  const res = await fetch(
    `http://localhost:3000/api/etudiants/${currentUser.id}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!res.ok) throw new Error("Failed to fetch student data");
  const data = await res.json();
  localStorage.setItem("studentData", JSON.stringify(data));
  return data;
}

async function loadAvailableOptions(type, currentId) {
  const select = document.getElementById(`requested-${type}`);
  if (!select) return;

  select.innerHTML = `<option value="">Sélectionnez...</option>`;

  try {
    const groups = isBackendAvailable
      ? await fetchGroups(type, currentId)
      : getFallbackGroups(type);

    groups.forEach((group) => {
      if (group.id.toString() !== currentId?.toString()) {
        const option = new Option(group.name, group.id);
        select.add(option);
      }
    });
  } catch (e) {
    console.error(`Error loading ${type} groups:`, e);
    getFallbackGroups(type).forEach((group) => {
      select.add(new Option(group.name, group.id));
    });
  }
}

async function fetchGroups(type, currentId) {
  if (!currentUser?.id) return [];

  try {
    // First get student data to get section/filiere info
    const studentRes = await fetch(
      `http://localhost:3000/api/etudiants/${currentUser.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!studentRes.ok) throw new Error("Failed to fetch student data");
    const studentData = await studentRes.json();

    let url;
    if (type === "section") {
      const filiereId = studentData.sections[0]?.id;
      if (!filiereId) {
        console.warn("No filiere assigned for student, using fallback data");
        return getFallbackGroups(type);
      }
      url = `http://localhost:3000/api/sections?filiereId=${filiereId}`;
    } else {
      const sectionId = studentData.sections?.[0]?.id;
      if (!sectionId) {
        console.warn("No section assigned for student, using fallback data");
        return getFallbackGroups(type);
      }
      url = `http://localhost:3000/api/groupes/available?type=${type}&sectionId=${sectionId}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Failed to fetch ${type} groups`);
    return await res.json();
  } catch (e) {
    console.error(`Error fetching ${type} groups:`, e);
    return getFallbackGroups(type);
  }
}

function getFallbackGroups(type) {
  if (type === "section") {
    return ["A", "C", "D"].map((name, i) => ({
      id: i + 1,
      name: `Section ${name}`,
    }));
  } else if (type === "td") {
    return [1, 2, 4, 5].map((id) => ({ id, name: `Groupe TD ${id}` }));
  } else {
    return [1, 3, 4].map((id) => ({ id, name: `Groupe TP ${id}` }));
  }
}

// FORM SUBMISSION
async function submitRequest(type, prefix) {
  const form = document.getElementById(`${prefix}-change-form`);
  if (!form) return;

  // Clear previous messages
  const errorDiv = document.getElementById(`${prefix}-form-error`);
  const successDiv = document.getElementById(`${prefix}-form-success`);
  if (errorDiv) errorDiv.style.display = "none";
  if (successDiv) successDiv.style.display = "none";

  try {
    // Validate required fields
    const requested = document.getElementById(`requested-${prefix}`).value;
    const reason = document.getElementById(`${prefix}-reason`).value;
    const justification = document.getElementById(
      `${prefix}-justification`
    ).value;

    if (!requested || !reason || !justification) {
      throw new Error("Veuillez remplir tous les champs obligatoires");
    }

    // Map the request type to backend enum values
    let requestType;
    switch (type) {
      case "SECTION_CHANGE":
        requestType = "SECTION";
        break;
      case "TD_GROUP_CHANGE":
        requestType = "TD_GROUP";
        break;
      case "TP_GROUP_CHANGE":
        requestType = "TP_GROUP";
        break;
      default:
        requestType = type;
    }

    // Prepare form data
    const formData = new FormData();
    // Add the request type using the proper backend field name
    formData.append("requestType", requestType);

    // Add current and requested IDs
    formData.append(
      "currentId",
      document.getElementById(`current-${prefix}`).dataset.id
    );
    formData.append("requestedId", requested);

    // Add justification text with the reason and detailed justification
    const fullJustification = `Motif: ${reason}\n\n${justification}`;
    formData.append("justification", fullJustification);

    // Add file if present
    const fileInput = document.getElementById(`${prefix}-document`);
    if (fileInput?.files.length > 0) {
      formData.append("document", fileInput.files[0]);
    }

    if (!isBackendAvailable) {
      // For offline mode, simulate success
      if (successDiv) {
        successDiv.textContent = "Demande enregistrée en mode hors ligne.";
        successDiv.style.display = "block";
      }
      form.reset();
      loadUserRequests();
      return;
    }

    console.log("Submitting form with data:", {
      requestType,
      currentId: document.getElementById(`current-${prefix}`).dataset.id,
      requestedId: requested,
      justification: fullJustification,
      hasFile: fileInput?.files.length > 0,
    });

    // Submit request
    const res = await fetch("http://localhost:3000/api/change-requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      // DO NOT set content-type header when using FormData with files
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Erreur lors de l'envoi de la demande"
      );
    }

    // Show success and reload requests
    if (successDiv) {
      successDiv.textContent = "Demande soumise avec succès.";
      successDiv.style.display = "block";
    }
    form.reset();
    loadUserRequests();
  } catch (e) {
    console.error("Submission error:", e);
    if (errorDiv) {
      errorDiv.textContent = e.message || "Erreur lors de la soumission.";
      errorDiv.style.display = "block";
    }
  }
}

// REQUESTS TABLE
async function loadUserRequests() {
  const tbody = document.getElementById("requests-table-body");
  const loading = document.getElementById("requests-loading");
  const empty = document.getElementById("no-requests-message");
  const table = document.getElementById("requests-table");
  const errorDiv = document.getElementById("requests-error");

  if (!tbody || !loading || !empty || !table || !errorDiv) return;

  tbody.innerHTML = "";
  loading.style.display = "block";
  table.style.display = "none";
  empty.style.display = "none";
  errorDiv.style.display = "none";

  try {
    if (!isBackendAvailable) throw new Error("offline");

    const [changeRequests, profileRequests] = await Promise.all([
      fetchRequests("change-requests"),
      fetchRequests("profile-requests"),
    ]);

    const allRequests = [...changeRequests, ...profileRequests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (allRequests.length === 0) {
      empty.style.display = "block";
    } else {
      allRequests.forEach((req) => {
        const row = createRequestRow(req);
        tbody.appendChild(row);
      });
      table.style.display = "table";
    }
  } catch (e) {
    console.error("Error loading requests:", e);
    if (isBackendAvailable) {
      errorDiv.textContent =
        "Erreur lors du chargement des demandes. Veuillez réessayer plus tard.";
      errorDiv.style.display = "block";
    }
    loadFallbackRequests();
  } finally {
    loading.style.display = "none";
  }
}

async function fetchRequests(endpoint) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/${endpoint}/my-requests`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((req) => ({
      ...req,
      requestType: endpoint === "change-requests" ? "change" : "profile",
      type:
        req.requestType ||
        (endpoint === "change-requests" ? "CHANGE_REQUEST" : "PROFILE_UPDATE"),
      current: req.currentSection?.name || req.currentGroupe?.name || "Profile",
      requested:
        req.requestedSection?.name ||
        req.requestedGroupe?.name ||
        req.fields?.join(", ") ||
        "Information personnelle",
    }));
  } catch (e) {
    return [];
  }
}

function createRequestRow(request) {
  const row = document.createElement("tr");
  const isProfileRequest = request.requestType === "profile";

  row.innerHTML = `
    <td>${getRequestTypeLabel(request.type)}</td>
    <td>${formatDate(request.createdAt)}</td>
    <td>${request.current} ${isProfileRequest ? "" : "→"} ${
    request.requested
  }</td>
    <td>${getStatusLabel(request.status, isProfileRequest)}</td>
    <td>
      <a href="${
        isProfileRequest ? "profile-request.html" : "demande-details.html"
      }?id=${request.id}"
         class="action-btn">
        Voir détails
      </a>
    </td>
  `;

  return row;
}

function loadFallbackRequests() {
  const tbody = document.getElementById("requests-table-body");
  const empty = document.getElementById("no-requests-message");
  const table = document.getElementById("requests-table");

  if (!tbody || !empty || !table) return;

  tbody.innerHTML = "";
  empty.style.display = "none";
  table.style.display = "none";

  if (!isBackendAvailable) {
    const fallbackRequests = [
      {
        id: 1,
        type: "SECTION_CHANGE",
        createdAt: new Date(Date.now() - 86400000 * 5),
        current: "B",
        requested: "A",
        status: "APPROVED",
        requestType: "change",
      },
      {
        id: 2,
        type: "TD_GROUP_CHANGE",
        createdAt: new Date(),
        current: "3",
        requested: "2",
        status: "PENDING",
        requestType: "change",
      },
      {
        id: 3,
        type: "PROFILE_UPDATE",
        createdAt: new Date(Date.now() - 86400000 * 2),
        current: "Profile",
        requested: "Email, Phone",
        status: "pending",
        requestType: "profile",
      },
    ];

    fallbackRequests.forEach((req) => {
      const row = createRequestRow(req);
      tbody.appendChild(row);
    });

    table.style.display = "table";
  } else {
    empty.style.display = "block";
  }
}

// HELPERS
function getRequestTypeLabel(type) {
  switch (type) {
    case "SECTION_CHANGE":
      return "Changement de Section";
    case "TD_GROUP_CHANGE":
      return "Changement de Groupe TD";
    case "TP_GROUP_CHANGE":
      return "Changement de Groupe TP";
    case "PROFILE_UPDATE":
      return "Modification de profil";
    default:
      return type;
  }
}

function getStatusLabel(status, isProfile = false) {
  const statusText = (status || "").toLowerCase();

  if (isProfile) {
    switch (statusText) {
      case "approved":
        return '<span class="status-chip status-approved">Acceptée</span>';
      case "rejected":
        return '<span class="status-chip status-rejected">Refusée</span>';
      default:
        return '<span class="status-chip status-pending">En cours</span>';
    }
  } else {
    switch (statusText) {
      case "approved":
        return '<span class="status-chip status-approved">Acceptée</span>';
      case "rejected":
        return '<span class="status-chip status-rejected">Refusée</span>';
      default:
        return '<span class="status-chip status-pending">En cours</span>';
    }
  }
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("fr-FR") : "-";
}

// NAVBAR
async function loadNavbar() {
  try {
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
  } catch (e) {
    console.error("Error loading navbar:", e);
  }
}

// AUTH
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

    if (!res.ok) {
      console.warn(`Token verification failed with status: ${res.status}`);
      // Don't mark as offline for 401/403 errors - those are auth issues
      if (res.status !== 401 && res.status !== 403) {
        isBackendAvailable = false;
      }
      return null;
    }

    // If we get here, backend is definitely available
    isBackendAvailable = true;
    return await res.json();
  } catch (e) {
    console.error("Token verification error:", e);
    // Only mark as offline for network-related errors
    if (
      e.name === "AbortError" ||
      e.name === "TypeError" ||
      e.message.includes("fetch")
    ) {
      isBackendAvailable = false;
    }
    return null;
  }
}

// OFFLINE FALLBACK
function loadFallbackData() {
  // Add offline notice
  if (!document.querySelector(".alert.alert-warning")) {
    const notice = document.createElement("div");
    notice.className = "alert alert-warning";
    notice.innerHTML = `
      <strong>Mode hors ligne:</strong>
      Le serveur est actuellement indisponible. Certaines fonctionnalités sont limitées.
      <button onclick="location.reload()" style="margin-left:10px;padding:5px 10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer">
        Réessayer la connexion
      </button>
    `;
    document.querySelector(".tab-container").prepend(notice);
  }

  // Set fallback values
  document.getElementById("current-section").value = "B";
  document.getElementById("current-section").dataset.id = "2";
  document.getElementById("current-td").value = "TD3";
  document.getElementById("current-td").dataset.id = "3";
  document.getElementById("current-tp").value = "TP2";
  document.getElementById("current-tp").dataset.id = "2";

  // Load fallback options
  loadAvailableOptions("section", "2");
  loadAvailableOptions("td", "3");
  loadAvailableOptions("tp", "2");
}
