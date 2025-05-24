// admin-demandes-section-fixes.js
// This file contains fixes for the admin-demandes-section.html page

// Fix for search filter
function fixSearchFilter() {
  const filteredRequests = allRequests.filter((request) => {
    // Status filter
    if (status !== "all" && request.status !== status) {
      return false;
    }

    // Search filter
    if (search) {
      const studentName = `${request.student?.firstName || ""} ${
        request.student?.lastName || ""
      }`.toLowerCase();
      const studentMatricule = (request.student?.matricule || "").toLowerCase();
      const currentSectionName = (
        request.currentSection?.name || ""
      ).toLowerCase();
      const requestedSectionName = (
        request.requestedSection?.name || ""
      ).toLowerCase();

      return (
        studentName.includes(search) ||
        studentMatricule.includes(search) ||
        currentSectionName.includes(search) ||
        requestedSectionName.includes(search)
      );
    }

    return true;
  });

  return filteredRequests;
}

// Fix for pagination button click handlers (previous and next buttons)
function fixPaginationButtons() {
  document
    .querySelector(".pagination-btn.previous")
    .addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderRequests();
      }
    });

  document
    .querySelector(".pagination-btn.next")
    .addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderRequests();
      }
    });
}

// Fix for table rendering
function fixRequestsTable(request) {
  // Status display class and text
  let statusClass = "";
  let statusText = "";

  switch (request.status) {
    case "pending":
      statusClass = "status-warning";
      statusText = "En attente";
      break;
    case "approved":
      statusClass = "status-success";
      statusText = "Approuvée";
      break;
    case "rejected":
      statusClass = "status-danger";
      statusText = "Rejetée";
      break;
    default:
      statusClass = "status-default";
      statusText = "Inconnu";
  }

  // Get student initials
  const studentInitials = (
    (request.student?.firstName || " ")[0] +
    (request.student?.lastName || " ")[0]
  ).toUpperCase();

  // Create HTML for the row
  return `
    <td>${formattedDate}</td>
    <td>
      <div class="student-info">
        <div class="student-avatar">${studentInitials}</div>
        <div class="student-details">
          <span class="student-name">${request.student?.firstName || ""} ${
    request.student?.lastName || ""
  }</span>
          <span class="student-matricule">Matricule: ${
            request.student?.matricule || "N/A"
          }</span>
        </div>
      </div>
    </td>
    <td>
      <div class="section-change-container">
        <span class="section-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="14" rx="1"></rect>
            <rect width="7" height="7" x="3" y="14" rx="1"></rect>
          </svg>
          ${request.currentSection?.name || "Non spécifiée"}
        </span>
        <span class="section-change-arrow">→</span>
        <span class="section-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="3" rx="1"></rect>
            <rect width="7" height="7" x="14" y="14" rx="1"></rect>
            <rect width="7" height="7" x="3" y="14" rx="1"></rect>
          </svg>
          ${request.requestedSection?.name || "Non spécifiée"}
        </span>
      </div>
    </td>
    <td>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </td>
    <td>
      <button class="btn btn-secondary view-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Détails
      </button>
    </td>
  `;
}

// Fix for the request status updates
function fixHandleRequestAction() {
  async function handleRequestAction(status) {
    if (!currentRequest) return;

    try {
      const comment = adminComment.value;

      // Call API to update request status using our helper function
      const updatedRequest = await apiCall(
        `change-requests/${currentRequest.id}/status`,
        "PATCH",
        {
          status: status,
          adminComment: comment,
        }
      );

      // Update request in array
      const index = allRequests.findIndex((r) => r.id === currentRequest.id);
      if (index !== -1) {
        allRequests[index] = updatedRequest;
      }

      // Update UI
      updateStats();
      filterRequests();

      // Show success message
      const actionText = status === "approved" ? "approuvée" : "rejetée";
      showMessage(`Demande ${actionText} avec succès!`, "success");

      // Close modal
      closeModal();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showMessage(
        `Erreur lors de la mise à jour du statut: ${error.message}`,
        "error"
      );
    }
  }

  return handleRequestAction;
}

// Export all fixes
window.AdminSectionRequestsFixes = {
  fixSearchFilter,
  fixPaginationButtons,
  fixRequestsTable,
  fixHandleRequestAction,
};
