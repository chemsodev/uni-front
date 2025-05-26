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
        <td colspan="6" class="no-data">Aucune section disponible.</td>
      </tr>
    `;
    paginationElement.innerHTML = "";
    return;
  }

  // Show 'no match' if filters result in empty
  if (currentSections.length === 0) {
    sectionsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">Aucune section ne correspond aux critères sélectionnés.</td>
      </tr>
    `;
    paginationElement.innerHTML = "";
    return;
  }

  // Render sections
  currentSections.forEach((section) => {
    // Handle potential different property names from the API
    const sectionName = section.name || "Section sans nom";
    const sectionCode = section.code || "N/A";
    const sectionLevel = section.level || "N/A";
    const sectionSpecialty = section.specialty || "Non spécifiée";

    // Handle student count - since it's not in the API response, we'll show a dash
    const studentCountDisplay = "-";

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
      <td>${sectionSpecialty}</td>      <td>${studentCountDisplay}</td>
      <td id="teachers-${section.id}" class="teachers-info">
        <div class="loading-teachers">Chargement des responsables...</div>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit-btn" data-id="${
            section.id
          }" title="Modifier">
            <span class="material-icons">edit</span>
          </button>
          <button class="action-btn teacher-action-btn" data-id="${
            section.id
          }" title="Assigner responsables">
            <span class="material-icons">person_add</span>
          </button>
          <button class="action-btn timetable-btn" data-id="${
            section.id
          }" title="Gérer l'emploi du temps">
            <span class="material-icons">schedule</span>
          </button>
          <button class="action-btn delete-btn" data-id="${
            section.id
          }" title="Supprimer">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </td>
    `;

    // Add section to table
    sectionsTableBody.appendChild(row);

    // Add event listeners to the buttons
    row
      .querySelector(".edit-btn")
      .addEventListener("click", () => openEditSectionModal(section));
    row
      .querySelector(".teacher-action-btn")
      .addEventListener("click", () => openTeacherAssignmentModal(section));
    row
      .querySelector(".timetable-btn")
      .addEventListener("click", () => openTimetableManagement(section.id));
    row
      .querySelector(".delete-btn")
      .addEventListener("click", () => confirmDeleteSection(section));

    // Load teachers for this section
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
            `http://localhost:3000/api/sections/${sectionId}/responsables`,
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
      // Group assignments by role
      const roleGroups = {
        filiere: [],
        section: [],
        td: [],
        tp: [],
        other: [],
      };

      // Sort assignments into role groups
      assignments.forEach((assignment) => {
        if (!assignment.enseignant) return;

        const role = assignment.role || "other";
        const teacherName = `${assignment.enseignant.firstName || ""} ${
          assignment.enseignant.lastName || ""
        }`.trim();

        if (teacherName) {
          if (roleGroups[role]) {
            roleGroups[role].push({
              name: teacherName,
              id: assignment.enseignant.id,
            });
          } else {
            roleGroups.other.push({
              name: teacherName,
              role: role,
              id: assignment.enseignant.id,
            });
          }
        }
      });

      // Generate role-organized HTML
      let responsablesHTML = `<div class="responsables-organized">`;

      // Add filiere responsables (highest priority)
      if (roleGroups.filiere.length > 0) {
        responsablesHTML += `
          <div class="role-group role-filiere" title="${getRoleDisplayName(
            "filiere"
          )}">
            <div class="role-header">F</div>
            <div class="teacher-assignments">
              <ul>
                ${roleGroups.filiere
                  .map(
                    (teacher) =>
                      `<li><span class="teacher-name" title="${teacher.name}">${teacher.name}</span></li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>`;
      }

      // Add section responsables
      if (roleGroups.section.length > 0) {
        responsablesHTML += `
          <div class="role-group role-section" title="${getRoleDisplayName(
            "section"
          )}">
            <div class="role-header">S</div>
            <div class="teacher-assignments">
              <ul>
                ${roleGroups.section
                  .map(
                    (teacher) =>
                      `<li><span class="teacher-name" title="${teacher.name}">${teacher.name}</span></li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>`;
      }

      // Add TD responsables
      if (roleGroups.td.length > 0) {
        responsablesHTML += `
          <div class="role-group role-td" title="${getRoleDisplayName("td")}">
            <div class="role-header">TD</div>
            <div class="teacher-assignments">
              <ul>
                ${roleGroups.td
                  .map(
                    (teacher) =>
                      `<li><span class="teacher-name" title="${teacher.name}">${teacher.name}</span></li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>`;
      }

      // Add TP responsables
      if (roleGroups.tp.length > 0) {
        responsablesHTML += `
          <div class="role-group role-tp" title="${getRoleDisplayName("tp")}">
            <div class="role-header">TP</div>
            <div class="teacher-assignments">
              <ul>
                ${roleGroups.tp
                  .map(
                    (teacher) =>
                      `<li><span class="teacher-name" title="${teacher.name}">${teacher.name}</span></li>`
                  )
                  .join("")}
              </ul>
            </div>
          </div>`;
      }

      // Add other roles
      if (roleGroups.other.length > 0) {
        roleGroups.other.forEach((teacher) => {
          responsablesHTML += `
            <div class="role-group" title="${getRoleDisplayName(teacher.role)}">
              <div class="role-header">${teacher.role
                .charAt(0)
                .toUpperCase()}</div>
              <div class="teacher-assignments">
                <ul>
                  <li><span class="teacher-name" title="${teacher.name}">${
            teacher.name
          }</span></li>
                </ul>
              </div>
            </div>`;
        });
      }

      responsablesHTML += `</div>`;
      teachersContainer.innerHTML = responsablesHTML;
    } else {
      // No assignments
      teachersContainer.innerHTML = `<div class="no-teachers">Aucun responsable assigné</div>`;
    }
  } catch (error) {
    console.error(`Error loading teachers for section ${sectionId}:`, error);
    teachersContainer.innerHTML = `<div class="error-teachers">Erreur de chargement</div>`;
  }
}

// Helper function to get role icon using Material Icons
function getRoleIcon(role) {
  const roleIcons = {
    filiere: "school",
    section: "assignment",
    td: "groups",
    tp: "science",
    CHEF_DEPARTEMENT: "account_balance",
    RESPONSABLE_SECTION: "assignment",
    RESPONSABLE_MODULE: "menu_book",
    ENSEIGNANT: "person",
  };

  const icon = roleIcons[role] || "person";
  return `<span class="material-icons role-icon">${icon}</span>`;
}

// Helper function to get role display name
function getRoleDisplayName(role) {
  const roleNames = {
    filiere: "Responsable de Filière",
    section: "Responsable de Section",
    td: "Responsable TD",
    tp: "Responsable TP",
    CHEF_DEPARTEMENT: "Chef de Département",
    RESPONSABLE_SECTION: "Responsable de Section",
    RESPONSABLE_MODULE: "Responsable de Module",
    ENSEIGNANT: "Enseignant",
  };
  return roleNames[role] || role;
}
