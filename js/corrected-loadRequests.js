/**
 * This is a corrected version of the loadRequests function for admin-demandes-section.html
 * It prioritizes actual API calls and doesn't rely on DEV_MODE
 */

async function loadRequests() {
  try {
    showMessage("Chargement des demandes...", "info");

    // Use our enhanced admin API utils if available - prioritize real API connections
    if (window.adminAPI && window.adminAPI.getSectionChangeRequests) {
      try {
        allRequests = await window.adminAPI.getSectionChangeRequests({
          // Optionally add filters here if needed
        });

        if (allRequests && allRequests.length > 0) {
          updateStats();
          filterRequests();
          showMessage("Demandes chargées avec succès", "success");
          return;
        }
      } catch (e) {
        console.log("Error using adminAPI.getSectionChangeRequests:", e);
        // Continue to next approach
      }
    }

    // Direct API call as second option
    try {
      const response = await apiCall("change-requests", "GET");
      if (response && response.data) {
        allRequests = response.data;
        updateStats();
        filterRequests();
        showMessage("Demandes chargées avec succès", "success");
        return;
      }
    } catch (e) {
      console.log("Error fetching change-requests:", e);
      // Continue to fallback or error handling
    }

    // If we reach here, both API approaches failed
    showMessage("Erreur lors du chargement des demandes", "error");
    requestsTableBody.innerHTML = `<tr><td colspan=\"6\" class=\"text-center\">Aucune donnée disponible ou erreur de connexion.</td></tr>`;
  } catch (error) {
    console.error("Error loading requests:", error);
    showMessage("Erreur lors du chargement des demandes", "error");
    requestsTableBody.innerHTML = `<tr><td colspan=\"6\" class=\"text-center\">Erreur lors du chargement des demandes.</td></tr>`;
  }
}
