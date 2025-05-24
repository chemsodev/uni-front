/**
 * Improved renderSections function with robust data handling
 */
function renderSections() {
  // Calculate pagination
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSections.length);
  const currentSections = filteredSections.slice(startIndex, endIndex);

  // Clear table
  sectionsTableBody.innerHTML = "";
  // Show 'no data' if nothing fetched at all
  if (!allSections || allSections.length === 0) {
    sectionsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">Aucune section disponible.</td>
      </tr>
    `;
    paginationElement.innerHTML = "";
    return;
  }

  // Show 'no match' if filters result in empty
  if (currentSections.length === 0) {
    sectionsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">Aucune section ne correspond aux critères sélectionnés.</td>
      </tr>
    `;
    paginationElement.innerHTML = "";
    return;
  }

  console.log("Rendering sections:", currentSections);

  // Render sections
  currentSections.forEach((section) => {
    // Handle potential different property names from the API
    const sectionName = section.name || section.nom || "Section sans nom";
    const sectionCode = section.code || "N/A";
    const sectionLevel = section.level || section.niveau || "N/A";
    const sectionSpecialty =
      section.specialty || section.specialite || "Non spécifiée";

    // Handle capacity and student count with all possible property names
    const capacity = section.capacity || section.capacite || 0;

    const studentsCount =
      section.studentsCount ||
      section.nombreEtudiants ||
      section.etudiantsCount ||
      section.currentStudents ||
      0;

    const capacityPercent = capacity ? (studentsCount / capacity) * 100 : 0;

    let capacityClass = "capacity-normal";
    if (capacityPercent >= 80 && capacityPercent < 100) {
      capacityClass = "capacity-warning";
    } else if (capacityPercent >= 100) {
      capacityClass = "capacity-full";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="section-info">
          <div class="section-icon">${sectionLevel.charAt(0) || "S"}</div>
          <div class="section-details">
            <span class="section-name">${sectionName}</span>
            <span class="section-code">${sectionCode}</span>
          </div>
        </div>
      </td>
      <td><span class="level-badge">${sectionLevel}</span></td>
      <td>${sectionSpecialty}</td>      <td><span class="capacity-badge ${capacityClass}">${studentsCount}/${capacity}</span></td>
      <td>${studentsCount}</td>
      <td>
        <div class="teachers-info" id="teachers-${section.id}">
          <span class="loading-teachers">Chargement...</span>
        </div>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit-btn" data-id="${
            section.id
          }" title="Modifier">✏️</button>
          <button class="action-btn teacher-action-btn" data-id="${
            section.id
          }" title="Assigner enseignants">👨‍🏫</button>
          <button class="action-btn delete-btn" data-id="${
            section.id
          }" title="Supprimer">🗑️</button>
        </div>
      </td>
    `;

    // Add section to table
    sectionsTableBody.appendChild(row); // Add event listeners to the buttons
    row
      .querySelector(".edit-btn")
      .addEventListener("click", () => openEditSectionModal(section));
    row
      .querySelector(".teacher-action-btn")
      .addEventListener("click", () => openTeacherAssignmentModal(section));
    row
      .querySelector(".delete-btn")
      .addEventListener("click", () => confirmDeleteSection(section));
  });

  // Load teacher assignments for each section
  currentSections.forEach((section) => {
    loadSectionTeachers(section.id);
  });

  // Render pagination
  renderPagination(totalPages);
}

// Function to load and display teachers for a section
async function loadSectionTeachers(sectionId) {
  const teachersContainer = document.getElementById(`teachers-${sectionId}`);
  if (!teachersContainer) return;

  try {
    // Use apiCall if available, otherwise fetch directly
    const assignments =
      typeof apiCall !== "undefined"
        ? await apiCall(`sections/${sectionId}/responsables`, "GET")
        : await fetch(
            `https://uni-front-zeta.vercel.app/api/sections/${sectionId}/responsables`,
            {
              headers: {
                Authorization: `Bearer ${
                  localStorage.getItem("admin_token") ||
                  sessionStorage.getItem("admin_token")
                }`,
                "Content-Type": "application/json",
              },
            }
          ).then((res) => res.json());

    if (Array.isArray(assignments) && assignments.length > 0) {
      const teacherNames = assignments
        .map((assignment) => {
          const teacherName = `${assignment.enseignant?.firstName || ""} ${
            assignment.enseignant?.lastName || ""
          }`.trim();
          const role = assignment.role;
          const roleIcon = getRoleIcon(role);
          return `<span class="teacher-assignment" title="${getRoleDisplayName(
            role
          )}">${roleIcon} ${teacherName}</span>`;
        })
        .join("");

      teachersContainer.innerHTML = `<div class="teachers-list">${teacherNames}</div>`;
    } else {
      teachersContainer.innerHTML =
        '<span class="no-teachers">Aucun enseignant</span>';
    }
  } catch (error) {
    console.error(`Error loading teachers for section ${sectionId}:`, error);
    teachersContainer.innerHTML = '<span class="error-teachers">Erreur</span>';
  }
}

// Helper function to get role icon
function getRoleIcon(role) {
  const roleIcons = {
    CHEF_DEPARTEMENT: "👑",
    RESPONSABLE_SECTION: "📋",
    RESPONSABLE_MODULE: "📚",
    ENSEIGNANT: "👨‍🏫",
  };
  return roleIcons[role] || "👤";
}

// Helper function to get role display name
function getRoleDisplayName(role) {
  const roleNames = {
    CHEF_DEPARTEMENT: "Chef de Département",
    RESPONSABLE_SECTION: "Responsable de Section",
    RESPONSABLE_MODULE: "Responsable de Module",
    ENSEIGNANT: "Enseignant",
  };
  return roleNames[role] || role;
}
