/**
 * Timetable Management JavaScript
 * Handles uploading and managing timetable documents for sections
 */

// We'll use the apiCall function from admin-auth.js instead of defining the API_BASE_URL here

// Function to initialize the timetable upload functionality
function initializeTimetableUpload() {
  // Add event listeners to timetable upload buttons
  document.addEventListener("click", function (event) {
    // Check for upload timetable button clicks
    if (event.target.closest(".upload-timetable-btn")) {
      const button = event.target.closest(".upload-timetable-btn");
      const sectionId = button.getAttribute("data-id");
      const sectionName = button.getAttribute("data-name");
      const specialty = button.getAttribute("data-specialty");
      const level = button.getAttribute("data-level");

      openTimetableModal(
        {
          id: sectionId,
          name: sectionName,
          specialty: specialty,
          level: level,
        },
        "regular"
      );
    }

    // Check for upload exam button clicks
    if (event.target.closest(".upload-exam-btn")) {
      const button = event.target.closest(".upload-exam-btn");
      const sectionId = button.getAttribute("data-id");
      const sectionName = button.getAttribute("data-name");
      const specialty = button.getAttribute("data-specialty");
      const level = button.getAttribute("data-level");

      openTimetableModal(
        {
          id: sectionId,
          name: sectionName,
          specialty: specialty,
          level: level,
        },
        "exam"
      );
    }

    // Check for view timetables button clicks
    if (event.target.closest(".view-timetables-btn")) {
      const button = event.target.closest(".view-timetables-btn");
      const sectionId = button.getAttribute("data-id");
      const sectionName = button.getAttribute("data-name");

      openTimetableViewer(sectionId, sectionName);
    }
  });

  // Set up timetable modal event listeners
  setupTimetableModalListeners();
}

// Function to open the timetable upload modal
function openTimetableModal(section, type) {
  const timetableModal = document.getElementById("timetable-modal");
  const timetableModalTitle = document.getElementById("timetable-modal-title");
  const timetableSectionIdInput = document.getElementById(
    "timetable-section-id"
  );
  const timetableTypeInput = document.getElementById("timetable-type");
  const timetableTitleInput = document.getElementById("timetable-title");
  const timetableAcademicYearInput = document.getElementById(
    "timetable-academic-year"
  );

  // Set modal title based on type
  if (type === "exam") {
    timetableModalTitle.textContent = `Télécharger l'emploi des examens - Section ${section.name} (${section.level})`;
    timetableTitleInput.value = `Emploi des examens - ${section.specialty} ${section.level} - Section ${section.name}`;
  } else {
    timetableModalTitle.textContent = `Télécharger l'emploi du temps - Section ${section.name} (${section.level})`;
    timetableTitleInput.value = `Emploi du temps - ${section.specialty} ${section.level} - Section ${section.name}`;
  }

  // Reset form and set default values
  document.getElementById("timetable-form").reset();
  timetableSectionIdInput.value = section.id;
  timetableTypeInput.value = type;
  timetableTitleInput.value = timetableTitleInput.value; // Re-apply the title we just set

  // Set academic year to current year
  const currentYear = new Date().getFullYear();
  timetableAcademicYearInput.value = `${currentYear}-${currentYear + 1}`;

  // Clear file selection
  document.getElementById("timetable-file").value = "";
  document.getElementById("selected-file").style.display = "none";

  // Show modal
  timetableModal.style.display = "block";
}

// Function to set up timetable modal event listeners
function setupTimetableModalListeners() {
  const timetableModal = document.getElementById("timetable-modal");
  const timetableForm = document.getElementById("timetable-form");
  const timetableFileInput = document.getElementById("timetable-file");
  const fileUploadContainer = document.getElementById("file-upload-container");
  const selectedFileContainer = document.getElementById("selected-file");
  const selectedFileName = document.getElementById("selected-file-name");
  const selectedFileRemove = document.getElementById("selected-file-remove");

  // Close modal when clicking outside or on close button
  document.addEventListener("click", function (event) {
    if (
      event.target.classList.contains("modal") ||
      event.target.classList.contains("close-modal")
    ) {
      timetableModal.style.display = "none";
    }
  });

  // Handle file selection
  timetableFileInput.addEventListener("change", function () {
    if (timetableFileInput.files.length > 0) {
      const file = timetableFileInput.files[0];
      selectedFileName.textContent = file.name;
      selectedFileContainer.style.display = "flex";
    } else {
      selectedFileContainer.style.display = "none";
    }
  });

  // Handle remove file button
  selectedFileRemove.addEventListener("click", function () {
    timetableFileInput.value = "";
    selectedFileContainer.style.display = "none";
  });

  // Handle file drag and drop
  fileUploadContainer.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadContainer.classList.add("dragover");
  });

  fileUploadContainer.addEventListener("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadContainer.classList.remove("dragover");
  });

  fileUploadContainer.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadContainer.classList.remove("dragover");

    if (e.dataTransfer.files.length > 0) {
      timetableFileInput.files = e.dataTransfer.files;
      const file = e.dataTransfer.files[0];
      selectedFileName.textContent = file.name;
      selectedFileContainer.style.display = "flex";
    }
  });

  // Handle form submission
  timetableForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!timetableFileInput.files.length) {
      showNotification("Veuillez sélectionner un fichier.", "error");
      return;
    }

    const submitButton = timetableForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = "En cours...";

    const formData = new FormData(timetableForm);

    try {
      const sectionId = document.getElementById("timetable-section-id").value;
      const response = await fetch(
        `${API_URL}/sections/schedules/${sectionId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      showNotification(
        "L'emploi du temps a été téléchargé avec succès!",
        "success"
      );
      timetableModal.style.display = "none";

      // Refresh the section list to update timetable status
      if (typeof loadSections === "function") {
        loadSections();
      }
    } catch (error) {
      console.error("Error uploading timetable:", error);
      showNotification(
        "Une erreur s'est produite lors du téléchargement de l'emploi du temps.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = "Télécharger";
    }
  });
}

// Function to open the timetable viewer
async function openTimetableViewer(sectionId, sectionName) {
  // Create or get timetable viewer modal
  let timetableViewerModal = document.getElementById("timetable-viewer-modal");
  if (!timetableViewerModal) {
    // Create the modal if it doesn't exist
    timetableViewerModal = document.createElement("div");
    timetableViewerModal.id = "timetable-viewer-modal";
    timetableViewerModal.className = "modal";
    timetableViewerModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="timetable-viewer-title">Emplois du temps - Section</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="timetable-viewer-tabs">
            <button class="timetable-tab active" data-tab="regular">
              <span class="material-icons">calendar_today</span>
              Emplois du temps
            </button>
            <button class="timetable-tab" data-tab="exam">
              <span class="material-icons">event_note</span>
              Emplois des examens
            </button>
          </div>
          <div class="timetable-content-container" id="timetable-list-container">
            <div class="loading-spinner">Chargement...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(timetableViewerModal);

    // Add event listeners for tabs
    const tabs = timetableViewerModal.querySelectorAll(".timetable-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        tabs.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
        const type = this.getAttribute("data-tab");
        loadTimetablesForSection(sectionId, type);
      });
    });

    // Add event listener to close the modal
    timetableViewerModal
      .querySelector(".close-modal")
      .addEventListener("click", function () {
        timetableViewerModal.style.display = "none";
      });

    // Close when clicking outside modal
    timetableViewerModal.addEventListener("click", function (event) {
      if (event.target === timetableViewerModal) {
        timetableViewerModal.style.display = "none";
      }
    });
  }

  // Update the modal title
  document.getElementById(
    "timetable-viewer-title"
  ).textContent = `Emplois du temps - Section ${sectionName}`;

  // Show the modal
  timetableViewerModal.style.display = "block";

  // Load timetables for the section (default to regular)
  loadTimetablesForSection(sectionId, "regular");
}

// Function to load timetables for a section by type
async function loadTimetablesForSection(sectionId, type) {
  const container = document.getElementById("timetable-list-container");
  container.innerHTML =
    '<div class="loading-spinner">Chargement des emplois du temps...</div>';

  try {
    // Use the section API if available, otherwise fallback to direct API call
    let timetables;
    if (window.sectionAPI && window.sectionAPI.getSectionSchedules) {
      timetables = await window.sectionAPI.getSectionSchedules(sectionId, type);
    } else {
      // Fallback to using apiCall function from admin-auth.js
      timetables = await apiCall(
        `sections/schedules/${sectionId}?type=${type}`
      );
    }

    if (!timetables || timetables.length === 0) {
      container.innerHTML = `
        <div class="no-timetables">
          <div class="empty-state-icon">
            <span class="material-icons">calendar_today</span>
          </div>
          <p>Aucun emploi du temps disponible pour cette section.</p>
        </div>
      `;
      return;
    }

    // Sort timetables by creation date (newest first)
    timetables.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Render timetable list
    let html = `<div class="timetable-list">`;

    timetables.forEach((timetable) => {
      const createdDate = new Date(timetable.createdAt).toLocaleDateString(
        "fr-FR"
      );
      const createdTime = new Date(timetable.createdAt).toLocaleTimeString(
        "fr-FR"
      );

      html += `
        <div class="timetable-item">
          <div class="timetable-info">
            <div class="timetable-title">${
              timetable.title || "Emploi du temps sans titre"
            }</div>
            <div class="timetable-meta">
              <span class="timetable-date">Téléchargé le ${createdDate} à ${createdTime}</span>
              <span class="timetable-academic-year">${
                timetable.academicYear || ""
              }</span>
            </div>
          </div>
          <div class="timetable-actions">
            <button class="btn btn-sm btn-outline view-document-btn" data-url="${
              timetable.documentUrl
            }" title="Voir le document">
              <span class="material-icons">visibility</span>
            </button>
            <button class="btn btn-sm btn-outline download-document-btn" data-url="${
              timetable.documentUrl
            }" title="Télécharger">
              <span class="material-icons">download</span>
            </button>
            <button class="btn btn-sm btn-outline delete-timetable-btn" data-id="${
              timetable.id
            }" data-section-id="${sectionId}" title="Supprimer">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Add event listeners for document actions
    container.querySelectorAll(".view-document-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const url = this.getAttribute("data-url");
        window.open(url, "_blank");
      });
    });

    container.querySelectorAll(".download-document-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const url = this.getAttribute("data-url");
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    });

    container.querySelectorAll(".delete-timetable-btn").forEach((button) => {
      button.addEventListener("click", function () {
        if (confirm("Voulez-vous vraiment supprimer cet emploi du temps ?")) {
          const timetableId = this.getAttribute("data-id");
          const sectionId = this.getAttribute("data-section-id");
          deleteTimetable(sectionId, timetableId);
        }
      });
    });
  } catch (error) {
    console.error("Error loading timetables:", error);
    container.innerHTML = `
      <div class="error-message">
        <span class="material-icons">error</span>
        Une erreur s'est produite lors du chargement des emplois du temps.
      </div>
    `;
  }
}

// Function to delete a timetable
async function deleteTimetable(sectionId, timetableId) {
  try {
    const response = await fetch(
      `${API_URL}/sections/schedules/${sectionId}/${timetableId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Reload the current tab
    const activeTab = document.querySelector(".timetable-tab.active");
    if (activeTab) {
      const type = activeTab.getAttribute("data-tab");
      loadTimetablesForSection(sectionId, type);
    }

    showNotification(
      "L'emploi du temps a été supprimé avec succès.",
      "success"
    );
  } catch (error) {
    console.error("Error deleting timetable:", error);
    showNotification(
      "Une erreur s'est produite lors de la suppression de l'emploi du temps.",
      "error"
    );
  }
}

// Function to get schedule statistics for a section
async function getScheduleStatistics(sectionId) {
  try {
    // Use the section API if available
    if (window.sectionAPI && window.sectionAPI.getSectionScheduleStatistics) {
      return await window.sectionAPI.getSectionScheduleStatistics(sectionId);
    }

    // Fallback to direct API call
    const response = await fetch(
      `${API_URL}/sections/schedules/${sectionId}/stats`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting schedule statistics:", error);
    throw error;
  }
}

// Initialize when the document is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeTimetableUpload();
});
