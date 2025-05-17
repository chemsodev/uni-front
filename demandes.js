// GLOBALS
let currentUser = null;
let authToken = null;
let isBackendAvailable = true;
let requestsLoaded = false; // Flag to track if requests have been loaded

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
  
  // If switching to suivi tab, ensure requests are loaded (only once)
  if (tabName === "suivi" && !requestsLoaded) {
    loadUserRequests();
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

  // Initialize sidebar user information
  initializeSidebar();

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
      
      // Load requests but don't switch to that tab yet
      await loadUserRequests();
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

  // Set up tab functionality
  setupTabNavigation();
  
  // Set up file input displays
  setupFileInputDisplays();

  // Direct submit button handling for each form
  setupSubmitForForm("section-change-form", "SECTION", "section");
  setupSubmitForForm("td-change-form", "TD_GROUP", "td");
  setupSubmitForForm("tp-change-form", "TP_GROUP", "tp");

  // Also handle the "new-request-btn" if it exists
  const newRequestBtn = document.getElementById("new-request-btn");
  if (newRequestBtn) {
    newRequestBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // Click the first tab button to switch to formulaires
      const formulairesTab = document.querySelector('[data-target="formulaires"]');
      if (formulairesTab) formulairesTab.click();
    });
  }
  
  // Add specific listener for the suivi tab to make sure requests load
  const suiviTabButton = document.querySelector('[data-target="suivi"]');
  if (suiviTabButton) {
    suiviTabButton.addEventListener('click', function() {
      console.log("Suivi tab clicked, reloading requests");
      loadUserRequests();
    });
  }
});

// Setup file input displays
function setupFileInputDisplays() {
  setupFileInput('section-document', 'section-file-name');
  setupFileInput('td-document', 'td-file-name');
  setupFileInput('tp-document', 'tp-file-name');
}

// Function to display selected file name
function setupFileInput(inputId, displayId) {
  const fileInput = document.getElementById(inputId);
  const fileNameDisplay = document.getElementById(displayId);
  
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        fileNameDisplay.textContent = this.files[0].name;
        fileNameDisplay.title = this.files[0].name;
        fileNameDisplay.style.display = 'block';
      } else {
        fileNameDisplay.textContent = '';
        fileNameDisplay.style.display = 'none';
      }
    });
  }
}

// Improved tab navigation setup
function setupTabNavigation() {
  console.log("Setting up tab navigation");
  // Set up main tab buttons
  document.querySelectorAll('.tab-container > .tab-buttons > .tab-button').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      console.log(`Tab clicked: ${target}`);
      
      // Hide all main tabs
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Deactivate all main tab buttons
      document.querySelectorAll('.tab-container > .tab-buttons > .tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show selected tab and activate button
      const selectedTab = document.getElementById(target);
      if (selectedTab) {
        selectedTab.classList.add('active');
        console.log(`Activated tab: ${target}`);
      } else {
        console.error(`Tab element not found with id: ${target}`);
      }
      this.classList.add('active');
      
      // If switching to "suivi" tab, only load requests if not already loaded
      if (target === 'suivi') {
        console.log("Handling Suivi tab activation");
        if (!requestsLoaded) {
          console.log("Loading requests for first time");
          loadUserRequests();
        } else {
          console.log("Requests already loaded, skipping reload");
        }
        // Make sure the suivi tab is visible by forcing display
        document.getElementById('suivi').style.display = 'block';
      }
      
      // If switching to forms tab, activate first sub-tab
      if (target === 'formulaires') {
        const firstSubTab = document.querySelector('#formulaires .tab-buttons .tab-button');
        if (firstSubTab) {
          firstSubTab.click();
        }
      }
    });
  });
  
  // Set up form sub-tab buttons
  document.querySelectorAll('#formulaires .tab-buttons .tab-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
      const target = this.getAttribute('data-target');
      
      // Hide all form cards
      document.querySelectorAll('.form-card').forEach(form => {
        form.classList.remove('active');
      });
      
      // Deactivate all form tab buttons
      document.querySelectorAll('#formulaires .tab-buttons .tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show selected form and activate button
      const selectedForm = document.getElementById(target);
      if (selectedForm) {
        selectedForm.classList.add('active');
        console.log(`Activated form: ${target}`);
      } else {
        console.error(`Form element not found with id: ${target}`);
      }
      this.classList.add('active');
    });
  });
  
  // Add a test click on the Suivi tab once DOM is fully loaded
  setTimeout(() => {
    console.log("Testing tab navigation");
    const suiviTab = document.querySelector('[data-target="suivi"]');
    const formulairesTab = document.querySelector('[data-target="formulaires"]');
    if (suiviTab) {
      console.log("Suivi tab found:", suiviTab);
    } else {
      console.error("Suivi tab not found");
    }
    if (formulairesTab) {
      console.log("Formulaires tab found:", formulairesTab);
    } else {
      console.error("Formulaires tab not found");
    }
  }, 1000);
}

// Check backend connectivity
async function checkBackendConnectivity() {
  try {
    // Try loading student data instead of using a non-existent health endpoint
    const response = await fetch("http://localhost:3000/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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

// Fixed form submission setup
function setupSubmitForForm(formId, requestType, prefix) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form not found: ${formId}`);
    return;
  }
  
  // Add proper form submission handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitRequest(requestType, prefix, e);
    return false;
  });
  
  // Also handle direct button click
  const submitBtn = form.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      submitRequest(requestType, prefix, e);
    });
  }
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
        el.textContent = data?.name || "Non assigné";
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
  
  // Save to localStorage
  localStorage.setItem("studentData", JSON.stringify(data));
  
  // Update sidebar with fresh data
  const userAvatar = document.getElementById("userAvatar");
  const userFullName = document.getElementById("userFullName");
  const userId = document.getElementById("userId");
  
  if (userAvatar) {
    const initials = ((data.firstName || "")[0] || "") + ((data.lastName || "")[0] || "");
    userAvatar.textContent = initials.toUpperCase();
  }
  
  if (userFullName) {
    userFullName.textContent = `${data.firstName || ""} ${data.lastName || ""}`;
  }
  
  if (userId) {
    userId.textContent = data.matricule || data.email || "";
  }
  
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
    console.log("Student data:", studentData);

    let url;
    if (type === "section") {
      // For section changes, find sections in the same specialty and level
      const specialty = studentData.sections?.[0]?.specialty;
      const level = studentData.sections?.[0]?.level;
      
      if (!specialty || !level) {
        console.warn("No specialty or level assigned for student, using fallback data");
        return getFallbackGroups(type);
      }
      
      // For sections, we'll request all sections with the same specialty and level
      url = `http://localhost:3000/api/sections?specialty=${specialty}&level=${level}`;
      console.log(`Finding available sections for specialty: ${specialty}, level: ${level}`);
    } else {
      // For group changes (TD/TP), we need to get all groups in the same section
      const sectionId = studentData.sections?.[0]?.id;
      if (!sectionId) {
        console.warn("No section assigned for student, using fallback data");
        return getFallbackGroups(type);
      }
      
      // For TD/TP groups, we can find all groups from the student's section data
      const currentGroups = studentData.sections?.[0]?.groupes || [];
      
      // Filter groups by type (td or tp)
      const availableGroups = currentGroups.filter(group => 
        group.type === type && group.id !== currentId
      );
      
      console.log(`Found ${availableGroups.length} ${type} groups in section ${studentData.sections?.[0]?.name}`);
      return availableGroups;
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
async function submitRequest(type, prefix, e) {
  const form = document.getElementById(`${prefix}-change-form`);
  if (!form) return;

  // Prevent default form submission behavior
  e.preventDefault();

  // Clear previous messages
  const errorDiv = document.getElementById(`${prefix}-form-error`);
  const successDiv = document.getElementById(`${prefix}-form-success`);
  if (errorDiv) errorDiv.style.display = "none";
  if (successDiv) successDiv.style.display = "none";

  try {
    // Validate required fields
    const requestedSelect = document.getElementById(`requested-${prefix}`);
    const requested = requestedSelect.value;
    const reason = document.getElementById(`${prefix}-reason`).value;
    const justification = document.getElementById(`${prefix}-justification`).value;

    // Log form values for debugging
    console.log(`Form values for ${prefix}:`, {
      requested,
      reason,
      justification,
      hasJustification: Boolean(justification),
      justificationLength: justification?.length
    });

    if (!requested) {
      throw new Error(`Veuillez sélectionner ${prefix === 'section' ? 'une section' : 'un groupe'} souhaité`);
    }
    
    if (!reason) {
      throw new Error("Veuillez sélectionner un motif");
    }
    
    if (!justification || justification.trim() === '') {
      throw new Error("La justification détaillée est obligatoire");
    }

    // Get current ID
    const currentElement = document.getElementById(`current-${prefix}`);
    const currentId = currentElement.dataset.id;
    
    if (!currentId) {
      throw new Error("Information d'affectation actuelle manquante");
    }

    // Make sure IDs are valid
    console.log("Current ID:", currentId);
    console.log("Requested ID:", requested);

    // Map the request type to backend enum values
    let requestType;
    let isSection = false;
    
    switch (type) {
      case "SECTION":
        requestType = "section";
        isSection = true;
        break;
      case "TD_GROUP":
        requestType = "groupe_td";
        break;
      case "TP_GROUP":
        requestType = "groupe_tp";
        break;
      default:
        requestType = type.toLowerCase();
    }

    // Show loading indicator
    const submitBtn = form.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours...";
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

    let response;
    
    // Create FormData for all request types
    const formData = new FormData();
    
    // Common fields - ensure justification is trimmed and not empty
    formData.append("requestType", requestType);
    formData.append("reason", reason);
    formData.append("justification", justification.trim());
    
    // Add file if present for all forms
    const fileInput = document.getElementById(`${prefix}-document`);
    if (fileInput?.files.length > 0) {
      formData.append("document", fileInput.files[0]);
    }
    
    // Debug: Log FormData contents (can't directly console.log FormData)
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      if (pair[0] === 'document') {
        console.log(pair[0], pair[1].name, pair[1].size);
      } else {
        console.log(pair[0], pair[1]);
      }
    }
    
    if (isSection) {
      // For section changes
      formData.append("currentSectionId", currentId.trim());
      formData.append("requestedSectionId", requested.trim());
      
      console.log("Submitting section change request with document");
      
      // For section changes, create a separate JSON payload for required fields and include
      // document in FormData. We need to ensure justification is sent correctly.
      const sectionData = {
      requestType,
        currentSectionId: currentId.trim(),
        requestedSectionId: requested.trim(),
        reason,
        justification: justification.trim()
      };
      
      // If we have a document, use multipart FormData
      if (fileInput?.files.length > 0) {
        formData.append("data", JSON.stringify(sectionData));
        
        // Submit request with multipart form data for file upload
        response = await fetch("http://localhost:3000/api/change-requests/section-with-document", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${authToken}`
            // Don't set Content-Type for FormData
          },
          body: formData
        });
      } else {
        // No document, use regular JSON request
        response = await fetch("http://localhost:3000/api/change-requests/section", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(sectionData)
        });
      }
    } else {
      // For TD/TP group changes
      formData.append("currentId", currentId.trim());
      formData.append("requestedId", requested.trim());
      
      console.log("Submitting group change request with document");

      // Submit request for group change with file
      response = await fetch("http://localhost:3000/api/change-requests/group", {
      method: "POST",
        headers: { 
          Authorization: `Bearer ${authToken}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });
    }

    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Soumettre la demande";
    }

    // Check response status
    if (!response.ok) {
      let errorMessage = `Erreur lors de l'envoi de la demande (${response.status})`;
      
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error("Failed to parse error response", e);
      }
      
      throw new Error(errorMessage);
    }

    // Show success and reload requests
    if (successDiv) {
      successDiv.textContent = "Demande soumise avec succès.";
      successDiv.style.display = "block";
      
      // Automatically scroll to show success message
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    form.reset();
    
    // Reset file name displays
    const fileNameDisplay = document.getElementById(`${prefix}-file-name`);
    if (fileNameDisplay) {
      fileNameDisplay.textContent = '';
      fileNameDisplay.style.display = 'none';
    }
    
    // Switch to the requests tab
    const requestsTab = document.querySelector('[data-target="suivi"]');
    if (requestsTab) {
      requestsTab.click();
    }
    
    // Load updated requests
    loadUserRequests();
  } catch (e) {
    console.error("Submission error:", e);
    if (errorDiv) {
      errorDiv.textContent = e.message || "Erreur lors de la soumission.";
      errorDiv.style.display = "block";
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Reset button state in case of error
    const submitBtn = form.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Soumettre la demande";
    }
  }
}

// REQUESTS TABLE
async function loadUserRequests() {
  console.log("Loading user requests...");
  const tbody = document.getElementById("requests-table-body");
  const loading = document.getElementById("requests-loading");
  const empty = document.getElementById("no-requests-message");
  const table = document.getElementById("requests-table");
  const errorDiv = document.getElementById("requests-error");
  const suiviTab = document.getElementById("suivi");

  if (!tbody || !loading || !empty || !table || !errorDiv) {
    console.error("One or more required elements not found for requests tab");
    console.log({
      tbody: !!tbody,
      loading: !!loading,
      empty: !!empty,
      table: !!table,
      errorDiv: !!errorDiv,
      suiviTab: !!suiviTab
    });
    return;
  }

  // Check if we're already loading requests
  if (loading.style.display === "block") {
    console.log("Request loading already in progress, skipping duplicate call");
    return;
  }

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

    console.log("Loaded requests:", {
      changeRequests: changeRequests.length,
      profileRequests: profileRequests.length
    });

    // Use a Map to track unique requests by ID
    const uniqueRequestsMap = new Map();
    
    // Add change requests to the map
    changeRequests.forEach(req => {
      uniqueRequestsMap.set(req.id, req);
    });
    
    // Add profile requests to the map
    profileRequests.forEach(req => {
      uniqueRequestsMap.set(req.id, req);
    });
    
    // Convert map values to array and sort
    const allRequests = Array.from(uniqueRequestsMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (allRequests.length === 0) {
      empty.style.display = "block";
      table.style.display = "none";
    } else {
      allRequests.forEach((req) => {
        const row = createRequestRow(req);
        tbody.appendChild(row);
      });
      table.style.display = "table";
      empty.style.display = "none";
    }
    
    // Mark requests as loaded
    requestsLoaded = true;
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
        type: "SECTION",
        createdAt: new Date(Date.now() - 86400000 * 5),
        current: "B",
        requested: "A",
        status: "APPROVED",
        requestType: "change",
      },
      {
        id: 2,
        type: "TD_GROUP",
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
  const typeStr = String(type).toLowerCase();
  
  switch (typeStr) {
    case "section":
      return "Changement de Section";
    case "groupe_td":
    case "td_group":
      return "Changement de Groupe TD";
    case "groupe_tp":
    case "tp_group":
      return "Changement de Groupe TP";
    case "profile_update":
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
      case "cancelled":
        return '<span class="status-chip status-cancelled">Annulée</span>';
      default:
        return '<span class="status-chip status-pending">En cours</span>';
    }
  } else {
    switch (statusText) {
      case "approved":
        return '<span class="status-chip status-approved">Acceptée</span>';
      case "rejected":
        return '<span class="status-chip status-rejected">Refusée</span>';
      case "cancelled":
        return '<span class="status-chip status-cancelled">Annulée</span>';
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

// GLOBAL AUTH FUNCTIONS
function logout() {
  console.log("Logout called");
  
  // Clear all auth tokens
  localStorage.removeItem("etudiant_token");
  sessionStorage.removeItem("etudiant_token");
  
  // Clear data
  localStorage.removeItem("studentData");
  localStorage.removeItem("offlineRequests"); 
  localStorage.removeItem("lastLogin");
  localStorage.removeItem("userPreferences");
  
  // Clear other session data
  sessionStorage.clear();
  
  // Redirect to login
  window.location.href = "index.html";
}

// Initialize sidebar with user information
function initializeSidebar() {
  // Check if we need to load student data
  const studentData = JSON.parse(localStorage.getItem("studentData") || "null");
  const token = sessionStorage.getItem("etudiant_token") || localStorage.getItem("etudiant_token");
  
  if (!token) {
    // No token, redirect to login
    window.location.href = "etudiant-login.html";
    return;
  }

  // Get the user avatar, name and ID elements
  const userAvatar = document.getElementById("userAvatar");
  const userFullName = document.getElementById("userFullName");
  const userId = document.getElementById("userId");
  
  // If we have studentData cached, use it
  if (studentData) {
    if (userAvatar) {
      const initials = ((studentData.firstName || "")[0] || "") + ((studentData.lastName || "")[0] || "");
      userAvatar.textContent = initials.toUpperCase();
    }
    
    if (userFullName) {
      userFullName.textContent = `${studentData.firstName || ""} ${studentData.lastName || ""}`;
    }
    
    if (userId) {
      userId.textContent = studentData.matricule || studentData.email || "";
    }
  } else {
    // No cached data, sidebar will be updated after fetchStudentData is called
    if (userAvatar) userAvatar.textContent = "...";
    if (userFullName) userFullName.textContent = "Chargement...";
    if (userId) userId.textContent = "...";
  }
}
