/**
 * Fixed version of admin-profile-requests.html functions
 * with DEV_MODE and mock data references removed
 */

// Fixed loadRequests function
async function loadRequests() {
  try {
    showMessage("Chargement des demandes...", "info");
    requestsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Chargement des demandes...</td></tr>`;

    // Use our enhanced admin API utils to fetch profile requests
    if (window.adminAPI && window.adminAPI.getProfileRequests) {
      allRequests = await window.adminAPI.getProfileRequests({
        // Optionally add filters here if needed
        // status: filterStatusSelect.value !== 'all' ? filterStatusSelect.value : undefined
      });
    } else {
      // Fall back to direct apiCall if adminAPI is not available
      const response = await apiCall("profile-requests");

      if (!response || !response.data) {
        throw new Error(
          "Failed to fetch profile requests - server may be unavailable."
        );
      } else {
        allRequests = response.data; // Extract data from apiCall's response
      }
    }

    // Ensure allRequests is always an array
    if (!Array.isArray(allRequests)) {
      allRequests = [];
    }

    // Store the requests and update the UI
    updateStats();
    filterRequests();

    showMessage("Demandes chargées avec succès", "success");
  } catch (error) {
    console.error("Error loading profile requests:", error);
    allRequests = [];
    showMessage("Erreur lors du chargement des demandes", "error");
    requestsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Erreur lors du chargement des demandes. Veuillez réessayer plus tard.</td></tr>`;
  }
}

// Fixed handleRequestAction function
async function handleRequestAction(status) {
  if (!currentRequest) {
    showMessage("Erreur: Demande non trouvée", "error");
    return;
  }

  try {
    showMessage("Traitement de la demande...", "info");

    let response;
    // Use enhanced adminAPI methods if available
    if (window.adminAPI && window.adminAPI.updateRequestStatus) {
      response = await window.adminAPI.updateRequestStatus(
        currentRequest.id,
        status,
        adminComment.value
      );
    } else {
      // Fallback to direct apiCall if adminAPI is not available
      const requestData = {
        status: status,
        adminResponse: adminComment.value,
      };

      response = await apiCall(
        `profile-requests/${currentRequest.id}/status`,
        "PATCH",
        requestData
      );
    }

    // Update request in local array
    const index = allRequests.findIndex((req) => req.id === currentRequest.id);
    if (index !== -1 && response && response.data) {
      allRequests[index] = response.data; // apiCall wraps in data
    }

    // Update UI
    updateStats();
    filterRequests();

    // Close modal
    closeModal();

    // Show success message
    const actionText = status === "approved" ? "approuvées" : "rejetées";
    showMessage(`Modifications ${actionText} avec succès`, "success");
  } catch (error) {
    console.error("Error updating request:", error);
    showMessage(
      `Erreur lors du traitement de la demande: ${error.message}`,
      "error"
    );
  }
}
