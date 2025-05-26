/**
 * Enhanced Timetable Viewer Component
 * Provides advanced timetable viewing and management functionalities for section pages
 */

// Initialize the timetable viewer component
document.addEventListener("DOMContentLoaded", function () {
  initTimetableViewerComponent();
});

// Global variables for the component
let currentSectionId = null;
let currentSectionData = null;
let currentScheduleType = "regular";

/**
 * Initialize the timetable viewer component
 */
function initTimetableViewerComponent() {
  // Create the modal structure if it doesn't exist
  createTimetableViewerModal();

  // Set up global event listeners
  setupTimetableViewerEvents();
}

/**
 * Create the timetable viewer modal structure
 */
function createTimetableViewerModal() {
  // Check if the modal already exists
  if (document.getElementById("timetable-viewer-modal")) {
    return;
  }

  // Create the modal structure
  const modalHtml = `
    <div id="timetable-viewer-modal" class="timetable-viewer-modal">
      <div class="timetable-viewer-content">
        <div class="timetable-viewer-header">
          <h2 id="timetable-viewer-title">Emploi du temps</h2>
          <span class="timetable-viewer-close">&times;</span>
        </div>
        <div class="timetable-viewer-body">
          <div class="timetable-viewer-tabs">
            <div class="timetable-viewer-tab active" data-type="regular">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Emploi du temps
            </div>
            <div class="timetable-viewer-tab" data-type="exam">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10v6M6 12h12M12 12v8M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"></path>
              </svg>
              Emploi des examens
            </div>
            <div class="timetable-viewer-tab" data-type="stats">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 20V10M12 20V4M6 20v-6"></path>
              </svg>
              Statistiques
            </div>
          </div>
          <div id="timetable-list-container" class="timetable-list-container">
            <div class="loading-indicator">Chargement...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append the modal to the document body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer.firstElementChild);
}

/**
 * Set up global event listeners for the timetable viewer
 */
function setupTimetableViewerEvents() {
  // Event delegation for opening the timetable viewer
  document.addEventListener("click", function (event) {
    // Look for the view timetable button
    const viewButton = event.target.closest(".view-timetables-btn");
    if (viewButton) {
      const sectionId = viewButton.getAttribute("data-id");
      const sectionName = viewButton.getAttribute("data-name");

      openTimetableViewer(sectionId, sectionName);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Set up close modal functionality
  document.addEventListener("click", function (event) {
    const modal = document.getElementById("timetable-viewer-modal");
    if (!modal) return;

    if (
      event.target.classList.contains("timetable-viewer-close") ||
      event.target === modal
    ) {
      closeTimetableViewer();
    }
  });

  // Tab switching
  document.addEventListener("click", function (event) {
    const tab = event.target.closest(".timetable-viewer-tab");
    if (!tab) return;

    const type = tab.getAttribute("data-type");
    const tabs = document.querySelectorAll(".timetable-viewer-tab");

    // Update active tab
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Show content based on selected tab
    if (currentSectionId) {
      currentScheduleType = type;

      if (type === "stats") {
        loadScheduleStatistics(currentSectionId);
      } else {
        loadTimetables(currentSectionId, type);
      }
    }
  });

  // Event delegation for timetable actions
  document.addEventListener("click", function (event) {
    // View document
    if (event.target.closest(".view-timetable-btn")) {
      const btn = event.target.closest(".view-timetable-btn");
      const url = btn.getAttribute("data-url");
      window.open(url, "_blank");
      event.preventDefault();
    }

    // Download document
    if (event.target.closest(".download-timetable-btn")) {
      const btn = event.target.closest(".download-timetable-btn");
      const url = btn.getAttribute("data-url");
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      event.preventDefault();
    }

    // Delete timetable
    if (event.target.closest(".delete-timetable-btn")) {
      const btn = event.target.closest(".delete-timetable-btn");
      const scheduleId = btn.getAttribute("data-id");

      if (confirm("Voulez-vous vraiment supprimer cet emploi du temps ?")) {
        deleteTimetable(currentSectionId, scheduleId);
      }
      event.preventDefault();
    }
  });
}

/**
 * Open the timetable viewer for a specific section
 */
function openTimetableViewer(sectionId, sectionName) {
  currentSectionId = sectionId;

  // Update modal title
  const title = document.getElementById("timetable-viewer-title");
  title.textContent = `Emploi du temps - Section ${sectionName}`;

  // Show the modal
  const modal = document.getElementById("timetable-viewer-modal");
  modal.style.display = "block";

  // Reset to default tab
  const tabs = document.querySelectorAll(".timetable-viewer-tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  document
    .querySelector('.timetable-viewer-tab[data-type="regular"]')
    .classList.add("active");
  currentScheduleType = "regular";

  // Load timetables
  loadTimetables(sectionId, "regular");

  // Fetch section details if needed
  if (window.sectionAPI && window.sectionAPI.getSectionDetails) {
    window.sectionAPI
      .getSectionDetails(sectionId)
      .then((data) => {
        currentSectionData = data;
      })
      .catch((error) =>
        console.error("Error fetching section details:", error)
      );
  }
}

/**
 * Close the timetable viewer
 */
function closeTimetableViewer() {
  const modal = document.getElementById("timetable-viewer-modal");
  if (modal) {
    modal.style.display = "none";
  }
  currentSectionId = null;
  currentSectionData = null;
}

/**
 * Load timetables for a section
 */
async function loadTimetables(sectionId, type) {
  const container = document.getElementById("timetable-list-container");
  container.innerHTML =
    '<div class="loading-indicator">Chargement des emplois du temps...</div>';

  try {
    // Use the section API if available, otherwise fallback to direct API call
    let schedules;
    if (window.sectionAPI && window.sectionAPI.getSectionSchedules) {
      schedules = await window.sectionAPI.getSectionSchedules(sectionId, type);
    } else {
      const API_URL = "http://localhost:3000/api";
      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/sections/schedules/${sectionId}?type=${type}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      schedules = await response.json();
    }

    renderTimetableList(container, schedules);
  } catch (error) {
    console.error("Error loading timetables:", error);
    container.innerHTML = `
      <div class="empty-timetable-list">
        <div class="empty-timetable-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="empty-timetable-message">
          Une erreur s'est produite lors du chargement des données.
        </div>
      </div>
    `;
  }
}

/**
 * Render the timetable list
 */
function renderTimetableList(container, schedules) {
  if (!schedules || schedules.length === 0) {
    container.innerHTML = `
      <div class="empty-timetable-list">
        <div class="empty-timetable-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="empty-timetable-message">
          Aucun emploi du temps disponible pour cette section.
        </div>
      </div>
    `;
    return;
  }

  // Sort schedules by date (newest first)
  schedules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let html = '<div class="timetable-list">';

  schedules.forEach((schedule) => {
    const createdAt = new Date(schedule.createdAt);
    const formattedDate = createdAt.toLocaleDateString("fr-FR");
    const formattedTime = createdAt.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
      <div class="timetable-item">
        <div class="timetable-info">
          <div class="timetable-title">${
            schedule.title || "Emploi du temps sans titre"
          }</div>
          <div class="timetable-meta">
            <div class="timetable-date">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${formattedDate} à ${formattedTime}
            </div>
            <div class="timetable-academic-year">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              ${schedule.academicYear || "Année académique non spécifiée"}
            </div>
          </div>
        </div>
        <div class="timetable-actions">
          <button class="timetable-action-btn view view-timetable-btn" data-url="${
            schedule.documentUrl
          }" title="Voir le document">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="timetable-action-btn download download-timetable-btn" data-url="${
            schedule.documentUrl
          }" title="Télécharger">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button class="timetable-action-btn delete delete-timetable-btn" data-id="${
            schedule.id
          }" title="Supprimer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

/**
 * Load schedule statistics for a section
 */
async function loadScheduleStatistics(sectionId) {
  const container = document.getElementById("timetable-list-container");
  container.innerHTML =
    '<div class="loading-indicator">Chargement des statistiques...</div>';

  try {
    // Use the section API if available
    let stats;
    if (window.sectionAPI && window.sectionAPI.getSectionScheduleStatistics) {
      stats = await window.sectionAPI.getSectionScheduleStatistics(sectionId);
    } else {
      const API_URL = "http://localhost:3000/api";
      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/sections/schedules/${sectionId}/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      stats = await response.json();
    }

    renderScheduleStatistics(container, stats);
  } catch (error) {
    console.error("Error loading schedule statistics:", error);
    container.innerHTML = `
      <div class="empty-timetable-list">
        <div class="empty-timetable-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="empty-timetable-message">
          Une erreur s'est produite lors du chargement des statistiques.
        </div>
      </div>
    `;
  }
}

/**
 * Render schedule statistics
 */
function renderScheduleStatistics(container, stats) {
  let html = `
    <div class="section-analytics-dashboard">
      <div class="section-analytics-card">
        <h3>Emplois du temps téléchargés</h3>
        <div class="section-analytics-value">${stats.totalSchedules || 0}</div>
        <div class="schedule-stats-details">
          <div class="schedule-stats-card">
            <div>Emplois du temps réguliers: <strong>${
              stats.regularSchedules || 0
            }</strong></div>
            <div>Emplois des examens: <strong>${
              stats.examSchedules || 0
            }</strong></div>
          </div>
        </div>
      </div>
  `;

  // Add latest upload info if available
  if (stats.latestUpload) {
    const latestDate = new Date(stats.latestUpload.createdAt);
    const formattedDate = latestDate.toLocaleDateString("fr-FR");
    const formattedTime = latestDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
      <div class="section-analytics-card">
        <h3>Dernier téléchargement</h3>
        <div class="latest-upload-info">
          <div><strong>${
            stats.latestUpload.title || "Sans titre"
          }</strong></div>
          <div>Type: ${
            stats.latestUpload.type === "exam"
              ? "Emploi des examens"
              : "Emploi du temps"
          }</div>
          <div>Date: ${formattedDate} à ${formattedTime}</div>
        </div>
      </div>
    `;
  }

  html += "</div>";

  // Add charts section if Chart.js is available
  if (typeof Chart !== "undefined") {
    html += `
      <div class="section-analytics-dashboard">
        <div class="section-analytics-card">
          <h3>Distribution des emplois du temps</h3>
          <div class="section-analytics-chart">
            <canvas id="timetable-distribution-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Create chart if Chart.js is available
  if (typeof Chart !== "undefined") {
    const ctx = document.getElementById("timetable-distribution-chart");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Emplois du temps", "Emplois des examens"],
        datasets: [
          {
            data: [stats.regularSchedules || 0, stats.examSchedules || 0],
            backgroundColor: ["#4f46e5", "#f97316"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }
}

/**
 * Delete a timetable
 */
async function deleteTimetable(sectionId, scheduleId) {
  try {
    // Use API to delete the schedule
    const API_URL = "http://localhost:3000/api";
    const token = getAuthToken();

    const response = await fetch(
      `${API_URL}/sections/schedules/${sectionId}/${scheduleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Reload the current view
    if (currentScheduleType === "stats") {
      loadScheduleStatistics(sectionId);
    } else {
      loadTimetables(sectionId, currentScheduleType);
    }

    // Show success message
    showNotification(
      "L'emploi du temps a été supprimé avec succès.",
      "success"
    );
  } catch (error) {
    console.error("Error deleting timetable:", error);
    showNotification(
      "Une erreur s'est produite lors de la suppression.",
      "error"
    );
  }
}

/**
 * Helper function to get auth token
 */
function getAuthToken() {
  return (
    localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
  );
}

/**
 * Helper function to show notification
 */
function showNotification(message, type = "info") {
  // Check if the global notification function exists
  if (typeof window.createNotification === "function") {
    window.createNotification(message, type);
    return;
  }

  // Fallback to console
  if (type === "error") {
    console.error(message);
  } else {
    console.log(message);
  }
}
