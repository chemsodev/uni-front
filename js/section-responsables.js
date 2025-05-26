/**
 * Enhanced section responsables display for admin-gestion-sections.html
 * Displays section responsables with a structured and visually appealing layout
 */

// Function to load and display teachers for a section
async function loadSectionTeachers(sectionId) {
  const teachersContainer = document.getElementById(`teachers-${sectionId}`);
  if (!teachersContainer) return;

  try {
    console.log(`Fetching responsables for section: ${sectionId}`);

    // Use apiCall if available, otherwise fetch directly
    let assignments = []; // Always try to call the API for real data
    try {
      const response =
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

      console.log(`API response for section ${sectionId}:`, response);

      // Make sure response is handled correctly based on different response formats
      if (response) {
        if (Array.isArray(response)) {
          assignments = response;
        } else if (response.data && Array.isArray(response.data)) {
          assignments = response.data;
        } else if (typeof response === "object") {
          assignments = [response];
        }
      }
    } catch (apiError) {
      console.error("API error:", apiError);
      teachersContainer.innerHTML = `<div class="error-teachers">Erreur: ${apiError.message}</div>`;
      return;
    }
    console.log(
      `Processing ${assignments ? assignments.length : 0} assignments`
    );

    if (Array.isArray(assignments) && assignments.length > 0) {
      console.log("Assignments data:", assignments);

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
        console.log("Processing assignment:", assignment);

        if (!assignment.enseignant) {
          console.log("Missing enseignant data in assignment");
          return;
        }

        const role = assignment.role || "other";
        const firstName =
          assignment.enseignant.firstName || assignment.enseignant.prenom || "";
        const lastName =
          assignment.enseignant.lastName || assignment.enseignant.nom || "";
        const teacherName = `${firstName} ${lastName}`.trim();

        if (teacherName) {
          console.log(`Found teacher: ${teacherName} with role: ${role}`);
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
        } else {
          console.log("Missing teacher name in assignment");
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

// Test with example data
window.testSectionResponsables = function (sectionId) {
  const testData = [
    {
      id: "ad296c29-a5c3-41e7-8e5e-3da1356d404d",
      sectionId: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
      enseignantId: 3707,
      role: "section",
      assignedAt: "2025-05-24T16:01:13.846Z",
      section: {
        id: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
        name: "A",
        capacity: null,
        specialty: "ACAD",
        level: "L3",
        code: "ACA-L-A",
      },
      enseignant: {
        id: 3707,
        firstName: "CHEMS",
        lastName: "BOURABIA",
        email: "chemso@gmail.com",
        createdAt: "2025-05-24T14:08:11.872Z",
        updatedAt: "2025-05-24T14:36:44.863Z",
        adminRole: "enseignant",
        matricule: "ens123",
      },
    },
    {
      id: "a5c8aec3-03a5-4f0f-bdd0-cdc4e4774dde",
      sectionId: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
      enseignantId: 3674,
      role: "filiere",
      assignedAt: "2025-05-24T19:17:31.435Z",
      section: {
        id: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
        name: "A",
        capacity: null,
        specialty: "ACAD",
        level: "L3",
        code: "ACA-L-A",
      },
      enseignant: {
        id: 3674,
        firstName: "Youcef",
        lastName: "HADJALI",
        email: "youcef.hadjali@univ.dz",
        createdAt: "2025-05-16T23:47:04.515Z",
        updatedAt: "2025-05-16T23:47:04.515Z",
        adminRole: "enseignant",
        matricule: "ENS008",
      },
    },
  ];

  // Mock the fetch/API call
  const originalFetch = window.fetch;
  window.fetch = function (url) {
    if (url.includes("/responsables")) {
      console.log("Intercepted fetch for responsables, returning test data");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(testData),
      });
    }
    return originalFetch.apply(this, arguments);
  };

  // Run the function with our test data
  const testContainer = document.getElementById(`teachers-${sectionId}`);
  if (!testContainer) {
    console.warn(`No container found for section ${sectionId}`);
    return;
  }

  loadSectionTeachers(sectionId);

  // Restore the original fetch after a delay
  setTimeout(() => {
    window.fetch = originalFetch;
  }, 1000);
};
