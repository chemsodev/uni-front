// Request Tracker - keeps track of request statuses and creates notifications on status changes

// Store the last known status of requests
let requestStatusCache = {};

// Initialize from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
  try {
    const savedCache = localStorage.getItem("requestStatusCache");
    if (savedCache) {
      requestStatusCache = JSON.parse(savedCache);
    }
  } catch (e) {
    console.error("Error loading request status cache:", e);
    requestStatusCache = {};
  }
});

/**
 * Updates the request status cache with current request statuses
 * @param {Array} requests - Array of request objects
 * @returns {Array} - Array of requests with status changes
 */
function updateRequestStatusCache(requests) {
  if (!requests || !Array.isArray(requests)) return [];

  // Track which requests have status changes
  const changedRequests = [];

  requests.forEach((request) => {
    const requestId = request.id;

    // If we have this request in our cache and the status has changed
    if (
      requestStatusCache[requestId] &&
      requestStatusCache[requestId].status !== request.status
    ) {
      changedRequests.push({
        request,
        oldStatus: requestStatusCache[requestId].status,
        newStatus: request.status,
      });
    }

    // Update the cache
    requestStatusCache[requestId] = {
      status: request.status,
      type: request.type,
      lastUpdated: new Date().toISOString(),
    };
  });

  // Save updated cache to localStorage
  try {
    localStorage.setItem(
      "requestStatusCache",
      JSON.stringify(requestStatusCache)
    );
  } catch (e) {
    console.error("Error saving request status cache:", e);
  }

  return changedRequests;
}

/**
 * Process changes in request statuses and create notifications
 * @param {Array} changedRequests - Array of requests with status changes
 */
async function processRequestStatusChanges(changedRequests) {
  if (!changedRequests || changedRequests.length === 0) return;

  // Check if the notification function is available
  if (typeof createChangeRequestNotification !== "function") {
    console.error("createChangeRequestNotification function not available");
    return;
  }

  console.log("Processing status changes for requests:", changedRequests);

  for (const change of changedRequests) {
    const { request, newStatus } = change;

    // Determine if the request was approved or rejected
    let approved = null;

    if (newStatus === "processed") {
      // For processed requests, we need to check if they were approved or rejected
      // This depends on how your backend reports approval status
      // Since we don't have direct access to that information here, we'll infer it

      if (
        request.approved === true ||
        request.processingResult === "approved"
      ) {
        approved = true;
      } else if (
        request.approved === false ||
        request.processingResult === "rejected"
      ) {
        approved = false;
      }
    }

    // Create notification with appropriate status and approval info
    try {
      await createChangeRequestNotification(request, newStatus, approved);
    } catch (e) {
      console.error(
        "Error creating notification for request status change:",
        e
      );
    }
  }
}
