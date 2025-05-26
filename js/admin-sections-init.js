/**
 * Admin Sections Initialization
 * This script initializes the sections page and handles loading data
 */

// Document ready
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await verifyAdminToken();
    await loadSidebar();
    await fetchSections();
    setupEventListeners();
  } catch (error) {
    console.error("Error initializing sections page:", error);
    showMessage("Erreur lors du chargement de la page", "error");
  }
});

/**
 * Fetch sections from the API and initialize the page
 */
async function fetchSections() {
  try {
    showMessage("Chargement des sections...", "info");

    // Get filter values if they exist
    const specialty =
      specialtyFilter && specialtyFilter.value !== "all"
        ? specialtyFilter.value
        : null;
    const level =
      levelFilter && levelFilter.value !== "all" ? levelFilter.value : null;

    // Check if we have access to the section API from admin-sections.js
    if (
      window.sectionAPI &&
      typeof window.sectionAPI.getSections === "function"
    ) {
      console.log("Using sectionAPI.getSections to fetch sections");
      try {
        allSections = await window.sectionAPI.getSections();
      } catch (apiError) {
        console.error("Error using sectionAPI:", apiError);
        throw apiError;
      }
    } else {
      // Fallback to direct API call
      console.log("Using direct API call to fetch sections");
      const response = await apiCall("sections");

      if (response && response.success && Array.isArray(response.data)) {
        allSections = response.data;
      } else {
        throw new Error("Format de réponse invalide");
      }
    }

    console.log(`Loaded ${allSections.length} sections`);

    // Apply filters and render
    filteredSections = [...allSections];
    renderSections();
    updatePagination();

    // Dispatch event that sections are loaded (for filters to initialize)
    document.dispatchEvent(new Event("sectionsLoaded"));

    showMessage(
      `${allSections.length} sections chargées avec succès`,
      "success"
    );
  } catch (error) {
    console.error("Error fetching sections:", error);
    showMessage(
      `Erreur lors du chargement des sections: ${error.message}`,
      "error"
    );

    // If in development environment, load mock data
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Loading mock sections data");
      allSections = getMockSections();
      filteredSections = [...allSections];
      renderSections();
      updatePagination();
      document.dispatchEvent(new Event("sectionsLoaded"));
    }
  }
}

/**
 * Setup event listeners for the page
 */
function setupEventListeners() {
  // Setup section form submission
  if (sectionForm) {
    sectionForm.addEventListener("submit", handleFormSubmit);
  }

  // Setup modal close buttons
  const closeButtons = document.querySelectorAll(".close-modal");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  });

  // Setup cancel buttons
  const cancelButtons = document.querySelectorAll(".btn-cancel");
  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) modal.style.display = "none";
    });
  });
}

/**
 * Initialize the section management functionality
 * This is called when the document is loaded
 */
function initializeSectionManagement() {
  // Initialize table sorting
  const tableHeaders = document.querySelectorAll(".data-table th[data-sort]");
  if (tableHeaders) {
    tableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const sortField = header.getAttribute("data-sort");
        if (sortField) {
          sortSections(sortField);
        }
      });
    });
  }

  // Initialize filters if they exist
  const departmentFilter = document.getElementById("department-filter");
  const levelFilter = document.getElementById("level-filter");
  const specialtyFilter = document.getElementById("specialty-filter");
  const searchFilter = document.getElementById("search-filter");

  if (departmentFilter) {
    departmentFilter.addEventListener("change", applyFilters);
  }

  if (levelFilter) {
    levelFilter.addEventListener("change", applyFilters);
  }

  if (specialtyFilter) {
    specialtyFilter.addEventListener("change", applyFilters);
  }

  if (searchFilter) {
    searchFilter.addEventListener("input", applyFilters);
  }

  // Initialize action buttons
  setupActionButtons();

  console.log("Section management initialized successfully");
}

/**
 * Setup action buttons for the section table
 */
function setupActionButtons() {
  // This will be called when the table is rendered
  // Action buttons are added dynamically when rendering the table
}

/**
 * Apply filters to the sections data
 */
function applyFilters() {
  // Implementation will vary based on your specific requirements
  console.log("Applying filters to sections");

  // Update the table with filtered data
  renderSections();
}

/**
 * Sort sections by the specified field
 * @param {string} field - The field to sort by
 */
function sortSections(field) {
  // Implementation depends on your data structure
  console.log(`Sorting sections by ${field}`);

  // Update the table with sorted data
  renderSections();
}

/**
 * Show status message with formatting
 */
function showMessage(message, type = "info") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = "block";

  // Auto-hide success and info messages after 5 seconds
  if (type === "success" || type === "info") {
    setTimeout(() => {
      statusMessage.style.display = "none";
    }, 5000);
  }
}

/**
 * Generate mock sections for development
 */
function getMockSections() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Section ${i + 1}`,
    code: `SEC-${String(i + 1).padStart(3, "0")}`,
    specialty: ["Informatique", "Mathématiques", "Physique", "Chimie"][i % 4],
    level: ["L1", "L2", "L3", "M1", "M2"][i % 5],
    department: `Department ${Math.floor(i / 4) + 1}`,
    capacity: Math.floor(Math.random() * 50) + 50,
    studentCount: Math.floor(Math.random() * 80),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
