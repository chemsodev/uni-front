/**
 * Profile Requests Handler for Admin Interface
 * Integrates with the backend API for profile change requests
 */

/**
 * Main function to load profile change requests from the API
 */
async function loadProfileRequests() {
  try {
    if (!requestsTableBody) {
      console.error("requestsTableBody element not found");
      showMessage("Erreur: Table non trouvée", "error");
      return;
    }

    requestsTableBody.innerHTML =
      '<tr><td colspan="6" class="loading">Chargement des demandes...</td></tr>';
    showMessage("Chargement des demandes...", "info");

    // Get current filter values to apply on the server-side
    const filters = {};
    if (requestTypeFilter && requestTypeFilter.value !== "all") {
      filters.userType = requestTypeFilter.value;
    }
    if (statusFilter && statusFilter.value !== "all") {
      filters.status = statusFilter.value;
    }
    if (searchInput && searchInput.value.trim()) {
      filters.search = searchInput.value.trim();
    } // Call the API directly to get profile requests
    let response;
    try {
      response = await apiCall("profile-requests", "GET");
    } catch (error) {
      console.warn("API call failed, falling back to mock data:", error);
      // Fallback to mock data when API fails
      if (window.getMockProfileRequests) {
        response = window.getMockProfileRequests();
      } else {
        throw new Error("API call failed and no mock data available");
      }
    } // Process the response based on the provided sample data structure
    if (response && Array.isArray(response)) {
      allRequests = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      // Try to extract from response.data if direct API call doesn't work
      allRequests = response.data;
    } else if (response && response.success === false) {
      // If API returned an error response, fall back to mock data
      console.warn(
        "API returned error, falling back to mock data:",
        response.error
      );
      if (window.getMockProfileRequests) {
        allRequests = window.getMockProfileRequests();
      } else {
        allRequests = [];
      }
    } else {
      allRequests = [];
    }

    if (allRequests.length === 0 && window.getMockProfileRequests) {
      console.warn(
        "No profile requests found in API response, using mock data"
      );
      allRequests = window.getMockProfileRequests();
    }

    // Update the UI
    updateStats();
    filterProfileRequests();

    showMessage(
      `${allRequests.length} demandes chargées avec succès`,
      "success"
    );
  } catch (error) {
    console.error("Error loading profile requests:", error);
    allRequests = [];
    showMessage(`Erreur: ${error.message}`, "error");
    requestsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Erreur lors du chargement des demandes. Veuillez réessayer plus tard.</td></tr>`;
  }
}

/**
 * Filter profile requests based on current filter settings
 */
function filterProfileRequests() {
  filteredRequests = [...allRequests];

  // Apply filters
  if (statusFilter && statusFilter.value !== "all") {
    filteredRequests = filteredRequests.filter(
      (request) => request.status === statusFilter.value
    );
  }

  // Search filter - match student name, matricule, or email
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    filteredRequests = filteredRequests.filter((request) => {
      const student = request.student || {};

      return (
        (student.firstName &&
          student.firstName.toLowerCase().includes(searchTerm)) ||
        (student.lastName &&
          student.lastName.toLowerCase().includes(searchTerm)) ||
        (student.matricule &&
          student.matricule.toLowerCase().includes(searchTerm)) ||
        (student.email && student.email.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Always reset to first page on filter
  currentPage = 1;

  // Render the filtered requests
  renderProfileRequests();
}

/**
 * Render profile requests table with pagination
 */
function renderProfileRequests() {
  console.log("renderProfileRequests called");
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRequests.slice(startIndex, endIndex);

  requestsTableBody.innerHTML = "";

  currentItems.forEach((request) => {
    const student = request.student || {};
    const changesCount = request.changes
      ? Object.keys(request.changes).length
      : 0;
    const requestDate = new Date(request.createdAt).toLocaleDateString();
    const statusClass = getStatusClass(request.status);
    const statusText = getStatusText(request.status);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="user-info">
          <div class="user-avatar">${student.firstName?.charAt(0) || ""}${
      student.lastName?.charAt(0) || ""
    }</div>
          <div class="user-details">
            <span class="user-name">${student.firstName || ""} ${
      student.lastName || ""
    }</span>
            <span class="user-email">${student.email || ""}</span>
          </div>
        </div>
      </td>
      <td>Étudiant</td>
      <td>${changesCount} champ${changesCount > 1 ? "s" : ""}</td>
      <td>${requestDate}</td>
      <td><span class="request-status ${statusClass}">${statusText}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="openRequestDetails('${
            request.id
          }')">
            <i class="fas fa-eye"></i> Détails
          </button>
          ${
            request.status === "pending"
              ? `
            <button class="btn btn-success btn-sm" onclick="quickApprove('${request.id}', event)">
              <i class="fas fa-check"></i> Approuver
            </button>
            <button class="btn btn-danger btn-sm" onclick="quickReject('${request.id}', event)">
              <i class="fas fa-times"></i> Rejeter
            </button>
          `
              : ""
          }
        </div>
      </td>
    `;

    requestsTableBody.appendChild(row);
  });

  updatePagination(Math.ceil(filteredRequests.length / itemsPerPage));
}

/**
 * Open request details modal with formatted data
 */
function openProfileRequestDetails(requestId) {
  // Find the request by ID
  const request = allRequests.find((req) => req.id === requestId);

  if (!request) {
    showMessage("Demande introuvable", "error");
    return;
  }

  // Store current request for action handlers
  currentRequest = request;

  // Get student info
  const student = request.student || {};

  // Set user avatar and name
  const firstInitial = student.firstName ? student.firstName.charAt(0) : "E";
  const lastInitial = student.lastName ? student.lastName.charAt(0) : "";
  userAvatar.textContent = firstInitial + lastInitial;

  userName.textContent = `${student.firstName || ""} ${student.lastName || ""}`;
  userEmail.textContent = student.email || "";

  // Set user type (all are students in this context)
  userType.textContent = "Étudiant";

  // Format and display request date
  requestDate.textContent = new Date(request.createdAt).toLocaleDateString(
    "fr-FR"
  );

  // Set status with appropriate class
  let statusClass = "status-pending";
  let statusText = "En attente";

  if (request.status === "approved") {
    statusClass = "status-approved";
    statusText = "Approuvée";
  } else if (request.status === "rejected") {
    statusClass = "status-rejected";
    statusText = "Rejetée";
  } else if (request.status === "cancelled") {
    statusClass = "status-cancelled";
    statusText = "Annulée";
  }

  requestStatus.textContent = statusText;
  requestStatus.className = `request-status ${statusClass}`;

  // Display changes
  fieldsContainer.innerHTML = "";

  if (request.changes && Object.keys(request.changes).length > 0) {
    // Using the changes from the API structure
    for (const [field, newValue] of Object.entries(request.changes)) {
      const fieldDiv = document.createElement("div");
      fieldDiv.className = "field-change";

      // Get old value from current phone or address if available
      const oldValue = getStudentOriginalValue(student, field) || "-";

      fieldDiv.innerHTML = `
        <div class="field-name">${formatProfileFieldName(field)}</div>
        <div class="field-comparison">
          <div class="field-old">${oldValue}</div>
          <div class="compare-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
          <div class="field-new">${newValue || "Non spécifié"}</div>
        </div>
      `;

      fieldsContainer.appendChild(fieldDiv);
    }
  } else {
    fieldsContainer.innerHTML =
      "<p>Aucune modification de champ spécifiée.</p>";
  }

  // Display admin response if available
  if (request.adminComment) {
    adminResponseContainer.style.display = "block";
    adminResponseText.textContent = request.adminComment;
  } else {
    adminResponseContainer.style.display = "none";
  }

  // Show/hide action buttons based on status
  actionButtons.style.display = request.status === "pending" ? "block" : "none";

  // Clear comment field
  adminComment.value = "";

  // Open the modal
  requestModal.style.display = "block";
}

/**
 * Get original value from student object based on field name in changes
 */
function getStudentOriginalValue(student, field) {
  // Map API field names to student object properties
  const fieldMapping = {
    personalEmail: "email",
    phone: "phone",
    secondaryPhone: "numeroTelephoneSecondaire",
    address: "adressePostale",
    postalCode: "codePostal",
    city: "ville",
    emergencyContact: "contactEnCasDurgence",
  };

  // Use the mapped field name or the original if not found
  return student[fieldMapping[field] || field] || student[field] || "-";
}

/**
 * Format field names for display
 */
function formatProfileFieldName(fieldName) {
  // Map of field names to display labels
  const fieldLabels = {
    personalEmail: "Email personnel",
    phone: "Téléphone principal",
    secondaryPhone: "Téléphone secondaire",
    address: "Adresse",
    postalCode: "Code postal",
    city: "Ville",
    emergencyContact: "Contact d'urgence",
  };

  return (
    fieldLabels[fieldName] ||
    fieldName.charAt(0).toUpperCase() +
      fieldName.slice(1).replace(/([A-Z])/g, " $1")
  );
}

/**
 * Handle approval or rejection of profile change request
 */
async function handleProfileRequestAction(status) {
  if (!currentRequest) {
    showMessage("Aucune demande sélectionnée", "error");
    return;
  }

  const requestId = currentRequest.id;
  const comment = adminComment.value.trim();

  try {
    showMessage(`Traitement de la demande en cours...`, "info");

    // Call API to update the request status
    const url = `profile-requests/${requestId}/status`;
    const data = {
      status: status,
      adminComment: comment,
    };

    const response = await apiCall(url, "PUT", data);

    if (!response || response.error) {
      throw new Error(response?.message || "Échec de la mise à jour");
    }

    // Update the request in the local array
    const index = allRequests.findIndex((req) => req.id === requestId);
    if (index !== -1) {
      allRequests[index] = {
        ...allRequests[index],
        status: status,
        adminComment: comment,
        processedById: getCurrentAdminId(),
      };
    }

    // Update UI
    updateStats();
    filterProfileRequests();

    // Show success message and close modal
    const actionText = status === "approved" ? "approuvée" : "rejetée";
    showMessage(`Demande ${actionText} avec succès`, "success");
    closeModal();
  } catch (error) {
    console.error("Error updating request status:", error);
    showMessage(`Erreur: ${error.message}`, "error");
  }
}

/**
 * Get current admin ID from session storage
 */
function getCurrentAdminId() {
  return (
    sessionStorage.getItem("admin_id") ||
    localStorage.getItem("admin_id") ||
    null
  );
}

/**
 * Quick approve function for profile requests
 */
async function quickApprove(requestId, event) {
  if (!confirm("Êtes-vous sûr de vouloir approuver cette demande ?")) {
    return;
  }

  try {
    const request = allRequests.find((req) => req.id === requestId);
    if (!request) {
      showMessage("Demande introuvable", "error");
      return;
    }

    // Show loading state
    const button = event ? event.target.closest("button") : null;
    let originalText = "";

    if (button) {
      originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Update request status
    const response = await apiCall(
      `profile-requests/${requestId}/status`,
      "PATCH",
      {
        status: "approved",
        adminComment: "Demande approuvée rapidement",
      }
    );

    if (!response || response.error) {
      throw new Error(response?.message || "Échec de la mise à jour");
    }

    // Update local data
    const index = allRequests.findIndex((req) => req.id === requestId);
    if (index !== -1) {
      allRequests[index] = {
        ...allRequests[index],
        status: "approved",
        adminComment: "Demande approuvée rapidement",
        processedById: getCurrentAdminId(),
      };
    }

    // Update UI
    updateStats();
    filterProfileRequests();
    showMessage("Demande approuvée avec succès", "success");
  } catch (error) {
    console.error("Error approving request:", error);
    showMessage(`Erreur: ${error.message}`, "error");
  } finally {
    // Reset button state if we have one
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
}

/**
 * Quick reject function for profile requests
 */
async function quickReject(requestId, event) {
  if (!confirm("Êtes-vous sûr de vouloir rejeter cette demande ?")) {
    return;
  }

  try {
    const request = allRequests.find((req) => req.id === requestId);
    if (!request) {
      showMessage("Demande introuvable", "error");
      return;
    }

    // Show loading state
    const button = event ? event.target.closest("button") : null;
    let originalText = "";

    if (button) {
      originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Update request status
    const response = await apiCall(
      `profile-requests/${requestId}/status`,
      "PATCH",
      {
        status: "rejected",
        adminComment: "Demande rejetée rapidement",
      }
    );

    if (!response || response.error) {
      throw new Error(response?.message || "Échec de la mise à jour");
    }

    // Update local data
    const index = allRequests.findIndex((req) => req.id === requestId);
    if (index !== -1) {
      allRequests[index] = {
        ...allRequests[index],
        status: "rejected",
        adminComment: "Demande rejetée rapidement",
        processedById: getCurrentAdminId(),
      };
    }

    // Update UI
    updateStats();
    filterProfileRequests();
    showMessage("Demande rejetée avec succès", "success");
  } catch (error) {
    console.error("Error rejecting request:", error);
    showMessage(`Erreur: ${error.message}`, "error");
  } finally {
    // Reset button state if we have one
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
}

/**
 * Update pagination controls
 */
function updatePagination(totalPages) {
  paginationElement.innerHTML = "";

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("pagination-btn");
  prevBtn.innerHTML = "&laquo;";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderProfileRequests();
    }
  });
  paginationElement.appendChild(prevBtn);

  // Page numbers
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.classList.add("pagination-btn");
    if (i === currentPage) pageBtn.classList.add("active");
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderProfileRequests();
    });
    paginationElement.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("pagination-btn");
  nextBtn.innerHTML = "&raquo;";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderProfileRequests();
    }
  });
  paginationElement.appendChild(nextBtn);
}
