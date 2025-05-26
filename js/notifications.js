// Global variables
let currentUser = null;
let authToken = null;
let currentFilter = "all";
let notifications = [];
let currentPage = 1;
let itemsPerPage = 5;
let studentData = null;
let userPreferences = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Load navbar
  await loadNavbar();

  // Setup auth
  authToken =
    sessionStorage.getItem("etudiant_token") ||
    localStorage.getItem("etudiant_token");
  if (!authToken) {
    window.location.href = "etudiant-login.html";
    return;
  }

  // Verify token
  try {
    const userData = await verifyToken();
    if (userData) {
      currentUser = { id: userData.userId, email: userData.email };

      // Load student data
      await loadStudentData();

      // Load user preferences
      await loadUserPreferences();

      // Load notifications data
      await loadNotifications();
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
    // Handle network errors gracefully
    displayOfflineMessage();
  }
});

// Get student data from localStorage or API
function getStudentData() {
  try {
    const data = localStorage.getItem("studentData");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Error parsing stored student data:", e);
    return null;
  }
}

// Load student data from API
async function loadStudentData() {
  try {
    // First check if we have data in local storage
    const cachedData = getStudentData();
    if (cachedData) {
      studentData = cachedData;
      updateNavbarUserInfo(studentData);
      return studentData;
    }

    // If not, fetch from the API
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/etudiants/me",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    studentData = await response.json();

    // Save to localStorage for future use
    localStorage.setItem("studentData", JSON.stringify(studentData));

    // Update UI
    updateNavbarUserInfo(studentData);
    return studentData;
  } catch (error) {
    console.error("Error loading student data:", error);
    return null;
  }
}

// Update user info in navbar
function updateNavbarUserInfo(studentData) {
  if (!studentData) return;

  const userName = document.querySelector(".user-name");
  const userId = document.querySelector(".user-id");
  const userInitial = document.querySelector(".user-avatar");

  if (userName) {
    userName.textContent =
      `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim() ||
      "Étudiant";
  }

  if (userId) {
    userId.textContent = studentData.matricule
      ? `Matricule: ${studentData.matricule}`
      : `ID: ${studentData.id}`;
  }

  if (userInitial && studentData.firstName) {
    userInitial.textContent = studentData.firstName.charAt(0) || "E";
  }
}

// Load navbar
async function loadNavbar() {
  try {
    const nav = await fetch("etudiant-nav.html").then((r) => r.text());
    document.getElementById("navbar-container").innerHTML = nav;

    // Update unread count in the navbar
    updateUnreadBadge();

    // Update user info if we have student data
    const cachedData = getStudentData();
    if (cachedData) {
      updateNavbarUserInfo(cachedData);
    }

    // Set active link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "notification.html") {
        link.classList.add("active");
      }
    });
  } catch (e) {
    console.error("Error loading navbar:", e);
  }
}

// Verify auth token
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

      // Try to refresh the token if it's expired
      if (res.status === 401) {
        console.log("Attempting to refresh token...");
        const refreshed = await refreshToken();
        if (refreshed) {
          // Try verification again with new token
          return await verifyToken();
        }
      }

      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}

// Attempt to refresh an expired token
async function refreshToken() {
  try {
    // Get refresh token if it exists
    const refreshTokenValue =
      sessionStorage.getItem("etudiant_refresh_token") ||
      localStorage.getItem("etudiant_refresh_token");

    if (!refreshTokenValue) {
      console.warn("No refresh token available");
      return false;
    }

    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      }
    );

    if (!response.ok) {
      console.warn("Token refresh failed");
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

// Fetch notifications from backend
async function loadNotifications() {
  try {
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/notifications",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    notifications = await response.json();
    console.log("Loaded notifications:", notifications);

    // Display notifications with the current filter
    filterNotifications(currentFilter);

    // Update unread count in navbar
    updateUnreadBadge();
  } catch (error) {
    console.error("Error loading notifications:", error);
    // Show error message
    document.getElementById("notification-list").innerHTML =
      '<div class="notification-error">Error loading notifications. Please try again later.</div>';
  }
}

// Update the badge showing unread count in navbar
async function updateUnreadBadge() {
  try {
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/notifications/unread-count",
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

// Filter notifications by type
function filterNotifications(type) {
  currentFilter = type;
  currentPage = 1;

  // Highlight the active filter button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`.filter-btn[onclick*="${type}"]`)
    .classList.add("active");

  let filteredNotifications = notifications;

  if (type !== "all") {
    if (type === "unread") {
      filteredNotifications = notifications.filter(
        (notification) => !notification.isRead
      );
    } else {
      filteredNotifications = notifications.filter(
        (notification) => notification.type === type
      );
    }
  }

  displayNotifications(filteredNotifications);
}

// Display notifications in the UI with pagination
function displayNotifications(notificationsList) {
  const container = document.getElementById("notification-list");
  container.innerHTML = ""; // Clear existing notifications

  if (notificationsList.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Aucune notification à afficher</div>';
    document.querySelector(".pagination").style.display = "none";
    return;
  }

  // Apply grouping based on user preferences if available
  let processedNotifications = notificationsList;

  if (userPreferences && userPreferences.grouping !== "none") {
    processedNotifications = applyNotificationGrouping(notificationsList);
  }

  // Calculate pagination
  const totalPages = Math.ceil(processedNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    processedNotifications.length
  );

  // Display current page items
  for (let i = startIndex; i < endIndex; i++) {
    const notification = processedNotifications[i];
    container.appendChild(createNotificationElement(notification));
  }

  // Update pagination
  updatePagination(totalPages);
}

// Create a single notification element
function createNotificationElement(notification) {
  // Create notification element
  const element = document.createElement("div");
  element.className = `notification-item ${
    notification.isRead ? "" : "unread"
  } ${notification.type}`;
  element.dataset.id = notification.id;
  element.dataset.type = notification.type;
  element.dataset.read = notification.isRead;

  // Add grouped class if this is a grouped notification
  if (notification.isGrouped) {
    element.classList.add("grouped-notification");
    element.dataset.groupCount = notification.groupCount;
  }

  // Get icon based on notification type
  let icon = "A";
  let iconClass = "icon-admin";

  switch (notification.type) {
    case "cours":
      icon = "C";
      iconClass = "icon-cours";
      break;
    case "examen":
      icon = "E";
      iconClass = "icon-examen";
      break;
    case "emploi_du_temps":
      icon = "T";
      iconClass = "icon-schedule";
      break;
  }

  // Create icon element
  const iconElement = document.createElement("div");
  iconElement.className = `notification-icon ${iconClass}`;
  iconElement.textContent = icon;

  // Create content container
  const content = document.createElement("div");
  content.className = "notification-content";

  // Create title
  const title = document.createElement("div");
  title.className = "notification-title";
  title.textContent = notification.title || "Notification";

  // Create message
  const message = document.createElement("div");
  message.className = "notification-message";
  message.textContent = notification.content || notification.message || "";

  // Create action link if it exists
  let actionHtml = "";
  if (notification.actionLink && notification.actionLabel) {
    const action = document.createElement("a");
    action.href = notification.actionLink;
    action.className = "notification-action";
    action.textContent = notification.actionLabel;
    actionHtml = action.outerHTML;
  }

  // Create time element
  const time = document.createElement("span");
  time.className = "notification-time";
  time.textContent = formatTimeAgo(notification.createdAt);

  // Add content to content container
  content.appendChild(title);
  content.appendChild(message);

  if (actionHtml) {
    content.innerHTML += actionHtml;
  }

  content.appendChild(time);

  // For grouped notifications, add expand option and group items
  if (notification.isGrouped && notification.groupItems) {
    const expandButton = document.createElement("div");
    expandButton.className = "expand-group";
    expandButton.textContent = "Voir toutes les notifications";
    expandButton.onclick = function (e) {
      e.stopPropagation(); // Don't trigger the parent click

      // Toggle the group items visibility
      const groupItems = this.nextElementSibling;
      groupItems.classList.toggle("expanded");

      // Update button text
      this.textContent = groupItems.classList.contains("expanded")
        ? "Masquer les détails"
        : "Voir toutes les notifications";
    };
    content.appendChild(expandButton);

    // Add container for group items
    const groupItemsContainer = document.createElement("div");
    groupItemsContainer.className = "group-items";

    // Add each notification in the group
    notification.groupItems.forEach((item) => {
      const groupItem = document.createElement("div");
      groupItem.className = "group-item";

      const groupItemTitle = document.createElement("div");
      groupItemTitle.className = "group-item-title";
      groupItemTitle.textContent = item.title || "Notification";

      const groupItemContent = document.createElement("div");
      groupItemContent.className = "group-item-content";
      groupItemContent.textContent = item.content || item.message || "";

      const groupItemTime = document.createElement("div");
      groupItemTime.className = "group-item-time";
      groupItemTime.textContent = formatTimeAgo(item.createdAt);

      groupItem.appendChild(groupItemTitle);
      groupItem.appendChild(groupItemContent);
      groupItem.appendChild(groupItemTime);

      // Add click handler for individual items
      groupItem.addEventListener("click", (e) => {
        e.stopPropagation();
        markAsRead(item.id);

        // Handle action link if present
        if (item.actionLink) {
          window.location.href = item.actionLink;
        }
      });

      groupItemsContainer.appendChild(groupItem);
    });

    content.appendChild(groupItemsContainer);
  }

  // Add elements to notification item
  element.appendChild(iconElement);
  element.appendChild(content);

  // Add click handler to mark as read and handle action
  if (!notification.isGrouped) {
    element.addEventListener("click", () => {
      markAsRead(notification.id);

      // Handle action link if present
      if (notification.actionLink) {
        window.location.href = notification.actionLink;
      }
    });
  } else {
    // For grouped notifications, just mark as read without navigating
    element.addEventListener("click", () => {
      markAsRead(notification.id);
    });
  }

  return element;
}

// Mark a notification as read
async function markAsRead(id, button) {
  try {
    const response = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/notifications/${id}/mark-read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Update the notification in our local data
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      notification.isRead = true;
    }

    // Update the UI - remove unread class
    const notificationElement = button.closest(".notification-item");
    notificationElement.classList.remove("unread");
    notificationElement.dataset.read = "true";

    // Replace the mark as read button with delete button
    const actionDiv = button.parentElement;
    button.outerHTML = `<button class="notification-btn" onclick="deleteNotification('${id}')">Supprimer</button>`;

    // Update badge count
    updateUnreadBadge();
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    alert(
      "Une erreur est survenue lors du marquage de la notification comme lue."
    );
  }
}

// Mark all notifications as read
async function markAllAsRead() {
  try {
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/notifications/mark-all-read",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Update all notifications in our local data
    notifications.forEach((notification) => {
      notification.isRead = true;
    });

    // Refresh the display
    filterNotifications(currentFilter);

    // Update badge count
    updateUnreadBadge();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    alert(
      "Une erreur est survenue lors du marquage de toutes les notifications comme lues."
    );
  }
}

// Delete a notification
async function deleteNotification(id) {
  if (!confirm("Voulez-vous vraiment supprimer cette notification?")) {
    return;
  }

  try {
    const response = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/notifications/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Remove from our local data
    notifications = notifications.filter((n) => n.id !== id);

    // Refresh the display
    filterNotifications(currentFilter);
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    alert("Une erreur est survenue lors de la suppression de la notification.");
  }
}

// Delete all read notifications
async function deleteAllRead() {
  if (
    !confirm("Voulez-vous vraiment supprimer toutes les notifications lues?")
  ) {
    return;
  }

  try {
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/notifications/read/all",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Remove all read notifications from our local data
    notifications = notifications.filter((n) => !n.isRead);

    // Refresh the display
    filterNotifications(currentFilter);
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    alert(
      "Une erreur est survenue lors de la suppression des notifications lues."
    );
  }
}

// Load User Preferences
async function loadUserPreferences() {
  try {
    // First try to get from localStorage
    const savedPreferences = localStorage.getItem("notificationPreferences");
    if (savedPreferences) {
      userPreferences = JSON.parse(savedPreferences);
    } else {
      // Default preferences
      userPreferences = {
        types: {
          admin: true,
          cours: true,
          examen: true,
          emploi_du_temps: true,
        },
        email: false,
        grouping: "none",
      };

      // Save default preferences
      localStorage.setItem(
        "notificationPreferences",
        JSON.stringify(userPreferences)
      );
    }

    // Update the preferences UI
    updatePreferencesUI();
  } catch (error) {
    console.error("Error loading user preferences:", error);
  }
}

// Update Preferences UI
function updatePreferencesUI() {
  if (!userPreferences) return;

  // Update checkboxes
  document.getElementById("pref-admin").checked = userPreferences.types.admin;
  document.getElementById("pref-cours").checked = userPreferences.types.cours;
  document.getElementById("pref-examen").checked = userPreferences.types.examen;
  document.getElementById("pref-emploi_du_temps").checked =
    userPreferences.types.emploi_du_temps;

  // Update email preference
  document.getElementById("pref-email").checked = userPreferences.email;

  // Update grouping preference
  document.getElementById("pref-grouping").value = userPreferences.grouping;
}

// Save User Preferences
function savePreferences() {
  // Collect preferences from UI
  const preferences = {
    types: {
      admin: document.getElementById("pref-admin").checked,
      cours: document.getElementById("pref-cours").checked,
      examen: document.getElementById("pref-examen").checked,
      emploi_du_temps: document.getElementById("pref-emploi_du_temps").checked,
    },
    email: document.getElementById("pref-email").checked,
    grouping: document.getElementById("pref-grouping").value,
  };

  // Save to localStorage
  localStorage.setItem("notificationPreferences", JSON.stringify(preferences));
  userPreferences = preferences;

  // Send to backend if needed
  savePreferencesToServer(preferences);

  // Show success message
  showToast("Préférences sauvegardées avec succès!");
}

// Save preferences to server
async function savePreferencesToServer(preferences) {
  try {
    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/notifications/preferences",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      }
    );

    if (!response.ok) {
      console.warn("Failed to save preferences to server:", response.status);
    }
  } catch (error) {
    console.error("Error saving preferences to server:", error);
    // Still keep local preferences
  }
}

// Show toast message
function showToast(message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  // Add to container
  toastContainer.appendChild(toast);

  // Remove after timeout
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Handle action link navigation
function navigateTo(url) {
  window.location.href = url;
}

// Update pagination UI
function updatePagination(totalPages) {
  const paginationContainer = document.querySelector(".pagination");

  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";
  paginationContainer.innerHTML = "";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.className = "pagination-btn";
  prevBtn.innerHTML = "&laquo;";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterNotifications(currentFilter);
    }
  });
  paginationContainer.appendChild(prevBtn);

  // Page buttons
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      filterNotifications(currentFilter);
    });
    paginationContainer.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "pagination-btn";
  nextBtn.innerHTML = "&raquo;";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      filterNotifications(currentFilter);
    }
  });
  paginationContainer.appendChild(nextBtn);
}

// Display offline message when backend is unreachable
function displayOfflineMessage() {
  const container = document.getElementById("notification-list");
  container.innerHTML = `
    <div class="offline-message">
      <div class="offline-icon">📶</div>
      <h3>Connexion impossible</h3>
      <p>Le service de notifications est actuellement indisponible. Veuillez vérifier votre connexion et réessayer plus tard.</p>
      <button onclick="location.reload()" class="retry-btn">Réessayer</button>
    </div>
  `;
  document.querySelector(".pagination").style.display = "none";
}

// Logout function
function logout() {
  localStorage.removeItem("etudiant_token");
  sessionStorage.removeItem("etudiant_token");
  localStorage.removeItem("studentData");
  sessionStorage.clear();
  window.location.href = "etudiant-login.html";
}

// Apply grouping to notifications based on user preferences
function applyNotificationGrouping(notifications) {
  if (!userPreferences) return notifications;

  const groupingStrategy = userPreferences.grouping;

  if (groupingStrategy === "none") {
    return notifications;
  }

  if (groupingStrategy === "daily") {
    return groupNotificationsByDate(notifications);
  }

  if (groupingStrategy === "type") {
    return groupNotificationsByType(notifications);
  }

  return notifications;
}

// Group notifications by date
function groupNotificationsByDate(notifications) {
  const groupedNotifications = [];
  const notificationsByDate = {};

  // First, group by date string
  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    const dateString = date.toLocaleDateString();

    if (!notificationsByDate[dateString]) {
      notificationsByDate[dateString] = [];
    }

    notificationsByDate[dateString].push(notification);
  });

  // For each date group, if there are multiple notifications of same type, group them
  Object.keys(notificationsByDate).forEach((dateString) => {
    const dateNotifications = notificationsByDate[dateString];
    const typeGroups = {};

    // Group by type within each date
    dateNotifications.forEach((notification) => {
      if (!typeGroups[notification.type]) {
        typeGroups[notification.type] = [];
      }
      typeGroups[notification.type].push(notification);
    });

    // For each type group within this date, create individual or grouped notifications
    Object.keys(typeGroups).forEach((type) => {
      const typeNotifications = typeGroups[type];

      if (typeNotifications.length === 1) {
        // Just add the single notification
        groupedNotifications.push(typeNotifications[0]);
      } else if (typeNotifications.length > 1) {
        // Create a grouped notification
        const firstNotif = typeNotifications[0];
        const groupedNotification = {
          ...firstNotif,
          isGrouped: true,
          groupCount: typeNotifications.length,
          groupItems: typeNotifications,
          title: `${typeNotifications.length} notifications de ${getTypeLabel(
            type
          )} - ${dateString}`,
          content: `Vous avez ${
            typeNotifications.length
          } notifications de ${getTypeLabel(type).toLowerCase()} aujourd'hui.`,
        };
        groupedNotifications.push(groupedNotification);
      }
    });
  });

  // Sort the grouped notifications by date, newest first
  return groupedNotifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Group notifications by type
function groupNotificationsByType(notifications) {
  const groupedNotifications = [];
  const notificationsByType = {};

  // First, group by type
  notifications.forEach((notification) => {
    if (!notificationsByType[notification.type]) {
      notificationsByType[notification.type] = [];
    }
    notificationsByType[notification.type].push(notification);
  });

  // For each type, create individual or grouped notifications
  Object.keys(notificationsByType).forEach((type) => {
    const typeNotifications = notificationsByType[type];

    // Sort by date, newest first
    typeNotifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (typeNotifications.length <= 3) {
      // Add individual notifications if there are just a few
      typeNotifications.forEach((notification) => {
        groupedNotifications.push(notification);
      });
    } else {
      // Create a grouped notification
      const firstNotif = typeNotifications[0]; // Most recent one
      const groupedNotification = {
        ...firstNotif,
        isGrouped: true,
        groupCount: typeNotifications.length,
        groupItems: typeNotifications,
        title: `${typeNotifications.length} notifications de ${getTypeLabel(
          type
        )}`,
        content: `Vous avez ${
          typeNotifications.length
        } notifications récentes de type ${getTypeLabel(type).toLowerCase()}.`,
      };
      groupedNotifications.push(groupedNotification);
    }
  });

  // Sort all notifications by date, newest first
  return groupedNotifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Get readable label for notification type
function getTypeLabel(type) {
  switch (type) {
    case "admin":
      return "Administration";
    case "cours":
      return "Cours";
    case "examen":
      return "Examens";
    case "emploi_du_temps":
      return "Emploi du temps";
    default:
      return "Notification";
  }
}

// Format time ago for notifications
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} seconde${seconds !== 1 ? "s" : ""} ago`;
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `${hours} heure${hours !== 1 ? "s" : ""} ago`;
  } else {
    return `${days} jour${days !== 1 ? "s" : ""} ago`;
  }
}
