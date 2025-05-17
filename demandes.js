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
  
  console.log(`Setting up form submission for ${formId}`, {
    requestType,
    prefix,
    formFound: !!form
  });
  
  // Add proper form submission handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log(`Form ${formId} submitted`);
    
    // Validate request type and prefix match - especially for TP groups
    if (requestType === "TP_GROUP" && prefix !== "tp") {
      console.error("Mismatch between requestType and prefix:", { requestType, prefix });
      alert("Erreur de configuration du formulaire. Veuillez rafraîchir la page.");
      return;
    }
    
    submitRequest(requestType, prefix, e);
    return false;
  });
  
  // Also handle direct button click
  const submitBtn = form.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log(`Submit button clicked for ${formId}`);
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

    console.log("Student data loaded:", {
      section: studentData.sections?.[0]?.name,
      tdGroup: studentData.tdGroupe?.name,
      tpGroup: studentData.tpGroupe?.name,
      tdId: studentData.tdGroupe?.id,
      tpId: studentData.tpGroupe?.id
    });

    // Set current values with IDs
    const setCurrent = (elementId, data) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.textContent = data?.name || "Non assigné";
        el.dataset.id = data?.id || "";
        console.log(`Set ${elementId} to:`, { name: data?.name, id: data?.id });
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
  
  // Show loading state
  select.disabled = true;
  select.innerHTML = `<option value="">Chargement...</option>`;

  try {
    const groups = isBackendAvailable
      ? await fetchGroups(type, currentId)
      : getFallbackGroups(type);

    // Reset select after loading
    select.innerHTML = `<option value="">Sélectionnez...</option>`;
    
    // Filter out invalid options first
    const validGroups = groups.filter(group => {
      // Filter out the current group - can't switch to same group
      if (group.id?.toString() === currentId?.toString()) {
        return false;
      }
      
      // Filter out full groups that can't accept more students
      if (group.capacity && group.currentOccupancy && group.capacity <= group.currentOccupancy) {
        console.log(`Filtering out full group: ${group.name} (${group.currentOccupancy}/${group.capacity})`);
        return false;
      }
      
      return true;
    });
    
    console.log(`Showing ${validGroups.length} valid options for ${type} from ${groups.length} total`);
    
    // Update the select with valid options
    validGroups.forEach((group) => {
      // Add the type to the name if it's not already there
      let displayName = group.name;
      
      // Add capacity information if available
      if (group.capacity && group.currentOccupancy) {
        // Add the type to the name if it's not already there
        if (type === "tp" && !displayName.toLowerCase().includes("tp")) {
          displayName = `${displayName} (TP)`;
        } else if (type === "td" && !displayName.toLowerCase().includes("td")) {
          displayName = `${displayName} (TD)`;
        }
        
        // Add occupancy info
        displayName += ` - ${group.currentOccupancy}/${group.capacity}`;
      } else {
        // Just add the type if needed
        if (type === "tp" && !displayName.toLowerCase().includes("tp")) {
          displayName = `${displayName} (TP)`;
        } else if (type === "td" && !displayName.toLowerCase().includes("td")) {
          displayName = `${displayName} (TD)`;
        }
      }
      
      const option = new Option(displayName, group.id);
      select.add(option);
    });
    
    // Re-enable the select
    select.disabled = false;
    
    // If there are no options, show a message
    if (validGroups.length === 0) {
      select.innerHTML = `<option value="">Aucune option disponible</option>`;
      select.disabled = true;
      
      // Show an error message
      const errorDivId = `${type}-form-error`;
      const errorDiv = document.getElementById(errorDivId);
      if (errorDiv) {
        errorDiv.textContent = "Aucun groupe disponible pour changement. Les groupes peuvent être complets ou vous êtes déjà dans le seul groupe disponible.";
        errorDiv.style.display = "block";
      }
    }
  } catch (e) {
    console.error(`Error loading ${type} groups:`, e);
    
    // Reset select and add fallback options
    select.innerHTML = `<option value="">Sélectionnez...</option>`;
    getFallbackGroups(type).forEach((group) => {
      select.add(new Option(group.name, group.id));
    });
    
    // Re-enable the select
    select.disabled = false;
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
    console.log("Student data for group fetch:", studentData);
    console.log(`Fetching groups for type: ${type}, currentId: ${currentId}`);

    // Log TP and TD groups directly
    if (studentData.tpGroupe) {
      console.log("TP Group found in student data:", studentData.tpGroupe);
    }
    if (studentData.tdGroupe) {
      console.log("TD Group found in student data:", studentData.tdGroupe);
    }

    // First, let's try to get all available groups via a more direct endpoint
    try {
      // Special endpoint to get available groups for changing (if it exists)
      const availableGroupsUrl = `http://localhost:3000/api/etudiants/${currentUser.id}/available-${type}-groups`;
      console.log(`Trying to fetch available groups from: ${availableGroupsUrl}`);
      
      const availableRes = await fetch(availableGroupsUrl, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: AbortSignal.timeout(5000),
      });
      
      if (availableRes.ok) {
        const availableGroups = await availableRes.json();
        console.log(`Got ${availableGroups.length} available ${type} groups from API:`, availableGroups);
        return availableGroups;
      } else {
        console.log(`Available groups endpoint not found or failed, using fallback approach`);
      }
    } catch (availableError) {
      console.log(`Error getting available groups, using fallback approach:`, availableError);
    }

    // Continue with the fallback approach
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
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error(`Failed to fetch ${type} groups`);
      const allSections = await res.json();
      
      // Filter out the current section and any full sections
      return allSections.filter(section => {
        return section.id !== currentId && section.currentOccupancy < section.capacity;
      });
    } else {
      // For group changes (TD/TP), we need to get all groups in the same section
      const sectionId = studentData.sections?.[0]?.id;
      if (!sectionId) {
        console.warn("No section assigned for student, using fallback data");
        return getFallbackGroups(type);
      }
      
      // Try to fetch all groups for this section from a dedicated endpoint
      const groupsUrl = `http://localhost:3000/api/sections/${sectionId}/groupes`;
      
      try {
        const groupsRes = await fetch(groupsUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        });
        
        if (groupsRes.ok) {
          const allGroups = await groupsRes.json();
          console.log(`Fetched ${allGroups.length} groups for section ${sectionId}`);
          
          // Filter groups by type and availability
          const filteredGroups = allGroups.filter(group => {
            return group.type === type && 
                  group.id !== currentId && 
                  (!group.capacity || group.currentOccupancy < group.capacity);
          });
          
          console.log(`Found ${filteredGroups.length} available ${type} groups`, filteredGroups);
          return filteredGroups;
        }
      } catch (groupsError) {
        console.log("Error fetching groups from dedicated endpoint:", groupsError);
      }
      
      // Fall back to using groups from student data
      const currentGroups = studentData.sections?.[0]?.groupes || [];
      
      console.log(`Found ${currentGroups.length} total groups in section`, {
        sectionName: studentData.sections?.[0]?.name,
        groups: currentGroups.map(g => `${g.type} ${g.name}`)
      });
      
      // Need a more reliable way to filter groups due to data inconsistency
      // For TP form, filter groups that most likely are TP groups
      let availableGroups;
      if (type === 'tp') {
        // For TP groups, filter based on group name containing TP or database type
        availableGroups = currentGroups.filter(group => {
          const isNamedTP = group.name.toLowerCase().includes('tp');
          const isTypeTP = group.type === 'tp';
          const isNotCurrentGroup = group.id !== currentId;
          const hasCapacity = !group.capacity || group.currentOccupancy < group.capacity;
          
          // Log each group for debugging
          console.log(`Filtering TP group: ${group.name}`, {
            isNamedTP,
            isTypeTP,
            isValidTP: isNamedTP || isTypeTP,
            isNotCurrentGroup,
            hasCapacity
          });
          
          // Include if either the name contains TP or type is tp, and meets other criteria
          return (isNamedTP || isTypeTP) && isNotCurrentGroup && hasCapacity;
        });
      } else {
        // For TD groups, similar approach but for TD groups
        availableGroups = currentGroups.filter(group => {
          const isNamedTD = group.name.toLowerCase().includes('td');
          const isTypeTD = group.type === 'td';
          const isNotCurrentGroup = group.id !== currentId;
          const hasCapacity = !group.capacity || group.currentOccupancy < group.capacity;
          
          // Log each group for debugging
          console.log(`Filtering TD group: ${group.name}`, {
            isNamedTD,
            isTypeTD,
            isValidTD: isNamedTD || isTypeTD,
            isNotCurrentGroup,
            hasCapacity
          });
          
          // Include if either the name contains TD or type is td, and meets other criteria
          return (isNamedTD || isTypeTD) && isNotCurrentGroup && hasCapacity;
        });
      }
      
      console.log(`Found ${availableGroups.length} ${type} groups in section ${studentData.sections?.[0]?.name}`, {
        availableGroups: availableGroups.map(g => ({ id: g.id, name: g.name, type: g.type }))
      });
      
      return availableGroups;
    }
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
    console.log("Form prefix:", prefix);
    console.log("Request type:", type);

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

    // Debug the current IDs
    console.log(`Processing ${type} change request`);
    console.log(`Current ${prefix} ID:`, currentId);
    console.log(`Element ID used: current-${prefix}`);
    
    // Enforce that group changes must maintain the same group type
    if (!isSection) {
      // For TD or TP changes, we need to be flexible since there's a data inconsistency
      // where TP groups might have type 'td' in the database
      const formType = prefix; // Use the form prefix (tp or td) instead of relying on database type
      
      // Get selected option text to check if it looks like a TD or TP group
      const selectedOption = requestedSelect.options[requestedSelect.selectedIndex];
      const requestedText = selectedOption ? selectedOption.text : "";
      
      console.log("Validating group types:", {
        formType,
        requestedText,
        currentElement: currentElement.textContent,
        requestType
      });
      
      // For TP form, we should be selecting groups that have TP in their name
      if (formType === "tp" && !requestedText.toLowerCase().includes("tp")) {
        throw new Error("Les demandes de changement doivent concerner des groupes du même type (TP vers TP)");
      }
      
      // For TD form, we should be selecting groups that have TD in their name
      if (formType === "td" && !requestedText.toLowerCase().includes("td")) {
        throw new Error("Les demandes de changement doivent concerner des groupes du même type (TD vers TD)");
      }
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
      console.log("Request type:", requestType);
      console.log("Current ID used:", currentId);
      console.log("Requested ID used:", requested);

      // Create payload for debugging
      const groupChangeData = {
        requestType,
        currentId: currentId.trim(),
        requestedId: requested.trim(),
        reason,
        justification: justification.trim()
      };
      console.log("Group change request payload:", groupChangeData);

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

  // Clear existing data
  tbody.innerHTML = "";
  loading.style.display = "block";
  table.style.display = "none";
  empty.style.display = "none";
  errorDiv.style.display = "none";

  try {
    if (!isBackendAvailable) throw new Error("offline");

    // Verify we have a valid auth token
    if (!authToken) {
      console.error("No auth token available, redirecting to login");
      alert("Votre session a expiré. Veuillez vous reconnecter.");
      logout();
      return;
    }

    // Check if the token is still valid
    try {
      const tokenCheck = await fetch("http://localhost:3000/api/auth/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (!tokenCheck.ok) {
        console.error("Token validation failed:", tokenCheck.status);
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        logout();
        return;
      }
    } catch (tokenError) {
      console.warn("Token check failed:", tokenError);
      // Continue anyway, maybe just network issue
    }

    // Load both request types
    console.log("Fetching change requests and profile requests...");
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

    // Store all requests globally for filtering
    window.allUserRequests = allRequests;
    
    // Check if we need to add search functionality
    if (!document.getElementById('requests-search')) {
      // Add search/filter controls if they don't exist
      const filterControls = document.createElement('div');
      filterControls.className = 'filter-controls';
      filterControls.innerHTML = `
        <div class="search-container">
          <input type="text" id="requests-search" placeholder="Rechercher une demande...">
          <button id="requests-search-btn"><i class="fas fa-search"></i> Rechercher</button>
        </div>
        <div class="filter-dropdown">
          <select id="requests-status-filter">
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
      `;
      
      // Insert before the table
      table.parentNode.insertBefore(filterControls, table);
      
      // Add event listeners for search and filter
      document.getElementById('requests-search-btn').addEventListener('click', filterUserRequests);
      document.getElementById('requests-search').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') filterUserRequests();
      });
      document.getElementById('requests-status-filter').addEventListener('change', filterUserRequests);
    }
    
    // Display all requests initially
    displayUserRequests(allRequests);
    
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

// Filter user requests based on search and status
function filterUserRequests() {
  // Get filter values
  const searchTerm = document.getElementById('requests-search')?.value.toLowerCase().trim() || '';
  const statusFilter = document.getElementById('requests-status-filter')?.value || 'all';
  
  // Get stored requests
  const allRequests = window.allUserRequests || [];
  
  if (allRequests.length === 0) {
    console.log("No requests to filter");
    return;
  }
  
  console.log("Filtering requests with:", { searchTerm, statusFilter });
  
  // Apply filters
  const filteredRequests = allRequests.filter(req => {
    // Status filter
    const statusMatch = statusFilter === 'all' || req.status?.toLowerCase() === statusFilter;
    
    // Search term filter
    const searchMatch = !searchTerm || 
      req.type?.toLowerCase().includes(searchTerm) ||
      req.current?.toLowerCase().includes(searchTerm) ||
      req.requested?.toLowerCase().includes(searchTerm) ||
      getRequestTypeLabel(req.type).toLowerCase().includes(searchTerm) ||
      getStatusLabel(req.status, req.requestType === 'profile').toLowerCase().includes(searchTerm);
    
    return statusMatch && searchMatch;
  });
  
  // Display filtered requests
  displayUserRequests(filteredRequests);
}

// Display user requests in the table
function displayUserRequests(requests) {
  const tbody = document.getElementById("requests-table-body");
  const empty = document.getElementById("no-requests-message");
  const table = document.getElementById("requests-table");
  
  if (!tbody || !empty || !table) return;
  
  tbody.innerHTML = "";
  
  if (requests.length === 0) {
    empty.style.display = "block";
    table.style.display = "none";
  } else {
    requests.forEach((req) => {
      const row = createRequestRow(req);
      tbody.appendChild(row);
    });
    table.style.display = "table";
    empty.style.display = "none";
  }
}

async function fetchRequests(endpoint) {
  try {
    console.log(`Fetching ${endpoint} from ${`http://localhost:3000/api/${endpoint}/my-requests`}`);
    
    // Make sure we have a valid token
    if (!authToken) {
      console.error("No auth token available for request");
      return [];
    }
    
    const res = await fetch(
      `http://localhost:3000/api/${endpoint}/my-requests`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // Increase timeout to 10 seconds
      }
    );

    // Log the response status and headers for debugging
    console.log(`Response for ${endpoint}:`, {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type')
    });

    if (!res.ok) {
      console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
      // Try to get error details if available
      try {
        const errorData = await res.json();
        console.error("Error details:", errorData);
      } catch (e) {
        // Ignore error parsing errors
      }
      return [];
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} ${endpoint}`, data.slice(0, 2)); // Log first 2 items

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
    console.error(`Error in fetchRequests(${endpoint}):`, e);
    
    // Check for CORS or network errors
    if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
      console.error("Network error - check CORS settings or server availability");
    } else if (e.name === 'AbortError') {
      console.error("Request timed out - server may be slow or unresponsive");
    }
    
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
