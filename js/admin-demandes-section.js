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

// DOM Elements
const requestListElement = document.getElementById("request-list");
const detailsElement = document.getElementById("request-details");
const filterStatusSelect = document.getElementById("filter-status");
const filterDepartmentSelect = document.getElementById("filter-department");
const searchInput = document.getElementById("search-input");
const statusMessageElement = document.getElementById("status-message");

// Event listeners
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // First verify admin token
    await verifyAdminToken();

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
    const response = await fetch("admin-sidebar.html");
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
  } catch (error) {
    console.error("Error loading sidebar:", error);
  }
}

// Initialize filters
function initFilters() {
  if (filterStatusSelect) {
    filterStatusSelect.addEventListener("change", applyFilters);
  }

  if (filterDepartmentSelect) {
    filterDepartmentSelect.addEventListener("change", applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
}

// Load section change requests
async function loadSectionRequests() {
  showMessage("Chargement des demandes...", "info");

  try {
    // Use enhanced adminAPI if available
    if (window.adminAPI && window.adminAPI.getSectionChangeRequests) {
      try {
        const requests = await window.adminAPI.getSectionChangeRequests();
        if (Array.isArray(requests)) {
          currentRequests = requests;
          filteredRequests = [...currentRequests];
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
    const response = await apiCall("change-requests/section");

    if (!response || !response.data) {
      throw new Error("Invalid response format");
    }

    currentRequests = response.data;
    filteredRequests = [...currentRequests];

    // Render requests
    renderRequestList();

    // Clear status message
    showMessage("", "none");
  } catch (error) {
    console.error("Error loading section requests:", error);

    // If we're in development mode, use mock data
    if (DEV_MODE) {
      // Try to use the newer mock data function first
      if (typeof window.getMockDataForEndpoint === "function") {
        currentRequests = window.getMockDataForEndpoint(
          "change-requests/section"
        );
      } else if (typeof getMockSectionRequests === "function") {
        currentRequests = getMockSectionRequests();
      } else {
        currentRequests = [];
      }

      filteredRequests = [...currentRequests];
      renderRequestList();
      showMessage(
        "Utilisation des données de test (mode développement)",
        "warning"
      );
    } else {
      showMessage("Erreur lors du chargement des demandes", "error");
    }
  }
}

// Render the list of requests
function renderRequestList() {
  if (!requestListElement) return;

  // Clear existing content
  requestListElement.innerHTML = "";

  if (filteredRequests.length === 0) {
    requestListElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Aucune demande trouvée</h3>
        <p>Aucune demande de changement de section ne correspond aux critères sélectionnés.</p>
      </div>
    `;
    return;
  }

  // Create a list item for each request
  filteredRequests.forEach((request) => {
    const createdDate = new Date(request.createdAt).toLocaleDateString("fr-FR");
    const status = request.status || "pending";
    const statusColor = statusColors[status] || statusColors.pending;

    const studentName = request.etudiant
      ? `${request.etudiant.firstName} ${request.etudiant.lastName}`
      : "Étudiant inconnu";

    const studentMatricule = request.etudiant
      ? request.etudiant.matricule
      : "N/A";

    const currentSectionName = request.currentSection
      ? request.currentSection.name
      : "Section inconnue";

    const requestedSectionName = request.requestedSection
      ? request.requestedSection.name
      : "Section inconnue";

    const listItem = document.createElement("div");
    listItem.className = `list-item ${
      request.id === selectedRequestId ? "active" : ""
    }`;
    listItem.onclick = () => selectRequest(request.id);

    listItem.innerHTML = `
      <div class="list-item-content">
        <div class="student-info">
          <div class="student-avatar">
            ${studentName.charAt(0)}${
      studentName.split(" ")[1]?.charAt(0) || ""
    }
          </div>
          <div class="student-details">
            <span class="student-name">${studentName}</span>
            <span class="student-matricule">${studentMatricule}</span>
          </div>
        </div>

        <div class="section-change-container">
          <div class="section-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            ${currentSectionName}
          </div>
          <span class="section-change-arrow">→</span>
          <div class="section-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            ${requestedSectionName}
          </div>
        </div>

        <div class="list-item-meta">
          <span class="request-date">${createdDate}</span>
          <span class="request-status" style="background-color: ${statusColor}20; color: ${statusColor}">
            ${capitalizeFirstLetter(status)}
          </span>
        </div>
      </div>
    `;

    requestListElement.appendChild(listItem);
  });
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

  const currentSectionName = request.currentSection
    ? request.currentSection.name
    : "Section inconnue";

  const requestedSectionName = request.requestedSection
    ? request.requestedSection.name
    : "Section inconnue";

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
  const statusFilter = filterStatusSelect ? filterStatusSelect.value : "";
  const departmentFilter = filterDepartmentSelect
    ? filterDepartmentSelect.value
    : "";
  const searchText = searchInput ? searchInput.value.toLowerCase() : "";

  filteredRequests = currentRequests.filter((request) => {
    // Filter by status
    if (statusFilter && request.status !== statusFilter) {
      return false;
    }

    // Filter by department
    if (
      departmentFilter &&
      !request.currentSection?.department?.id !== departmentFilter &&
      !request.requestedSection?.department?.id !== departmentFilter
    ) {
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
