/**
 * Section Filters
 * Handles filtering functionality for the sections management page
 */

// DOM elements for filters
const specialtyFilterEl = document.getElementById("specialty-filter");
const levelFilterEl = document.getElementById("level-filter");
const capacityFilterEl = document.getElementById("capacity-filter");
const searchInputEl = document.getElementById("search");

/**
 * Initialize filters and attach event listeners
 */
function initializeFilters() {
  if (!allSections || !allSections.length) {
    console.warn("No sections available to initialize filters");
    return;
  }

  // Populate specialty filter with unique specialties
  populateSpecialtyFilter();

  // Add event listeners to filters
  if (specialtyFilterEl) {
    specialtyFilterEl.addEventListener("change", applyFilters);
  }

  if (levelFilterEl) {
    levelFilterEl.addEventListener("change", applyFilters);
  }

  if (capacityFilterEl) {
    capacityFilterEl.addEventListener("change", applyFilters);
  }

  if (searchInputEl) {
    searchInputEl.addEventListener("input", applyFilters);
  }
}

/**
 * Populate specialty filter with unique options from the sections
 */
function populateSpecialtyFilter() {
  if (!specialtyFilterEl || !allSections) return;

  // Clear existing options except 'all'
  while (specialtyFilterEl.options.length > 1) {
    specialtyFilterEl.remove(1);
  }

  // Get unique specialties
  const specialties = [
    ...new Set(
      allSections.map((section) => section.specialty).filter(Boolean) // Remove null/undefined
    ),
  ].sort();

  // Add options
  specialties.forEach((specialty) => {
    const option = document.createElement("option");
    option.value = specialty;
    option.textContent = specialty;
    specialtyFilterEl.appendChild(option);
  });
}

/**
 * Apply filters to the sections list
 */
function applyFilters() {
  filteredSections = [...allSections]; // Start with all sections

  // Apply specialty filter
  if (specialtyFilterEl && specialtyFilterEl.value !== "all") {
    const specialty = specialtyFilterEl.value;
    filteredSections = filteredSections.filter(
      (section) => section.specialty === specialty
    );
  }

  // Apply level filter
  if (levelFilterEl && levelFilterEl.value !== "all") {
    const level = levelFilterEl.value;
    filteredSections = filteredSections.filter(
      (section) => section.level === level
    );
  }

  // Apply capacity filter
  if (capacityFilterEl && capacityFilterEl.value !== "all") {
    const capacityFilter = capacityFilterEl.value;

    filteredSections = filteredSections.filter((section) => {
      const capacity = section.capacity || 0;
      const studentCount = section.studentCount || 0;
      const ratio = capacity > 0 ? studentCount / capacity : 0;

      switch (capacityFilter) {
        case "available":
          return ratio < 0.8; // Less than 80% full
        case "limited":
          return ratio >= 0.8 && ratio < 1; // Between 80% and 100%
        case "full":
          return ratio >= 1; // 100% or more
        default:
          return true;
      }
    });
  }

  // Apply search filter
  if (searchInputEl && searchInputEl.value.trim()) {
    const searchTerm = searchInputEl.value.trim().toLowerCase();

    filteredSections = filteredSections.filter((section) => {
      return (
        (section.name && section.name.toLowerCase().includes(searchTerm)) ||
        (section.code && section.code.toLowerCase().includes(searchTerm)) ||
        (section.specialty &&
          section.specialty.toLowerCase().includes(searchTerm)) ||
        (section.level && section.level.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Reset to first page
  currentPage = 1;

  // Render filtered sections
  renderSections();

  // Update pagination
  updatePagination();
}

/**
 * Update pagination based on filtered sections
 */
function updatePagination() {
  if (!paginationElement) return;

  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);

  // Clear current pagination
  paginationElement.innerHTML = "";

  // Don't show pagination if there's only one page
  if (totalPages <= 1) return;

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.classList.add("pagination-item");
  if (currentPage === 1) {
    prevLi.classList.add("disabled");
  }
  prevLi.innerHTML = "<a>&laquo;</a>";
  prevLi.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderSections();
      updatePagination();
    }
  });
  paginationElement.appendChild(prevLi);

  // Page buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.classList.add("pagination-item");
    if (i === currentPage) {
      pageLi.classList.add("active");
    }
    pageLi.innerHTML = `<a>${i}</a>`;
    pageLi.addEventListener("click", () => {
      currentPage = i;
      renderSections();
      updatePagination();
    });
    paginationElement.appendChild(pageLi);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.classList.add("pagination-item");
  if (currentPage === totalPages) {
    nextLi.classList.add("disabled");
  }
  nextLi.innerHTML = "<a>&raquo;</a>";
  nextLi.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderSections();
      updatePagination();
    }
  });
  paginationElement.appendChild(nextLi);
}

// Initialize filters when sections are loaded
document.addEventListener("sectionsLoaded", function () {
  initializeFilters();
});
