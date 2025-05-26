/**
 * Admin Demandes Section Script
 * Handles functionality for the admin section change requests page
 */

// Global variables
let currentRequests = [];
let filteredRequests = [];
let selectedRequestId = null;
const statusColors = {
  pending: "#f59e0b", // Amber
  approved: "#10b981", // Green
  rejected: "#ef4444", // Red
  cancelled: "#6b7280", // Gray
};

// DOM Elements - will be initialized after DOM loads
let requestListElement;
let detailsElement;
let filterStatusSelect;
let filterDepartmentSelect;
let searchInput;
let statusMessageElement;

// Event listeners
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize DOM elements
    requestListElement = document.getElementById("requests-table-body");
    detailsElement = document.getElementById("request-details");
    filterStatusSelect = document.getElementById("status-filter");
    filterDepartmentSelect = document.getElementById("filter-department");
    searchInput = document.getElementById("search");
    statusMessageElement = document.getElementById("status-message");

    console.log("DOM elements initialized:", {
      requestListElement,
      detailsElement,
      filterStatusSelect,
      filterDepartmentSelect,
      searchInput,
      statusMessageElement,
    });

    // First verify admin token with fallback check
    if (typeof verifyAdminToken === "function") {
      await verifyAdminToken();
    } else {
      console.error("verifyAdminToken function not available");
      // Fallback: redirect to login if no admin token
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      if (!token) {
        window.location.href = "index.html";
        return;
      }
    }

    // Load sidebar
    await loadSidebar();

    // Set active sidebar item
    if (window.setActiveMenuItem) {
      window.setActiveMenuItem("admin-demandes-section");
    }

    // Initialize filters
    initFilters();

    // Load section change requests
    await loadSectionRequests();
  } catch (error) {
    console.error("Error initializing page:", error);
    showMessage("Erreur lors du chargement de la page", "error");
  }
});

/**
 * Load the sidebar into the page
 */
async function loadSidebar() {
  try {
    // Get role from storage
    const role =
      localStorage.getItem("admin_role") ||
      sessionStorage.getItem("admin_role");

    console.log("Loading sidebar for role:", role);

    // Map roles to sidebar files
    const sidebarFiles = {
      doyen: "admin-sidebar-doyen.html",
      "vice-doyen": "admin-sidebar-vice-doyen.html",
      "chef-de-departement": "admin-sidebar-chef-departement.html",
      "chef-de-specialite": "admin-sidebar-chef-specialite.html",
      secretaire: "admin-sidebar-secretaire.html",
    };

    // Get the sidebar file for the role
    const sidebarFile = sidebarFiles[role] || sidebarFiles["doyen"]; // Default to doyen

    console.log("Loading sidebar file:", sidebarFile);

    const response = await fetch(sidebarFile);
    if (!response.ok) throw new Error("Failed to load sidebar");

    const html = await response.text();
    document.getElementById("sidebar-container").innerHTML = html;

    // Initialize sidebar scripts if they exist
    if (window.updateAdminInfo) {
      window.updateAdminInfo();
    }

    if (window.setActiveMenuItem) {
      window.setActiveMenuItem();
    }

    console.log("✅ Sidebar loaded successfully for role:", role);
  } catch (error) {
    console.error("Error loading sidebar:", error);
  }
}

// Initialize filters
function initFilters() {
  console.log("initFilters called");

  // Try to get the elements if they're not already set
  if (!filterStatusSelect)
    filterStatusSelect = document.getElementById("status-filter");
  if (!filterDepartmentSelect)
    filterDepartmentSelect = document.getElementById("filter-department");
  if (!searchInput) searchInput = document.getElementById("search");

  console.log("filterStatusSelect:", filterStatusSelect);
  console.log("filterDepartmentSelect:", filterDepartmentSelect);
  console.log("searchInput:", searchInput);

  if (filterStatusSelect) {
    console.log("filterStatusSelect.value:", filterStatusSelect.value);
    filterStatusSelect.addEventListener("change", applyFilters);
  } else {
    console.error(
      "filterStatusSelect not found! Looking for element with ID 'status-filter'"
    );
    // Try to find it with querySelectorAll to see if there's a similar element
    const selects = document.querySelectorAll("select");
    console.log("All select elements:", selects);
  }

  if (filterDepartmentSelect) {
    filterDepartmentSelect.addEventListener("change", applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  } else {
    console.error(
      "searchInput not found! Looking for element with ID 'search'"
    );
    // Try to find any inputs
    const inputs = document.querySelectorAll('input[type="text"]');
    console.log("All text inputs:", inputs);
  }
}

// Load section change requests
async function loadSectionRequests() {
  showMessage("Chargement des demandes...", "info");
  try {
    // Try the working API fetcher first
    if (window.fetchSectionChangeRequests) {
      try {
        const result = await window.fetchSectionChangeRequests();
        console.log("fetchSectionChangeRequests result:", result);
        console.log("result type:", typeof result);
        console.log("result.requests:", result?.requests);
        console.log("result.success:", result?.success);

        // Handle different possible return formats
        let requestsArray = [];
        if (Array.isArray(result)) {
          // Direct array return
          requestsArray = result;
        } else if (result && result.success && Array.isArray(result.requests)) {
          // Object with success flag and requests array
          requestsArray = result.requests;
        } else if (result && Array.isArray(result.data)) {
          // Object with data array
          requestsArray = result.data;
        }

        console.log("Extracted requestsArray:", requestsArray);

        if (requestsArray.length > 0) {
          console.log(
            "Successfully got requests from fetchSectionChangeRequests:",
            requestsArray
          );
          currentRequests = requestsArray;
          filteredRequests = [...currentRequests];
          console.log(
            "Set filteredRequests to:",
            filteredRequests.length,
            "items"
          );
          // Synchronize with HTML script variable
          syncWithHTMLScript();
          renderRequestList();
          showMessage("", "none");
          return;
        }
      } catch (apiError) {
        console.error("Error using fetchSectionChangeRequests:", apiError);
      }
    }

    // Try enhanced adminAPI if available
    if (window.adminAPI && window.adminAPI.getSectionChangeRequests) {
      try {
        const requests = await window.adminAPI.getSectionChangeRequests();
        if (Array.isArray(requests)) {
          currentRequests = requests;
          filteredRequests = [...currentRequests];
          // Synchronize with HTML script variable
          syncWithHTMLScript();
          renderRequestList();
          showMessage("", "none");
          return;
        }
      } catch (apiError) {
        console.error(
          "Error using adminAPI.getSectionChangeRequests:",
          apiError
        );
        // Continue to fallback methods
      }
    }

    // Fallback to direct API call
    const response = await apiCall("change-requests", "GET");

    if (!response) {
      throw new Error("No response received");
    } // Handle both wrapped and direct array responses
    currentRequests = Array.isArray(response) ? response : response.data || [];

    // Debug: Log the raw response to see what we're getting
    console.log("Raw API response for section requests:", response);
    console.log("Processed currentRequests:", currentRequests);

    // Filter for section change requests only (exclude group TD requests)
    // Be more lenient with filtering - accept any request that has requestType "section"
    // or doesn't have a requestType but might be a section request
    currentRequests = currentRequests.filter((request) => {
      const isSection = request.requestType === "section";
      const mightBeSection = !request.requestType; // Accept requests without explicit type

      console.log(
        `Request ${request.id}: requestType="${request.requestType}", isSection=${isSection}, mightBeSection=${mightBeSection}`
      );

      return isSection || mightBeSection;
    });

    console.log(
      "Filtered currentRequests after section filtering:",
      currentRequests
    );
    filteredRequests = [...currentRequests];

    console.log("Final filteredRequests:", filteredRequests);

    // Synchronize with HTML script variable
    syncWithHTMLScript();

    // Render requests
    renderRequestList();

    // Clear status message
    showMessage("", "none");
  } catch (error) {
    console.error("Error loading section requests:", error);

    // Enable mock data fallback for debugging
    console.log("Attempting to use mock data...");

    // Try to use the newer mock data function first
    if (typeof window.getMockDataForEndpoint === "function") {
      currentRequests = window.getMockDataForEndpoint(
        "change-requests/section"
      );
      console.log("Using getMockDataForEndpoint, got:", currentRequests);
    } else if (typeof getMockSectionRequests === "function") {
      currentRequests = getMockSectionRequests();
      console.log("Using getMockSectionRequests, got:", currentRequests);
    } else {
      currentRequests = [];
      console.log("No mock data functions available");
    }
    filteredRequests = [...currentRequests];
    // Synchronize with HTML script variable
    syncWithHTMLScript();
    renderRequestList();

    if (currentRequests.length > 0) {
      showMessage(
        "Utilisation des données de test (mode développement)",
        "warning"
      );
    } else {
      showMessage(
        "Erreur lors du chargement des demandes: " + error.message,
        "error"
      );
    }
  }
}

// Synchronize variables with HTML script
function syncWithHTMLScript() {
  if (typeof window !== "undefined") {
    window.allRequests = currentRequests;
    window.currentRequests = currentRequests;
    console.log(
      "Synchronized variables with HTML script. allRequests length:",
      window.allRequests.length
    );

    // Dispatch event to notify HTML script
    window.dispatchEvent(new Event("sectionRequestsUpdated"));
  }
}

// Modal opening function
function openModal(requestId) {
  console.log("External JS openModal called with ID:", requestId);

  // Ensure we have the latest data synchronized
  syncWithHTMLScript();

  // If the HTML script has a function with this name, call it
  if (
    typeof window.openModal === "function" &&
    window.openModal !== openModal
  ) {
    console.log("Calling HTML script's openModal function");
    window.openModal(requestId);
    return;
  }

  console.log("HTML openModal not found, opening modal directly");

  // Direct implementation (fallback)
  const requestModal = document.getElementById("request-modal");
  const request = currentRequests.find((r) => r.id === requestId);

  if (!request) {
    console.error("No request found with ID:", requestId);
    return;
  }

  if (requestModal) {
    console.log("Opening modal for request:", request);

    // Try to populate basic modal fields
    const modalTitle = requestModal.querySelector(".modal-title");
    if (modalTitle) {
      modalTitle.textContent = "Détails de la Demande";
    }

    // Fill student name if possible
    const studentNameEl = document.getElementById("student-name");
    if (studentNameEl && request.etudiant) {
      studentNameEl.textContent = `${request.etudiant.firstName} ${request.etudiant.lastName}`;
    }

    // Show the modal
    requestModal.style.display = "block";
  } else {
    console.error("Modal element not found!");
  }
}

// Make our modal function available globally
window.openModalFromJS = openModal;

// Render the list of requests
function renderRequestList() {
  console.log("renderRequestList called");

  // If requestListElement is null, try to get it one more time
  if (!requestListElement) {
    requestListElement = document.getElementById("requests-table-body");
    console.log(
      "Attempting to re-acquire requestListElement:",
      requestListElement
    );
  }

  console.log("requestListElement:", requestListElement);

  // DEBUGGING: Force filteredRequests to equal currentRequests
  filteredRequests = [...currentRequests];

  console.log("filteredRequests.length:", filteredRequests.length);
  console.log("filteredRequests:", filteredRequests);

  if (!requestListElement) {
    console.error(
      "requestListElement not found! Make sure the element with ID 'requests-table-body' exists in the HTML"
    );
    // Show where requests should be displayed
    const tables = document.querySelectorAll("table");
    console.log("Tables found in document:", tables.length);
    tables.forEach((table, i) => {
      console.log(`Table ${i} body:`, table.querySelector("tbody"));
    });
    return;
  }

  // Clear existing content
  requestListElement.innerHTML = "";

  if (filteredRequests.length === 0) {
    console.log("No filtered requests to display");
    requestListElement.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          Aucune demande de changement de section trouvée.
        </td>
      </tr>
    `;
    return;
  }

  console.log("Rendering", filteredRequests.length, "requests");
  // Create a table row for each request
  filteredRequests.forEach((request) => {
    const createdDate = new Date(request.createdAt).toLocaleDateString("fr-FR");
    const status = request.status || "pending";

    const studentName = request.etudiant
      ? `${request.etudiant.firstName} ${request.etudiant.lastName}`
      : "Étudiant inconnu";
    const studentMatricule = request.etudiant
      ? request.etudiant.matricule
      : "N/A";

    // Try multiple ways to get section names with better fallback handling
    let currentSectionName = "Section inconnue";
    let requestedSectionName = "Section inconnue";

    // Check if section data is directly available
    if (request.currentSection?.name) {
      currentSectionName = request.currentSection.name;
    } else if (request.details?.currentSection) {
      currentSectionName = request.details.currentSection;
    } else if (request.currentSectionId) {
      currentSectionName = `Section ID: ${request.currentSectionId}`;
    }

    if (request.requestedSection?.name) {
      requestedSectionName = request.requestedSection.name;
    } else if (request.details?.requestedSection) {
      requestedSectionName = request.details.requestedSection;
    } else if (request.requestedSectionId) {
      requestedSectionName = `Section ID: ${request.requestedSectionId}`;
    }

    // Debug logging for troubleshooting
    console.log("Section request debug (list):", {
      id: request.id,
      currentSection: request.currentSection,
      requestedSection: request.requestedSection,
      details: request.details,
      currentSectionName,
      requestedSectionName,
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="student-info">
          <div class="student-avatar">${studentName.charAt(0)}</div>
          <div class="student-details">
            <span class="student-name">${studentName}</span>
            <span class="student-matricule">Mat: ${studentMatricule}</span>
          </div>
        </div>
      </td>
      <td><span class="section-badge">${currentSectionName}</span></td>
      <td><span class="section-badge">${requestedSectionName}</span></td>
      <td>${createdDate}</td>
      <td><span class="request-status status-${status.toLowerCase()}">${capitalizeFirstLetter(
      status
    )}</span></td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="openModal('${
          request.id
        }')">
          Détails
        </button>
      </td>
    `;
    requestListElement.appendChild(row);
  });

  // Mark that the external JS has successfully rendered the table
  console.log(
    "External JS successfully rendered",
    filteredRequests.length,
    "rows"
  );
  window.externalJSRendered = true;

  // Update the stats counters
  if (typeof updateStats === "function") {
    console.log("Calling updateStats from external JS");
    updateStats();
  }
}

// Select a request to view its details
function selectRequest(id) {
  selectedRequestId = id;

  // Find the selected request
  const request = currentRequests.find((req) => req.id === id);

  // Highlight the selected request in the list
  renderRequestList();

  // Display request details
  renderRequestDetails(request);
}

// Render request details
function renderRequestDetails(request) {
  if (!detailsElement || !request) return;

  const createdDate = new Date(request.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const status = request.status || "pending";
  const statusColor = statusColors[status] || statusColors.pending;

  const studentName = request.etudiant
    ? `${request.etudiant.firstName} ${request.etudiant.lastName}`
    : "Étudiant inconnu";
  const studentMatricule = request.etudiant
    ? request.etudiant.matricule
    : "N/A";

  // Try multiple ways to get section names with better fallback handling
  let currentSectionName = "Section inconnue";
  let requestedSectionName = "Section inconnue";

  // Check if section data is directly available
  if (request.currentSection?.name) {
    currentSectionName = request.currentSection.name;
  } else if (request.details?.currentSection) {
    currentSectionName = request.details.currentSection;
  } else if (request.currentSectionId) {
    currentSectionName = `Section ID: ${request.currentSectionId}`;
  }

  if (request.requestedSection?.name) {
    requestedSectionName = request.requestedSection.name;
  } else if (request.details?.requestedSection) {
    requestedSectionName = request.details.requestedSection;
  } else if (request.requestedSectionId) {
    requestedSectionName = `Section ID: ${request.requestedSectionId}`;
  }

  // Debug logging for troubleshooting
  console.log("Section request debug (details):", {
    id: request.id,
    currentSection: request.currentSection,
    requestedSection: request.requestedSection,
    details: request.details,
    currentSectionName,
    requestedSectionName,
  });

  let statusActions = "";

  // Only show action buttons for pending requests
  if (status === "pending") {
    statusActions = `
      <div class="action-buttons">
        <button class="btn btn-success" onclick="approveRequest('${request.id}')">
          Approuver
        </button>
        <button class="btn btn-danger" onclick="rejectRequest('${request.id}')">
          Rejeter
        </button>
      </div>
    `;
  }

  // Check if request has a document
  const hasDocument = request.documentName || request.documentPath;
  let documentSection = "";

  if (hasDocument) {
    documentSection = `
      <div class="request-document">
        <h3>Document Justificatif</h3>
        <p>
          <span class="document-name">${
            request.documentName || "Document"
          }</span>
          <a href="${API_BASE_URL}/change-requests/${
      request.id
    }/document" class="download-link" target="_blank">
            Télécharger
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
        </p>
      </div>
    `;
  }

  // Response field for admin
  let responseSection = "";

  if (status === "pending") {
    responseSection = `
      <div class="form-group">
        <label for="admin-response">Réponse de l'administrateur</label>
        <textarea id="admin-response" class="form-input notes-field" placeholder="Entrez votre réponse ici"></textarea>
      </div>
    `;
  } else {
    responseSection = `
      <div class="response-message">
        <h3>Réponse de l'administrateur</h3>
        <p>${request.responseMessage || "Aucune réponse fournie"}</p>
      </div>
    `;
  }

  // Build the detail view HTML
  detailsElement.innerHTML = `
    <div class="detail-header">
      <h2>Demande de changement de section</h2>
      <span class="request-number">${
        request.requestNumber || `REQ-${request.id.slice(0, 8)}`
      }</span>
    </div>

    <div class="detail-content">
      <div class="request-meta">
        <div class="meta-item">
          <span class="meta-label">Date de soumission:</span>
          <span class="meta-value">${createdDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Statut:</span>
          <span class="meta-value request-status" style="background-color: ${statusColor}20; color: ${statusColor}">
            ${capitalizeFirstLetter(status)}
          </span>
        </div>
      </div>

      <div class="student-details-full">
        <h3>Informations Étudiant</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Nom et prénom:</span>
            <span class="detail-value">${studentName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Matricule:</span>
            <span class="detail-value">${studentMatricule}</span>
          </div>
        </div>
      </div>

      <div class="section-details">
        <h3>Changement de Section</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Section actuelle:</span>
            <span class="detail-value">${currentSectionName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Section demandée:</span>
            <span class="detail-value">${requestedSectionName}</span>
          </div>
        </div>
      </div>

      <div class="request-justification">
        <h3>Justification</h3>
        <p>${request.justification}</p>
      </div>

      ${documentSection}

      ${responseSection}

      ${statusActions}
    </div>
  `;
}

// Apply filters to the request list
function applyFilters() {
  console.log("=== applyFilters called ===");
  const statusFilter = filterStatusSelect ? filterStatusSelect.value : "";
  const departmentFilter = filterDepartmentSelect
    ? filterDepartmentSelect.value
    : "";
  const searchText = searchInput ? searchInput.value.toLowerCase() : "";

  console.log("Applying filters:", {
    statusFilter,
    departmentFilter,
    searchText,
  });
  console.log(
    "Before filtering - currentRequests.length:",
    currentRequests.length
  );

  filteredRequests = currentRequests.filter((request) => {
    // Filter by status
    if (
      statusFilter &&
      statusFilter !== "all" &&
      request.status !== statusFilter
    ) {
      console.log(
        `Request ${request.id} filtered out by status: ${request.status} !== ${statusFilter}`
      );
      return false;
    } // Filter by department
    if (
      departmentFilter &&
      departmentFilter !== "all" &&
      request.currentSection?.department?.id !== departmentFilter &&
      request.requestedSection?.department?.id !== departmentFilter
    ) {
      console.log(`Request ${request.id} filtered out by department`);
      return false;
    }

    // Filter by search text
    if (searchText) {
      const studentName = request.etudiant
        ? `${request.etudiant.firstName} ${request.etudiant.lastName}`.toLowerCase()
        : "";
      const matricule = request.etudiant?.matricule?.toLowerCase() || "";
      const requestNumber = request.requestNumber?.toLowerCase() || "";

      if (
        !studentName.includes(searchText) &&
        !matricule.includes(searchText) &&
        !requestNumber.includes(searchText)
      ) {
        return false;
      }
    }
    return true;
  });

  console.log(
    "After filtering - filteredRequests.length:",
    filteredRequests.length
  );

  // Re-render the request list
  renderRequestList();
}

// Approve a request
async function approveRequest(id) {
  if (!confirm("Êtes-vous sûr de vouloir approuver cette demande?")) return;

  const responseText = document.getElementById("admin-response").value;

  try {
    showMessage("Traitement de la demande...", "info");

    // Use enhanced adminAPI if available
    let success = false;

    if (window.adminAPI && window.adminAPI.updateSectionChangeStatus) {
      try {
        await window.adminAPI.updateSectionChangeStatus(
          id,
          "approved",
          responseText
        );
        success = true;
      } catch (apiError) {
        console.error(
          "Error using adminAPI.updateSectionChangeStatus:",
          apiError
        );
        // Continue to fallback method
      }
    }

    // Fallback to direct API call if adminAPI failed
    if (!success) {
      await apiCall(`change-requests/${id}/status`, "PATCH", {
        status: "approved",
        responseMessage: responseText,
      });
    }

    // Update the local data
    const index = currentRequests.findIndex((r) => r.id === id);
    if (index > -1) {
      currentRequests[index] = {
        ...currentRequests[index],
        status: "approved",
        responseMessage: responseText,
      };
    }

    // Re-render the view
    applyFilters();
    selectRequest(id);

    showMessage("Demande approuvée avec succès!", "success");
  } catch (error) {
    console.error("Error approving request:", error);
    showMessage("Erreur lors de l'approbation de la demande", "error");
  }
}

// Reject a request
async function rejectRequest(id) {
  if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande?")) return;

  const responseText = document.getElementById("admin-response").value;

  try {
    showMessage("Traitement de la demande...", "info");

    // Use enhanced adminAPI if available
    let success = false;

    if (window.adminAPI && window.adminAPI.updateSectionChangeStatus) {
      try {
        await window.adminAPI.updateSectionChangeStatus(
          id,
          "rejected",
          responseText
        );
        success = true;
      } catch (apiError) {
        console.error(
          "Error using adminAPI.updateSectionChangeStatus:",
          apiError
        );
        // Continue to fallback method
      }
    }

    // Fallback to direct API call if adminAPI failed
    if (!success) {
      await apiCall(`change-requests/${id}/status`, "PATCH", {
        status: "rejected",
        responseMessage: responseText,
      });
    }

    // Update the local data
    const index = currentRequests.findIndex((r) => r.id === id);
    if (index > -1) {
      currentRequests[index] = {
        ...currentRequests[index],
        status: "rejected",
        responseMessage: responseText,
      };
    }

    // Re-render the view
    applyFilters();
    selectRequest(id);

    showMessage("Demande rejetée", "success");
  } catch (error) {
    console.error("Error rejecting request:", error);
    showMessage("Erreur lors du rejet de la demande", "error");
  }
}

// Show a status message
function showMessage(text, type = "info") {
  if (!statusMessageElement) return;

  if (!text) {
    statusMessageElement.style.display = "none";
    return;
  }

  statusMessageElement.textContent = text;
  statusMessageElement.className = `status-message status-${type}`;
  statusMessageElement.style.display = "block";
}

// Helper to capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Mock data function for development mode
function getMockSectionRequests() {
  return [
    {
      id: "1",
      requestNumber: "REQ-2023-12345678",
      etudiant: {
        firstName: "Ahmed",
        lastName: "Benali",
        matricule: "20230001",
      },
      currentSection: {
        id: "sec1",
        name: "Section A",
        department: { id: "dep1", name: "Informatique" },
      },
      requestedSection: {
        id: "sec2",
        name: "Section B",
        department: { id: "dep1", name: "Informatique" },
      },
      status: "pending",
      justification:
        "Je souhaite changer de section car mon emploi du temps actuel ne me permet pas de suivre tous les cours.",
      documentName: "justificatif.pdf",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      requestNumber: "REQ-2023-87654321",
      etudiant: {
        firstName: "Fatima",
        lastName: "Zahra",
        matricule: "20230002",
      },
      currentSection: {
        id: "sec3",
        name: "Section C",
        department: { id: "dep2", name: "Mathématiques" },
      },
      requestedSection: {
        id: "sec4",
        name: "Section D",
        department: { id: "dep2", name: "Mathématiques" },
      },
      status: "approved",
      responseMessage: "Demande approuvée suite à la validation des documents.",
      justification:
        "Je souhaite changer de section pour des raisons médicales.",
      documentName: "certificat_medical.pdf",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "3",
      requestNumber: "REQ-2023-11223344",
      etudiant: {
        firstName: "Mohammed",
        lastName: "Hakim",
        matricule: "20230003",
      },
      currentSection: {
        id: "sec2",
        name: "Section B",
        department: { id: "dep1", name: "Informatique" },
      },
      requestedSection: {
        id: "sec1",
        name: "Section A",
        department: { id: "dep1", name: "Informatique" },
      },
      status: "rejected",
      responseMessage:
        "La section demandée est déjà complète. Veuillez choisir une autre section.",
      justification:
        "Je souhaite changer de section pour mieux suivre les cours avec mes amis qui m'aident dans mes études.",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];
}

// Make functions available globally
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
