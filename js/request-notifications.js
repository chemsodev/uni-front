// Module for handling notifications related to change requests
// This module will handle creating notifications for change request status updates

/**
 * Creates a notification for a change request status update
 * @param {Object} request - The change request object
 * @param {String} status - The new status of the request
 * @param {Boolean} approved - Whether the request was approved (null if pending)
 */
async function createChangeRequestNotification(
  request,
  status,
  approved = null
) {
  if (!authToken) {
    authToken =
      sessionStorage.getItem("etudiant_token") ||
      localStorage.getItem("etudiant_token");
  }

  if (!authToken) {
    console.error("No authentication token available");
    return;
  }

  // Construct the appropriate message based on status and approval
  let title = "";
  let content = "";
  let type = "admin";
  let actionLink = null;
  let actionLabel = null;

  const requestId = request.id || request.requestId;
  const requestType = getCourseChangeTypeLabel(request.type);

  switch (status) {
    case "pending":
      title = `Demande de changement en attente - ${requestType}`;
      content = `Votre demande de changement ${requestId} (${requestType}) a été enregistrée et est en attente d'approbation. Vous recevrez une notification lorsqu'elle sera traitée.`;
      break;

    case "processed":
      if (approved) {
        title = `Demande de changement approuvée - ${requestType}`;
        content = `Votre demande de changement ${requestId} (${requestType}) a été approuvée. Le changement sera effectif immédiatement.`;
        actionLabel = "Voir emploi du temps";
        actionLink = "emploi.html";
      } else {
        title = `Demande de changement refusée - ${requestType}`;
        content = `Votre demande de changement ${requestId} (${requestType}) a été refusée. Contactez l'administration pour plus d'informations.`;
      }
      break;

    case "delegated":
      title = `Délégation de demande - ${requestType}`;
      content = `Votre demande de changement ${requestId} (${requestType}) a été transférée à un administrateur de niveau supérieur pour traitement.`;
      break;

    default:
      title = `Mise à jour - Demande de changement ${requestType}`;
      content = `Le statut de votre demande de changement ${requestId} (${requestType}) a été mis à jour: ${status}.`;
  }

  // Create the notification object to send to the API
  const notification = {
    title,
    content,
    type,
    userId: getUserId(),
    actionLink,
    actionLabel,
  };

  try {
    const response = await fetch("http://localhost:3000/api/notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.status}`);
    }

    // Update the notification badge immediately
    await updateNotificationBadge();

    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    // Store for offline processing later
    storeOfflineNotification(notification);
    return null;
  }
}

/**
 * Store a notification for offline processing
 * @param {Object} notification - The notification object
 */
function storeOfflineNotification(notification) {
  const offlineNotifications = JSON.parse(
    localStorage.getItem("offlineNotifications") || "[]"
  );
  offlineNotifications.push({
    notification,
    timestamp: Date.now(),
  });
  localStorage.setItem(
    "offlineNotifications",
    JSON.stringify(offlineNotifications)
  );
}

/**
 * Processes offline notifications when connectivity is restored
 */
async function processOfflineNotifications() {
  const offlineNotifications = JSON.parse(
    localStorage.getItem("offlineNotifications") || "[]"
  );

  if (offlineNotifications.length === 0) {
    return;
  }

  const failedNotifications = [];

  for (const item of offlineNotifications) {
    try {
      const response = await fetch("http://localhost:3000/api/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.notification),
      });

      if (!response.ok) {
        failedNotifications.push(item);
      }
    } catch (error) {
      failedNotifications.push(item);
    }
  }

  // Update offline storage with only the failed notifications
  localStorage.setItem(
    "offlineNotifications",
    JSON.stringify(failedNotifications)
  );

  // Update badge count
  await updateNotificationBadge();
}

/**
 * Update the notification count badge in the navbar
 */
async function updateNotificationBadge() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/notifications/unread-count",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const badge = document.querySelector(".notification-badge-count");
    if (badge) {
      badge.textContent = data.count;
      badge.style.display = data.count > 0 ? "flex" : "none";
    }
  } catch (error) {
    console.error("Error updating notification badge:", error);
  }
}

/**
 * Get the current user ID from storage
 */
function getUserId() {
  const studentDataJson =
    localStorage.getItem("studentData") ||
    sessionStorage.getItem("studentData");
  if (studentDataJson) {
    try {
      const studentData = JSON.parse(studentDataJson);
      return studentData.userId || studentData.id;
    } catch (e) {
      console.error("Error parsing stored student data:", e);
    }
  }
  return null;
}

/**
 * Get a human-readable label for a course change type
 * @param {String} type - The change request type
 */
function getCourseChangeTypeLabel(type) {
  const typeLabels = {
    td: "Groupe TD",
    tp: "Groupe TP",
    section: "Section",
    section_transfer: "Transfert de Section",
    course: "Cours",
    schedule: "Emploi du temps",
  };

  return typeLabels[type] || "Autre";
}

// Check for offline notifications on page load
document.addEventListener("DOMContentLoaded", function () {
  // Add connectivity listener
  window.addEventListener("online", processOfflineNotifications);

  // If online, try to process any offline notifications
  if (navigator.onLine) {
    processOfflineNotifications();
  }
});
