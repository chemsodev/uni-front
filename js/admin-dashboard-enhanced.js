/**
 * Enhanced dashboard functionality with improved API utilities
 * This file extends admin-dashboard-utils.js with improved methods that
 * use the enhanced adminAPI utilities.
 */

// Enhanced loadRecentActivity function for the dashboard
async function loadRecentActivity() {
  try {
    // Get the activity list element
    const activityList = document.getElementById("activity-list");
    if (!activityList) {
      console.error("Activity list element not found");
      return;
    }

    // Clear existing activity items
    activityList.innerHTML =
      "<div class='loading'>Chargement des activités récentes...</div>";

    // Try to use enhanced adminAPI if available
    let activities = [];
    try {
      if (window.adminAPI && window.adminAPI.getAdminNotifications) {
        activities = await window.adminAPI.getAdminNotifications(5);
        console.log("Activities loaded with adminAPI:", activities);
      } else {
        // Fall back to the older function if adminAPI is not available
        activities = await fetchRecentActivities(5);
        console.log(
          "Activities loaded with fetchRecentActivities:",
          activities
        );
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      activityList.innerHTML =
        "<p>Impossible de charger les activités récentes.</p>";
      return;
    }

    if (!activities || activities.length === 0) {
      activityList.innerHTML = "<p>Aucune activité récente à afficher.</p>";
      return;
    }

    // Clear loading message
    activityList.innerHTML = "";

    // Add activity items
    for (const activity of activities.slice(0, 5)) {
      const date = new Date(activity.createdAt);
      const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      let iconColor = "#3b82f6"; // Default blue
      let iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

      // Determine icon and color based on notification type
      switch (activity.type) {
        case "SECTION_REQUEST":
          iconColor = "#f59e0b"; // Orange
          iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
          break;
        case "PROFILE_REQUEST":
          iconColor = "#10b981"; // Green
          iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
          break;
        case "NEW_USER":
          iconColor = "#6366f1"; // Indigo
          iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`;
          break;
      }

      activityList.innerHTML += `
        <div class="activity-item">
          <div class="activity-icon" style="background-color: ${iconColor};">
            ${iconSvg}
          </div>
          <div class="activity-content">
            <div class="activity-text">${activity.message}</div>
            <div class="activity-time">${formattedDate}</div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error in loadRecentActivity:", error);
    const activityList = document.getElementById("activity-list");
    if (activityList) {
      activityList.innerHTML =
        "<p>Impossible de charger les activités récentes.</p>";
    }
  }
}

// Override the global loadRecentActivity function when this script is loaded
if (typeof window !== "undefined") {
  window.loadRecentActivity = loadRecentActivity;
  console.log("Enhanced dashboard functions loaded");
}
