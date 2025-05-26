// GLOBALS
let currentUser = null;
let authToken = null;
let isBackendAvailable = true;
let requestsLoaded = false; // Flag to track if requests have been loaded
let tokenRefreshAttempted = false; // Flag to prevent infinite refresh loops

// Fallback data for when backend is unavailable
function getFallbackGroups(type) {
  switch (type) {
    case "section":
      return [
        { id: "s1", name: "Section A" },
        { id: "s2", name: "Section B" },
        { id: "s3", name: "Section C" },
      ];
    case "td":
      return [
        { id: "td1", name: "TD 1" },
        { id: "td2", name: "TD 2" },
        { id: "td3", name: "TD 3" },
      ];
    case "tp":
      return [
        { id: "tp1", name: "TP 1" },
        { id: "tp2", name: "TP 2" },
        { id: "tp3", name: "TP 3" },
      ];
    default:
      return [];
  }
}

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

    // Add diagnostics button event listener
    document.getElementById("diagnostic-btn")?.addEventListener("click", () => {
      checkStudentGroupAssignments();
    });
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
      console.log("New request button clicked, switching to forms tab");
      // Click the first tab button to switch to formulaires
      const formulairesTab = document.querySelector(
        '[data-target="formulaires"]'
      );
      if (formulairesTab) {
        // Manually trigger the click event
        const clickEvent = new Event("click");
        formulairesTab.dispatchEvent(clickEvent);
      }
    });
  }

  // Add specific listener for the suivi tab to make sure requests load
  const suiviTabButton = document.querySelector('[data-target="suivi"]');
  if (suiviTabButton) {
    suiviTabButton.addEventListener("click", function () {
      console.log("Suivi tab clicked, reloading requests");
      loadUserRequests();
    });
  }
});

// Initialize sidebar with user information
function initializeSidebar() {
  try {
    // Try to load user data from localStorage if available
    const storedData = localStorage.getItem("studentData");
    if (storedData) {
      const userData = JSON.parse(storedData);

      const userAvatar = document.getElementById("userAvatar");
      const userFullName = document.getElementById("userFullName");
      const userId = document.getElementById("userId");

      if (userAvatar) {
        const initials =
          ((userData.firstName || "")[0] || "") +
          ((userData.lastName || "")[0] || "");
        userAvatar.textContent = initials.toUpperCase() || "ET";
      }

      if (userFullName) {
        userFullName.textContent =
          `${userData.firstName || ""} ${userData.lastName || ""}` ||
          "Étudiant";
      }

      if (userId) {
        userId.textContent = userData.matricule || userData.email || "";
      }
    }
  } catch (e) {
    console.error("Error initializing sidebar:", e);
  }
}

// Setup file input displays
function setupFileInputDisplays() {
  setupFileInput("section-document", "section-file-name");
  setupFileInput("td-document", "td-file-name");
  setupFileInput("tp-document", "tp-file-name");
}

// Function to display selected file name
function setupFileInput(inputId, displayId) {
  const fileInput = document.getElementById(inputId);
  const fileNameDisplay = document.getElementById(displayId);

  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        fileNameDisplay.textContent = this.files[0].name;
        fileNameDisplay.title = this.files[0].name;
        fileNameDisplay.style.display = "block";
      } else {
        fileNameDisplay.textContent = "";
        fileNameDisplay.style.display = "none";
      }
    });
  }
}

// Improved tab navigation setup
function setupTabNavigation() {
  console.log("Setting up tab navigation");
  // Set up main tab buttons
  document
    .querySelectorAll(".tab-container > .tab-buttons > .tab-button")
    .forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const target = this.getAttribute("data-target");
        console.log(`Tab clicked: ${target}`);

        // Hide all main tabs
        document.querySelectorAll(".tab-content").forEach((tab) => {
          tab.classList.remove("active");
        });

        // Deactivate all main tab buttons
        document
          .querySelectorAll(".tab-container > .tab-buttons > .tab-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Show selected tab and activate button
        const selectedTab = document.getElementById(target);
        if (selectedTab) {
          selectedTab.classList.add("active");
          console.log(`Activated tab: ${target}`);
        } else {
          console.error(`Tab element not found with id: ${target}`);
        }
        this.classList.add("active");

        // If switching to "suivi" tab, only load requests if not already loaded
        if (target === "suivi") {
          console.log("Handling Suivi tab activation");
          if (!requestsLoaded) {
            console.log("Loading requests for first time");
            loadUserRequests();
          } else {
            console.log("Requests already loaded, skipping reload");
          }
          // Make sure the suivi tab is visible by forcing display
          document.getElementById("suivi").style.display = "block";
        }

        // If switching to forms tab, activate first sub-tab
        if (target === "formulaires") {
          const firstSubTab = document.querySelector(
            "#formulaires .tab-buttons .tab-button"
          );
          if (firstSubTab) {
            firstSubTab.click();
          }
        }
      });
    });

  // Set up form sub-tab buttons
  document
    .querySelectorAll("#formulaires .tab-buttons .tab-button")
    .forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const target = this.getAttribute("data-target");

        // Hide all form cards
        document.querySelectorAll(".form-card").forEach((form) => {
          form.classList.remove("active");
        });

        // Deactivate all form tab buttons
        document
          .querySelectorAll("#formulaires .tab-buttons .tab-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Show selected form and activate button
        const selectedForm = document.getElementById(target);
        if (selectedForm) {
          selectedForm.classList.add("active");
          console.log(`Activated form: ${target}`);
        } else {
          console.error(`Form element not found with id: ${target}`);
        }
        this.classList.add("active");
      });
    });

  // Add a test click on the Suivi tab once DOM is fully loaded
  setTimeout(() => {
    console.log("Testing tab navigation");
    const suiviTab = document.querySelector('[data-target="suivi"]');
    const formulairesTab = document.querySelector(
      '[data-target="formulaires"]'
    );
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
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: "GET",
        signal: AbortSignal.timeout(3000),
      }
    );

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
    formFound: !!form,
  });

  // Add proper form submission handler
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log(`Form ${formId} submitted`);

    // Validate request type and prefix match - especially for TP groups
    if (requestType === "TP_GROUP" && prefix !== "tp") {
      console.error("Mismatch between requestType and prefix:", {
        requestType,
        prefix,
      });
      alert(
        "Erreur de configuration du formulaire. Veuillez rafraîchir la page."
      );
      return;
    }

    submitRequest(requestType, prefix, e);
    return false;
  });

  // Also handle direct button click
  const submitBtn = form.querySelector(".submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
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
      tpId: studentData.tpGroupe?.id,
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
    setCurrent("current-tp", studentData.tpGroupe); // Log current group IDs before loading options
    console.log("Current IDs being passed to loadAvailableOptions:", {
      sectionId: studentData.sections?.[0]?.id,
      tdGroupId: studentData.tdGroupe?.id,
      tpGroupId: studentData.tpGroupe?.id,
    });

    // Load options
    await loadAvailableOptions(
      "section",
      studentData.sections?.[0]?.id,
      studentData
    );
    await loadAvailableOptions("td", studentData.tdGroupe?.id, studentData);
    await loadAvailableOptions("tp", studentData.tpGroupe?.id, studentData);
  } catch (e) {
    console.error("Error loading user data:", e);
    loadFallbackData();
  }
}

async function fetchStudentData() {
  const res = await fetch(
    `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${currentUser.id}`,
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
    const initials =
      ((data.firstName || "")[0] || "") + ((data.lastName || "")[0] || "");
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

async function loadAvailableOptions(type, currentId, studentData) {
  const select = document.getElementById(`requested-${type}`);
  if (!select) return;

  select.innerHTML = `<option value="">Sélectionnez...</option>`;

  // Show loading state
  select.disabled = true;
  select.innerHTML = `<option value="">Chargement...</option>`;

  try {
    const groups = isBackendAvailable
      ? await fetchGroups(type, currentId, studentData)
      : getFallbackGroups(type);

    // Reset select after loading
    select.innerHTML = `<option value="">Sélectionnez...</option>`;

    // Filter out invalid options first
    const validGroups = groups.filter((group) => {
      // Filter out the current group - can't switch to same group
      const groupIdStr = String(group.id || "");
      const currentIdStr = String(currentId || "");
      return groupIdStr !== currentIdStr;
    });

    if (validGroups.length > 0) {
      // Update the select with valid options
      validGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.id;

        let displayName = group.name;

        // Add the type to the name if it's not already there
        if (type === "tp" && !displayName.toLowerCase().includes("tp")) {
          displayName = `${displayName} (TP)`;
        } else if (type === "td" && !displayName.toLowerCase().includes("td")) {
          displayName = `${displayName} (TD)`;
        }

        // Add capacity information to help with decision-making
        if (group.capacity && group.currentOccupancy !== undefined) {
          displayName += ` - ${group.currentOccupancy}/${group.capacity}`;

          // Add visual indicator for full groups
          if (group.currentOccupancy >= group.capacity) {
            displayName += " (Complet)";
          }
        }

        option.textContent = displayName;
        select.appendChild(option);
      });
    } else {
      // No valid options available - show a message
      const errorDivId = `${type}-form-error`;
      const errorDiv = document.getElementById(errorDivId);
      if (errorDiv) {
        // Construct appropriate message based on group type
        let message = `Aucun groupe ${
          type === "tp" ? "TP" : "TD"
        } n'est disponible pour changement. `;

        // Check if it's because there are no groups at all
        const allGroupsOfType = select.getAttribute("data-all-groups")
          ? JSON.parse(select.getAttribute("data-all-groups"))
          : [];

        if (allGroupsOfType.length <= 1) {
          message += "Vous êtes dans le seul groupe disponible.";
        } else {
          message +=
            "Vous êtes déjà dans le seul groupe disponible pour votre section.";
        }

        errorDiv.textContent = message;
        errorDiv.style.display = "block";
      }
    }
  } catch (e) {
    console.error(`Error loading ${type} groups:`, e);

    const errorDivId = `${type}-form-error`;
    const errorDiv = document.getElementById(errorDivId);
    if (errorDiv) {
      errorDiv.textContent = `Une erreur est survenue lors du chargement des groupes: ${e.message}`;
      errorDiv.style.display = "block";
    }

    // Reset select and add fallback options
    select.innerHTML = `<option value="">Erreur de chargement</option>`;
    getFallbackGroups(type).forEach((group) => {
      select.add(new Option(group.name, group.id));
    });
  }

  // Re-enable the select
  select.disabled = false;
}

async function fetchGroups(type, currentId, studentData) {
  try {
    // For type 'section' we handle it differently
    if (type === "section") {
      if (
        !studentData ||
        !studentData.sections ||
        studentData.sections.length === 0
      ) {
        console.warn("No sections data available, using fallback data");
        return getFallbackGroups(type);
      }

      // Get student's section details
      const studentSection = studentData.sections[0];
      const specialty = studentSection?.specialty;
      const level = studentSection?.level;

      // Use the findAll endpoint with query parameters
      const queryParams = new URLSearchParams();
      if (specialty) queryParams.append("specialty", specialty);
      if (level) queryParams.append("level", level);

      const res = await fetch(
        `https://unicersityback-production-1fbe.up.railway.app/api/sections?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!res.ok) throw new Error(`Failed to fetch ${type} groups`);
      const allSections = await res.json();

      // Only filter out the current section, ignore capacity
      return allSections.filter((section) => {
        return section.id !== currentId;
      });
    } else {
      // For group changes (TD/TP), we need to get all groups in the same section
      const sectionId = studentData.sections?.[0]?.id;
      if (!sectionId) {
        console.warn("No section assigned for student, using fallback data");
        return getFallbackGroups(type);
      }

      // Try to fetch all groups for this section from a dedicated endpoint
      const groupsUrl = `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/groupes`;

      try {
        const groupsRes = await fetch(groupsUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        });

        if (groupsRes.ok) {
          const allGroups = await groupsRes.json();
          console.log(
            `Fetched ${allGroups.length} groups for section ${sectionId}`
          );

          let availableGroups;
          if (type === "tp") {
            // For TP groups, filter based on group name containing TP or database type
            availableGroups = allGroups.filter((group) => {
              const isNamedTP = group.name.toLowerCase().includes("tp");
              const isTypeTP = group.type === "tp";
              const isNotCurrentGroup = group.id !== currentId;

              // Only check type and current group
              return (isNamedTP || isTypeTP) && isNotCurrentGroup;
            });
          } else {
            // For TD groups
            availableGroups = allGroups.filter((group) => {
              const isNamedTD = group.name.toLowerCase().includes("td");
              const isTypeTD = group.type === "td";
              const isNotCurrentGroup = group.id !== currentId;

              // Only check type and current group
              return (isNamedTD || isTypeTD) && isNotCurrentGroup;
            });
          }

          // Save all groups data for error message use
          const select = document.getElementById(`requested-${type}`);
          if (select) {
            select.setAttribute("data-all-groups", JSON.stringify(allGroups));
          }

          return availableGroups;
        }
      } catch (groupsError) {
        console.log(
          "Error fetching groups from dedicated endpoint:",
          groupsError
        );
      }

      // Fall back to using groups from student data
      const currentGroups = studentData.sections?.[0]?.groupes || [];

      if (type === "tp") {
        // For TP groups, filter based on group name containing TP or database type
        return currentGroups.filter((group) => {
          const isNamedTP = group.name.toLowerCase().includes("tp");
          const isTypeTP = group.type === "tp";
          const isNotCurrentGroup = group.id !== currentId;

          // Only check type and current group
          return (isNamedTP || isTypeTP) && isNotCurrentGroup;
        });
      } else {
        // For TD groups
        return currentGroups.filter((group) => {
          const isNamedTD = group.name.toLowerCase().includes("td");
          const isTypeTD = group.type === "td";
          const isNotCurrentGroup = group.id !== currentId;

          // Only check type and current group
          return (isNamedTD || isTypeTD) && isNotCurrentGroup;
        });
      }
    }
  } catch (e) {
    console.error(`Error fetching ${type} groups:`, e);
    return getFallbackGroups(type);
  }
}

// Diagnostic function to check student assignment
async function checkStudentGroupAssignments() {
  try {
    const diagnosticResults = document.getElementById("diagnostic-results");
    if (diagnosticResults) {
      diagnosticResults.innerHTML = "<p>Analyse en cours...</p>";
      diagnosticResults.style.display = "block";
    }

    if (!currentUser?.id) {
      console.error("User not logged in");
      if (diagnosticResults) {
        diagnosticResults.innerHTML =
          '<p class="error">Erreur: Utilisateur non connecté</p>';
      }
      return;
    }

    // Get student data
    const studentRes = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${currentUser.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!studentRes.ok) {
      console.error("Failed to fetch student data");
      if (diagnosticResults) {
        diagnosticResults.innerHTML =
          '<p class="error">Erreur: Impossible de récupérer les données de l\'étudiant</p>';
      }
      return;
    }

    const studentData = await studentRes.json();
    console.log("STUDENT DATA:", studentData);

    let html = "<h4>Informations Étudiant</h4>";
    html += `<p>Nom: ${studentData.firstName} ${studentData.lastName}</p>`;

    // Get section data
    const sectionId = studentData.sections?.[0]?.id;
    if (!sectionId) {
      html += '<p class="warning">Aucune section assignée à cet étudiant!</p>';
      if (diagnosticResults) {
        diagnosticResults.innerHTML = html;
      }
      return;
    }

    html += `<p>Section ID: ${sectionId}</p>`;

    const sectionRes = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!sectionRes.ok) {
      html +=
        '<p class="error">Erreur: Impossible de récupérer les données de la section</p>';
      if (diagnosticResults) {
        diagnosticResults.innerHTML = html;
      }
      return;
    }
    const sectionData = await sectionRes.json();
    console.log("SECTION DATA:", sectionData);

    html += `<p>Section: ${sectionData.name} (Spécialité: ${sectionData.specialty}, Niveau: ${sectionData.level})</p>`;

    // Get all available sections for the same specialty and level
    try {
      const availableSectionsRes = await fetch(
        `https://unicersityback-production-1fbe.up.railway.app/api/sections?specialty=${sectionData.specialty}&level=${sectionData.level}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (availableSectionsRes.ok) {
        const allSections = await availableSectionsRes.json();
        console.log("ALL SECTIONS:", allSections);

        // Filter out current section and full sections
        const availableSections = allSections.filter(
          (section) =>
            section.id !== sectionId &&
            (!section.capacity || section.currentOccupancy < section.capacity)
        );

        html += "<h4>Sections disponibles</h4>";

        if (allSections.length <= 1) {
          html +=
            "<p class=\"warning\">Il n'y a qu'une seule section pour votre spécialité et niveau.</p>";
        } else if (availableSections.length === 0) {
          html +=
            '<p class="warning">Toutes les autres sections sont complètes.</p>';
        } else {
          html += '<table class="diagnostic-table">';
          html +=
            "<tr><th>ID</th><th>Nom</th><th>Spécialité</th><th>Niveau</th><th>Occupants</th><th>Capacité</th></tr>";

          allSections.forEach((section) => {
            const isCurrent = section.id === sectionId;
            const hasCapacity =
              !section.capacity || section.currentOccupancy < section.capacity;

            html += `<tr class="${isCurrent ? "current" : ""} ${
              !hasCapacity ? "full" : ""
            }">
              <td>${section.id}</td>
              <td>${section.name}</td>
              <td>${section.specialty}</td>
              <td>${section.level}</td>
              <td>${section.currentOccupancy || 0}</td>
              <td>${section.capacity || "Non définie"}</td>
            </tr>`;
          });

          html += "</table>";
        }
      }
    } catch (error) {
      console.error("Error fetching all sections:", error);
      html +=
        '<p class="error">Erreur lors de la récupération des sections disponibles</p>';
    }

    // Get groups for this section
    const groupsRes = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/groupes`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!groupsRes.ok) {
      html +=
        '<p class="error">Erreur: Impossible de récupérer les groupes de la section</p>';
      if (diagnosticResults) {
        diagnosticResults.innerHTML = html;
      }
      return;
    }

    const groupsData = await groupsRes.json();
    console.log("ALL SECTION GROUPS:", groupsData); // Analyze TP groups
    const tpGroups = groupsData.filter((g) => g.type === "tp");
    console.log("TP GROUPS:", tpGroups);

    // Find student's TP group
    const studentTpGroup = studentData.tpGroupe;
    const currentTpGroupId = studentTpGroup?.id;

    html += "<h4>Groupes TP</h4>";
    if (currentTpGroupId) {
      html += `<p>Groupe TP actuel: ${
        studentTpGroup.name
      } (ID: ${currentTpGroupId} / Type: ${typeof currentTpGroupId})</p>`;
    } else {
      html += '<p class="warning">Aucun groupe TP assigné!</p>';
    }

    html += '<table class="diagnostic-table">';
    html +=
      "<tr><th>ID</th><th>Nom</th><th>Type</th><th>Occupants</th><th>Capacité</th><th>ID égalité</th><th>Disponible</th></tr>";

    tpGroups.forEach((group) => {
      // Check equality with all three methods
      const strictEqual = group.id === currentTpGroupId;
      const looseEqual = group.id == currentTpGroupId;
      const stringEqual = String(group.id) === String(currentTpGroupId);

      const isCurrent = stringEqual; // Use string comparison
      const hasCapacity =
        !group.capacity || group.currentOccupancy < group.capacity;
      const isAvailable = !isCurrent && hasCapacity;

      html += `<tr class="${isCurrent ? "current" : ""} ${
        !hasCapacity ? "full" : ""
      }">
        <td>${group.id}</td>
        <td>${group.name}</td>
        <td>${group.type}</td>
        <td>${group.currentOccupancy || 0}</td>
        <td>${group.capacity || "Non définie"}</td>
        <td>strict: ${strictEqual}, loose: ${looseEqual}, string: ${stringEqual}</td>
        <td>${isAvailable ? "Oui" : "Non"}</td>
      </tr>`;
    });

    html += "</table>"; // Analyze TD groups
    const tdGroups = groupsData.filter((g) => g.type === "td");
    console.log("TD GROUPS:", tdGroups);

    // Find student's TD group
    const studentTdGroup = studentData.tdGroupe;
    const currentTdGroupId = studentTdGroup?.id;

    html += "<h4>Groupes TD</h4>";
    if (currentTdGroupId) {
      html += `<p>Groupe TD actuel: ${
        studentTdGroup.name
      } (ID: ${currentTdGroupId} / Type: ${typeof currentTdGroupId})</p>`;
    } else {
      html += '<p class="warning">Aucun groupe TD assigné!</p>';
    }

    html += '<table class="diagnostic-table">';
    html +=
      "<tr><th>ID</th><th>Nom</th><th>Type</th><th>Occupants</th><th>Capacité</th><th>ID égalité</th><th>Disponible</th></tr>";

    tdGroups.forEach((group) => {
      // Check equality with all three methods
      const strictEqual = group.id === currentTdGroupId;
      const looseEqual = group.id == currentTdGroupId;
      const stringEqual = String(group.id) === String(currentTdGroupId);

      const isCurrent = stringEqual; // Use string comparison
      const hasCapacity =
        !group.capacity || group.currentOccupancy < group.capacity;
      const isAvailable = !isCurrent && hasCapacity;

      html += `<tr class="${isCurrent ? "current" : ""} ${
        !hasCapacity ? "full" : ""
      }">
        <td>${group.id}</td>
        <td>${group.name}</td>
        <td>${group.type}</td>
        <td>${group.currentOccupancy || 0}</td>
        <td>${group.capacity || "Non définie"}</td>
        <td>strict: ${strictEqual}, loose: ${looseEqual}, string: ${stringEqual}</td>
        <td>${isAvailable ? "Oui" : "Non"}</td>
      </tr>`;
    });

    html += "</table>";

    // Summary
    const availableTpGroups = tpGroups.filter(
      (g) =>
        g.id !== currentTpGroupId &&
        (!g.capacity || g.currentOccupancy < g.capacity)
    );

    const availableTdGroups = tdGroups.filter(
      (g) =>
        g.id !== currentTdGroupId &&
        (!g.capacity || g.currentOccupancy < g.capacity)
    ); // Get section availability info if we have it
    let availableSectionsSummary = "";
    try {
      // This variable should be defined in the section we added above
      if (typeof availableSections !== "undefined") {
        availableSectionsSummary = `<p>Sections disponibles pour changement: ${availableSections.length}</p>`;
      }
    } catch (e) {
      console.log("Section data not loaded yet");
    }

    html += "<h4>Résumé</h4>";
    if (availableSectionsSummary) {
      html += availableSectionsSummary;
    }
    html += `<p>Groupes TP disponibles pour changement: ${availableTpGroups.length}</p>`;
    html += `<p>Groupes TD disponibles pour changement: ${availableTdGroups.length}</p>`;

    if (availableTpGroups.length === 0) {
      html += '<p class="warning">Aucun groupe TP disponible pour changement. ';
      if (tpGroups.length <= 1) {
        html += "Il n'y a qu'un seul groupe TP dans cette section.</p>";
      } else {
        const fullTpGroups = tpGroups.filter(
          (g) => g.capacity && g.currentOccupancy >= g.capacity
        );
        if (fullTpGroups.length === tpGroups.length - 1) {
          html += "Tous les autres groupes TP sont complets.</p>";
        } else {
          html += "Vous êtes déjà dans le seul groupe disponible.</p>";
        }
      }
    }

    if (availableTdGroups.length === 0) {
      html += '<p class="warning">Aucun groupe TD disponible pour changement. ';
      if (tdGroups.length <= 1) {
        html += "Il n'y a qu'un seul groupe TD dans cette section.</p>";
      } else {
        const fullTdGroups = tdGroups.filter(
          (g) => g.capacity && g.currentOccupancy >= g.capacity
        );
        if (fullTdGroups.length === tdGroups.length - 1) {
          html += "Tous les autres groupes TD sont complets.</p>";
        } else {
          html += "Vous êtes déjà dans le seul groupe disponible.</p>";
        }
      }
    }

    if (diagnosticResults) {
      diagnosticResults.innerHTML = html;
    }
  } catch (error) {
    console.error("Error checking assignments:", error);
    const diagnosticResults = document.getElementById("diagnostic-results");
    if (diagnosticResults) {
      diagnosticResults.innerHTML = `<p class="error">Erreur lors de l'analyse: ${error.message}</p>`;
    }
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
    const justification = document.getElementById(
      `${prefix}-justification`
    ).value;

    // Log form values for debugging
    console.log(`Form values for ${prefix}:`, {
      requested,
      reason,
      justification,
      hasJustification: Boolean(justification),
      justificationLength: justification?.length,
    });

    if (!requested) {
      throw new Error(
        `Veuillez sélectionner ${
          prefix === "section" ? "une section" : "un groupe"
        } souhaité`
      );
    }

    if (!reason) {
      throw new Error("Veuillez sélectionner un motif");
    }

    if (!justification || justification.trim() === "") {
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
      const selectedOption =
        requestedSelect.options[requestedSelect.selectedIndex];
      const requestedText = selectedOption ? selectedOption.text : "";

      console.log("Validating group types:", {
        formType,
        requestedText,
        currentElement: currentElement.textContent,
        requestType,
      });

      // For TP form, we should be selecting groups that have TP in their name
      if (formType === "tp" && !requestedText.toLowerCase().includes("tp")) {
        throw new Error(
          "Les demandes de changement doivent concerner des groupes du même type (TP vers TP)"
        );
      }

      // For TD form, we should be selecting groups that have TD in their name
      if (formType === "td" && !requestedText.toLowerCase().includes("td")) {
        throw new Error(
          "Les demandes de changement doivent concerner des groupes du même type (TD vers TD)"
        );
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

    // Common fields - ensure justification is sent correctly
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
      if (pair[0] === "document") {
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
        justification: justification.trim(),
      };

      // If we have a document, use multipart FormData
      if (fileInput?.files.length > 0) {
        formData.append("data", JSON.stringify(sectionData));

        // Submit request with multipart form data for file upload
        response = await fetch(
          "https://unicersityback-production-1fbe.up.railway.app/api/change-requests/section-with-document",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              // Don't set Content-Type for FormData
            },
            body: formData,
          }
        );
      } else {
        // No document, use regular JSON request
        response = await fetch(
          "https://unicersityback-production-1fbe.up.railway.app/api/change-requests/section",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sectionData),
          }
        );
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
        justification: justification.trim(),
      };
      console.log("Group change request payload:", groupChangeData);

      // Submit request for group change with file
      response = await fetch(
        "https://unicersityback-production-1fbe.up.railway.app/api/change-requests/group",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        }
      );
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
    } // Get request data from response
    const requestData = await response.json();

    // Create notification for the new request
    if (typeof createChangeRequestNotification === "function") {
      try {
        await createChangeRequestNotification(
          {
            id: requestData.id || requestData.requestId,
            type: requestType,
          },
          "pending"
        );
        console.log("Request notification created");
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    // Show success and reload requests
    if (successDiv) {
      successDiv.textContent = "Demande soumise avec succès.";
      successDiv.style.display = "block";

      // Automatically scroll to show success message
      successDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    form.reset();

    // Reset file name displays
    const fileNameDisplay = document.getElementById(`${prefix}-file-name`);
    if (fileNameDisplay) {
      fileNameDisplay.textContent = "";
      fileNameDisplay.style.display = "none";
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
      errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
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
      suiviTab: !!suiviTab,
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
      const tokenCheck = await fetch(
        "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!tokenCheck.ok) {
        console.error("Token validation failed:", tokenCheck.status);
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        logout();
        return;
      }
    } catch (tokenError) {
      console.warn("Token check failed:", tokenError);
      // Continue anyway, maybe just network issue
    } // Fetch both change requests and profile requests
    const [changeRequests, profileRequests] = await Promise.all([
      fetchRequests("change-requests"),
      fetchRequests("profile-requests"),
    ]);

    // Combine the results
    window.allUserRequests = [...changeRequests, ...profileRequests];

    // Track status changes and create notifications if necessary
    if (
      typeof updateRequestStatusCache === "function" &&
      typeof processRequestStatusChanges === "function"
    ) {
      try {
        const changedRequests = updateRequestStatusCache(
          window.allUserRequests
        );
        if (changedRequests.length > 0) {
          console.log(
            "Detected changes in request statuses:",
            changedRequests.length
          );
          await processRequestStatusChanges(changedRequests);
        }
      } catch (e) {
        console.error("Error processing request status changes:", e);
      }
    }

    // Hide loading, show results
    loading.style.display = "none";

    if (window.allUserRequests.length === 0) {
      table.style.display = "none";
      empty.style.display = "block";
    } else {
      table.style.display = "table";
      empty.style.display = "none";

      // Filter and display the requests
      filterUserRequests();
    }

    // Set flag to indicate requests have been loaded
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
  const searchTerm =
    document.getElementById("requests-search")?.value.toLowerCase().trim() ||
    "";
  const statusFilter =
    document.getElementById("requests-status-filter")?.value || "all";

  // Get stored requests
  const allRequests = window.allUserRequests || [];

  if (allRequests.length === 0) {
    console.log("No requests to filter");
    return;
  }

  console.log("Filtering requests with:", { searchTerm, statusFilter });

  // Apply filters
  const filteredRequests = allRequests.filter((req) => {
    // Status filter
    const statusMatch =
      statusFilter === "all" || req.status?.toLowerCase() === statusFilter;

    // Search term filter
    const searchMatch =
      !searchTerm ||
      req.type?.toLowerCase().includes(searchTerm) ||
      req.current?.toLowerCase().includes(searchTerm) ||
      req.requested?.toLowerCase().includes(searchTerm) ||
      getRequestTypeLabel(req.type).toLowerCase().includes(searchTerm) ||
      getStatusLabel(req.status, req.requestType === "profile")
        .toLowerCase()
        .includes(searchTerm);

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
    // Normalize the endpoint to avoid double URLs
    const apiEndpoint = endpoint.includes("http://")
      ? `${endpoint}/my-requests`
      : `https://unicersityback-production-1fbe.up.railway.app/api/${endpoint}/my-requests`;

    console.log(`Fetching requests from ${apiEndpoint}`);

    // Make sure we have a valid token
    if (!authToken) {
      console.error("No auth token available for request");
      return [];
    }

    const res = await fetch(apiEndpoint, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // Increase timeout to 10 seconds
    });

    // Log the response status and headers for debugging
    console.log(`Response for ${endpoint}:`, {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
    });
    if (!res.ok) {
      console.error(
        `Error fetching ${endpoint}: ${res.status} ${res.statusText}`
      );

      // Try token refresh for 401 Unauthorized errors
      if (res.status === 401 && typeof refreshToken === "function") {
        console.log("Attempting to refresh token due to 401 error");
        const refreshed = await refreshToken();

        if (refreshed) {
          console.log("Token refreshed, retrying request");
          // Reset tokenRefreshAttempted for next usage
          tokenRefreshAttempted = false;

          // Retry the request with the new token
          return await fetchRequests(endpoint);
        } else {
          console.error("Token refresh failed, redirecting to login");
          alert("Votre session a expiré. Veuillez vous reconnecter.");
          sessionStorage.removeItem("etudiant_token");
          localStorage.removeItem("etudiant_token");
          window.location.href = "etudiant-login.html";
          return [];
        }
      }

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
    if (e.name === "TypeError" && e.message.includes("Failed to fetch")) {
      console.error(
        "Network error - check CORS settings or server availability"
      );
    } else if (e.name === "AbortError") {
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
    document.querySelector(".tab-container")?.prepend(notice);
  }

  // Set fallback values
  const setCurrent = (elementId, name, id) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = name || "Non assigné";
      el.dataset.id = id || "";
    }
  };

  setCurrent("current-section", "Section B", "2");
  setCurrent("current-td", "Groupe TD 3", "3");
  setCurrent("current-tp", "Groupe TP 2", "2");

  // Load fallback options
  loadAvailableOptions("section", "2");
  loadAvailableOptions("td", "3");
  loadAvailableOptions("tp", "2");

  // Setup user info in sidebar
  const userAvatar = document.getElementById("userAvatar");
  const userFullName = document.getElementById("userFullName");
  const userId = document.getElementById("userId");

  if (userAvatar) {
    userAvatar.textContent = "ET";
  }

  if (userFullName) {
    userFullName.textContent = "Étudiant Test";
  }

  if (userId) {
    userId.textContent = "etudiant@example.com";
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
    const res = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

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

// GLOBAL AUTH FUNCTIONS
function logout() {
  // Clear tokens
  sessionStorage.removeItem("etudiant_token");
  localStorage.removeItem("etudiant_token");
  sessionStorage.removeItem("etudiant_refresh_token");
  localStorage.removeItem("etudiant_refresh_token");

  // Clear user data
  localStorage.removeItem("studentData");
  localStorage.removeItem("studentRequests");

  // Redirect to login page
  window.location.href = "etudiant-login.html";
}

// Initialize data source and helpers
function initializeData() {
  // Initialize request status change cache
  window.requestStatusCache = window.requestStatusCache || new Map();

  // Default global variables if not already set
  window.allUserRequests = window.allUserRequests || [];

  // Set up filter handlers if the elements exist
  const searchInput = document.getElementById("requests-search");
  const statusFilter = document.getElementById("requests-status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", filterUserRequests);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterUserRequests);
  }
}

// Attempt to refresh an expired token
async function refreshToken() {
  try {
    // Check if we've already attempted a refresh to prevent loops
    if (tokenRefreshAttempted) {
      console.warn("Token refresh already attempted, preventing loop");
      return false;
    }

    tokenRefreshAttempted = true;

    // Get refresh token if it exists
    const refreshTokenValue =
      sessionStorage.getItem("etudiant_refresh_token") ||
      localStorage.getItem("etudiant_refresh_token");

    if (!refreshTokenValue) {
      console.warn("No refresh token available");
      return false;
    }

    console.log("Attempting to refresh token...");

    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn("Token refresh failed:", response.status);
      return false;
    }

    const data = await response.json();

    // Update stored tokens
    authToken = data.accessToken;

    // Update storage
    if (localStorage.getItem("etudiant_token")) {
      localStorage.setItem("etudiant_token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("etudiant_refresh_token", data.refreshToken);
      }
    } else {
      sessionStorage.setItem("etudiant_token", data.accessToken);
      if (data.refreshToken) {
        sessionStorage.setItem("etudiant_refresh_token", data.refreshToken);
      }
    }

    console.log("Token refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
}

// DOCUMENT READY
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

    // Add diagnostics button event listener
    document.getElementById("diagnostic-btn")?.addEventListener("click", () => {
      checkStudentGroupAssignments();
    });
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
      console.log("New request button clicked, switching to forms tab");
      // Click the first tab button to switch to formulaires
      const formulairesTab = document.querySelector(
        '[data-target="formulaires"]'
      );
      if (formulairesTab) {
        // Manually trigger the click event
        const clickEvent = new Event("click");
        formulairesTab.dispatchEvent(clickEvent);
      }
    });
  }

  // Add specific listener for the suivi tab to make sure requests load
  const suiviTabButton = document.querySelector('[data-target="suivi"]');
  if (suiviTabButton) {
    suiviTabButton.addEventListener("click", function () {
      console.log("Suivi tab clicked, reloading requests");
      loadUserRequests();
    });
  }
});

// Initialize sidebar with user information
function initializeSidebar() {
  try {
    // Try to load user data from localStorage if available
    const storedData = localStorage.getItem("studentData");
    if (storedData) {
      const userData = JSON.parse(storedData);

      const userAvatar = document.getElementById("userAvatar");
      const userFullName = document.getElementById("userFullName");
      const userId = document.getElementById("userId");

      if (userAvatar) {
        const initials =
          ((userData.firstName || "")[0] || "") +
          ((userData.lastName || "")[0] || "");
        userAvatar.textContent = initials.toUpperCase() || "ET";
      }

      if (userFullName) {
        userFullName.textContent =
          `${userData.firstName || ""} ${userData.lastName || ""}` ||
          "Étudiant";
      }

      if (userId) {
        userId.textContent = userData.matricule || userData.email || "";
      }
    }
  } catch (e) {
    console.error("Error initializing sidebar:", e);
  }
}

// Setup file input displays
function setupFileInputDisplays() {
  setupFileInput("section-document", "section-file-name");
  setupFileInput("td-document", "td-file-name");
  setupFileInput("tp-document", "tp-file-name");
}

// Function to display selected file name
function setupFileInput(inputId, displayId) {
  const fileInput = document.getElementById(inputId);
  const fileNameDisplay = document.getElementById(displayId);

  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        fileNameDisplay.textContent = this.files[0].name;
        fileNameDisplay.title = this.files[0].name;
        fileNameDisplay.style.display = "block";
      } else {
        fileNameDisplay.textContent = "";
        fileNameDisplay.style.display = "none";
      }
    });
  }
}

// Improved tab navigation setup
function setupTabNavigation() {
  console.log("Setting up tab navigation");
  // Set up main tab buttons
  document
    .querySelectorAll(".tab-container > .tab-buttons > .tab-button")
    .forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const target = this.getAttribute("data-target");
        console.log(`Tab clicked: ${target}`);

        // Hide all main tabs
        document.querySelectorAll(".tab-content").forEach((tab) => {
          tab.classList.remove("active");
        });

        // Deactivate all main tab buttons
        document
          .querySelectorAll(".tab-container > .tab-buttons > .tab-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Show selected tab and activate button
        const selectedTab = document.getElementById(target);
        if (selectedTab) {
          selectedTab.classList.add("active");
          console.log(`Activated tab: ${target}`);
        } else {
          console.error(`Tab element not found with id: ${target}`);
        }
        this.classList.add("active");

        // If switching to "suivi" tab, only load requests if not already loaded
        if (target === "suivi") {
          console.log("Handling Suivi tab activation");
          if (!requestsLoaded) {
            console.log("Loading requests for first time");
            loadUserRequests();
          } else {
            console.log("Requests already loaded, skipping reload");
          }
          // Make sure the suivi tab is visible by forcing display
          document.getElementById("suivi").style.display = "block";
        }

        // If switching to forms tab, activate first sub-tab
        if (target === "formulaires") {
          const firstSubTab = document.querySelector(
            "#formulaires .tab-buttons .tab-button"
          );
          if (firstSubTab) {
            firstSubTab.click();
          }
        }
      });
    });

  // Set up form sub-tab buttons
  document
    .querySelectorAll("#formulaires .tab-buttons .tab-button")
    .forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const target = this.getAttribute("data-target");

        // Hide all form cards
        document.querySelectorAll(".form-card").forEach((form) => {
          form.classList.remove("active");
        });

        // Deactivate all form tab buttons
        document
          .querySelectorAll("#formulaires .tab-buttons .tab-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Show selected form and activate button
        const selectedForm = document.getElementById(target);
        if (selectedForm) {
          selectedForm.classList.add("active");
          console.log(`Activated form: ${target}`);
        } else {
          console.error(`Form element not found with id: ${target}`);
        }
        this.classList.add("active");
      });
    });

  // Add a test click on the Suivi tab once DOM is fully loaded
  setTimeout(() => {
    console.log("Testing tab navigation");
    const suiviTab = document.querySelector('[data-target="suivi"]');
    const formulairesTab = document.querySelector(
      '[data-target="formulaires"]'
    );
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
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: "GET",
        signal: AbortSignal.timeout(3000),
      }
    );

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
    formFound: !!form,
  });

  // Add proper form submission handler
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log(`Form ${formId} submitted`);

    // Validate request type and prefix match - especially for TP groups
    if (requestType === "TP_GROUP" && prefix !== "tp") {
      console.error("Mismatch between requestType and prefix:", {
        requestType,
        prefix,
      });
      alert(
        "Erreur de configuration du formulaire. Veuillez rafraîchir la page."
      );
      return;
    }

    submitRequest(requestType, prefix, e);
    return false;
  });

  // Also handle direct button click
  const submitBtn = form.querySelector(".submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
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
      tpId: studentData.tpGroupe?.id,
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
    setCurrent("current-tp", studentData.tpGroupe); // Log current group IDs before loading options
    console.log("Current IDs being passed to loadAvailableOptions:", {
      sectionId: studentData.sections?.[0]?.id,
      tdGroupId: studentData.tdGroupe?.id,
      tpGroupId: studentData.tpGroupe?.id,
    });

    // Load options
    await loadAvailableOptions(
      "section",
      studentData.sections?.[0]?.id,
      studentData
    );
    await loadAvailableOptions("td", studentData.tdGroupe?.id, studentData);
    await loadAvailableOptions("tp", studentData.tpGroupe?.id, studentData);
  } catch (e) {
    console.error("Error loading user data:", e);
    loadFallbackData();
  }
}

async function fetchStudentData() {
  const res = await fetch(
    `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${currentUser.id}`,
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
    const initials =
      ((data.firstName || "")[0] || "") + ((data.lastName || "")[0] || "");
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

async function loadAvailableOptions(type, currentId, studentData) {
  const select = document.getElementById(`requested-${type}`);
  if (!select) return;

  select.innerHTML = `<option value="">Sélectionnez...</option>`;

  // Show loading state
  select.disabled = true;
  select.innerHTML = `<option value="">Chargement...</option>`;

  try {
    const groups = isBackendAvailable
      ? await fetchGroups(type, currentId, studentData)
      : getFallbackGroups(type);

    // Reset select after loading
    select.innerHTML = `<option value="">Sélectionnez...</option>`;

    // Filter out invalid options first
    const validGroups = groups.filter((group) => {
      // Filter out the current group - can't switch to same group
      const groupIdStr = String(group.id || "");
      const currentIdStr = String(currentId || "");
      return groupIdStr !== currentIdStr;
    });

    if (validGroups.length > 0) {
      // Update the select with valid options
      validGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.id;

        let displayName = group.name;

        // Add the type to the name if it's not already there
        if (type === "tp" && !displayName.toLowerCase().includes("tp")) {
          displayName = `${displayName} (TP)`;
        } else if (type === "td" && !displayName.toLowerCase().includes("td")) {
          displayName = `${displayName} (TD)`;
        }

        // Add capacity information to help with decision-making
        if (group.capacity && group.currentOccupancy !== undefined) {
          displayName += ` - ${group.currentOccupancy}/${group.capacity}`;

          // Add visual indicator for full groups
          if (group.currentOccupancy >= group.capacity) {
            displayName += " (Complet)";
          }
        }

        option.textContent = displayName;
        select.appendChild(option);
      });
    } else {
      // No valid options available - show a message
      const errorDivId = `${type}-form-error`;
      const errorDiv = document.getElementById(errorDivId);
      if (errorDiv) {
        // Construct appropriate message based on group type
        let message = `Aucun groupe ${
          type === "tp" ? "TP" : "TD"
        } n'est disponible pour changement. `;

        // Check if it's because there are no groups at all
        const allGroupsOfType = select.getAttribute("data-all-groups")
          ? JSON.parse(select.getAttribute("data-all-groups"))
          : [];

        if (allGroupsOfType.length <= 1) {
          message += "Vous êtes dans le seul groupe disponible.";
        } else {
          message +=
            "Vous êtes déjà dans le seul groupe disponible pour votre section.";
        }

        errorDiv.textContent = message;
        errorDiv.style.display = "block";
      }
    }
  } catch (e) {
    console.error(`Error loading ${type} groups:`, e);

    const errorDivId = `${type}-form-error`;
    const errorDiv = document.getElementById(errorDivId);
    if (errorDiv) {
      errorDiv.textContent = `Une erreur est survenue lors du chargement des groupes: ${e.message}`;
      errorDiv.style.display = "block";
    }

    // Reset select and add fallback options
    select.innerHTML = `<option value="">Erreur de chargement</option>`;
    getFallbackGroups(type).forEach((group) => {
      select.add(new Option(group.name, group.id));
    });
  }

  // Re-enable the select
  select.disabled = false;
}

async function fetchGroups(type, currentId, studentData) {
  try {
    // For type 'section' we handle it differently
    if (type === "section") {
      if (
        !studentData ||
        !studentData.sections ||
        studentData.sections.length === 0
      ) {
        console.warn("No sections data available, using fallback data");
        return getFallbackGroups(type);
      }

      // Get student's section details
      const studentSection = studentData.sections[0];
      const specialty = studentSection?.specialty;
      const level = studentSection?.level;

      // Use the findAll endpoint with query parameters
      const queryParams = new URLSearchParams();
      if (specialty) queryParams.append("specialty", specialty);
      if (level) queryParams.append("level", level);

      const res = await fetch(
        `https://unicersityback-production-1fbe.up.railway.app/api/sections?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!res.ok) throw new Error(`Failed to fetch ${type} groups`);
      const allSections = await res.json();

      // Only filter out the current section, ignore capacity
      return allSections.filter((section) => {
        return section.id !== currentId;
      });
    } else {
      // For group changes (TD/TP), we need to get all groups in the same section
      const sectionId = studentData.sections?.[0]?.id;
      if (!sectionId) {
        console.warn("No section assigned for student, using fallback data");
        return getFallbackGroups(type);
      }

      // Try to fetch all groups for this section from a dedicated endpoint
      const groupsUrl = `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/groupes`;

      try {
        const groupsRes = await fetch(groupsUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: AbortSignal.timeout(5000),
        });

        if (groupsRes.ok) {
          const allGroups = await groupsRes.json();
          console.log(
            `Fetched ${allGroups.length} groups for section ${sectionId}`
          );

          let availableGroups;
          if (type === "tp") {
            // For TP groups, filter based on group name containing TP or database type
            availableGroups = allGroups.filter((group) => {
              const isNamedTP = group.name.toLowerCase().includes("tp");
              const isTypeTP = group.type === "tp";
              const isNotCurrentGroup = group.id !== currentId;

              // Only check type and current group
              return (isNamedTP || isTypeTP) && isNotCurrentGroup;
            });
          } else {
            // For TD groups
            availableGroups = allGroups.filter((group) => {
              const isNamedTD = group.name.toLowerCase().includes("td");
              const isTypeTD = group.type === "td";
              const isNotCurrentGroup = group.id !== currentId;

              // Only check type and current group
              return (isNamedTD || isTypeTD) && isNotCurrentGroup;
            });
          }

          // Save all groups data for error message use
          const select = document.getElementById(`requested-${type}`);
          if (select) {
            select.setAttribute("data-all-groups", JSON.stringify(allGroups));
          }

          return availableGroups;
        }
      } catch (groupsError) {
        console.log(
          "Error fetching groups from dedicated endpoint:",
          groupsError
        );
      }

      // Fall back to using groups from student data
      const currentGroups = studentData.sections?.[0]?.groupes || [];

      if (type === "tp") {
        // For TP groups, filter based on group name containing TP or database type
        return currentGroups.filter((group) => {
          const isNamedTP = group.name.toLowerCase().includes("tp");
          const isTypeTP = group.type === "tp";
          const isNotCurrentGroup = group.id !== currentId;

          // Only check type and current group
          return (isNamedTP || isTypeTP) && isNotCurrentGroup;
        });
      } else {
        // For TD groups
        return currentGroups.filter((group) => {
          const isNamedTD = group.name.toLowerCase().includes("td");
          const isTypeTD = group.type === "td";
          const isNotCurrentGroup = group.id !== currentId;

          // Only check type and current group
          return (isNamedTD || isTypeTD) && isNotCurrentGroup;
        });
      }
    }
  } catch (e) {
    console.error(`Error fetching ${type} groups:`, e);
    return getFallbackGroups(type);
  }
}
