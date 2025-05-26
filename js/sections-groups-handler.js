/**
 * Sections and Groups Handler for Announcements and Delegate Assignment
 *
 * This module provides functionality for:
 * 1. Loading sections and groups from the API
 * 2. Populating selection dropdowns
 * 3. Creating dynamic filtering between sections and groups
 */

/**
 * Initialize sections and groups in announcement forms
 */
function initAnnouncementSectionsAndGroups() {
  // Make sure we load teacher sections and groups if they're not already available
  if (!window.teacherSections || !window.teacherGroups) {
    console.log(
      "Teacher sections and groups not available, loading them now..."
    );
    if (
      window.TeacherAnnouncements &&
      window.TeacherAnnouncements.loadTeacherAssignments
    ) {
      // If we have access to the loadTeacherAssignments function from TeacherAnnouncements
      window.TeacherAnnouncements.loadTeacherAssignments().then(() => {
        // After loading, populate the dropdowns
        populateAnnouncementForms();
      });
    } else {
      // Fallback to just populating with whatever data we have
      console.warn(
        "TeacherAnnouncements.loadTeacherAssignments not available, using current data"
      );
      populateAnnouncementForms();
    }
  } else {
    populateAnnouncementForms();
  }
}

/**
 * Populate announcement forms with sections and groups
 */
function populateAnnouncementForms() {
  // Get all section selects in the announcement forms
  const sectionSelects = document.querySelectorAll('select[id$="-sections"]');

  // Populate sections in each dropdown
  sectionSelects.forEach((select) => {
    populateSectionOptions(select);

    // Add change event to filter groups when section changes
    select.addEventListener("change", function () {
      const formId = this.id.split("-")[0]; // Extract form id (test, room, material, custom)
      const relatedGroupSelect = document.getElementById(`${formId}-groups`);

      if (relatedGroupSelect) {
        updateGroupsForSection(this.value, relatedGroupSelect);
      }
    });
  });

  // Initialize group selects as disabled
  const groupSelects = document.querySelectorAll('select[id$="-groups"]');
  groupSelects.forEach((select) => {
    select.innerHTML =
      "<option value=''>Sélectionnez d'abord une section</option>";
    select.disabled = true;
  });
}

/**
 * Populate section options in a select element
 * @param {HTMLSelectElement} selectElement - The select element to populate
 */
function populateSectionOptions(selectElement) {
  selectElement.innerHTML = "";

  // Check for teacherSections in window
  if (!window.teacherSections || window.teacherSections.length === 0) {
    // Attempt to load sections data if not available
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (authToken) {
      // Add a loading option
      const loadingOption = document.createElement("option");
      loadingOption.value = "";
      loadingOption.textContent = "Chargement des sections...";
      selectElement.appendChild(loadingOption);

      // Load sections and update the dropdown later
      fetch(
        "https://unicersityback-production-1fbe.up.railway.app/api/enseignants/my-sections",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )
        .then((response) => response.json())
        .then((sections) => {
          // Save to global variable
          window.teacherSections = sections;
          // Clear the select element
          selectElement.innerHTML = "";
          // Fill with the new options
          sections.forEach((section) => {
            const option = document.createElement("option");
            option.value = section.id;
            option.textContent = `${section.name || section.code} - ${
              section.specialtyName || "N/A"
            }`;
            selectElement.appendChild(option);
          });
        })
        .catch((error) => {
          console.error("Error loading sections:", error);
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "Erreur lors du chargement des sections";
          selectElement.innerHTML = "";
          selectElement.appendChild(option);
        });
    } else {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Aucune section disponible";
      selectElement.appendChild(option);
    }
    return;
  }

  // If we have sections data, populate the dropdown
  window.teacherSections.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = `${section.name || section.code} - ${
      section.specialtyName || "N/A"
    }`;
    selectElement.appendChild(option);
  });
}

/**
 * Update group options based on selected section
 * @param {string} sectionId - The selected section ID
 * @param {HTMLSelectElement} groupSelect - The group select element to update
 */
function updateGroupsForSection(sectionId, groupSelect) {
  groupSelect.innerHTML = "";

  // If no section selected, disable groups select
  if (!sectionId) {
    groupSelect.innerHTML =
      "<option value=''>Sélectionnez d'abord une section</option>";
    groupSelect.disabled = true;
    return;
  }

  // Enable the group select
  groupSelect.disabled = false;

  // First look for groups in the teacher sections data
  if (window.teacherSections && window.teacherSections.length > 0) {
    // Find the section
    const section = window.teacherSections.find((s) => s.id === sectionId);

    // If we found the section and it has groups
    if (section && section.groupes && section.groupes.length > 0) {
      // Add section ID to each group
      const groupsWithSectionId = section.groupes.map((group) => ({
        ...group,
        sectionId: sectionId,
      }));

      // Store these groups in window.teacherGroups if it doesn't exist
      if (!window.teacherGroups) {
        window.teacherGroups = [];
      }

      // Add these groups to our stored groups if not already there
      groupsWithSectionId.forEach((group) => {
        if (!window.teacherGroups.some((g) => g.id === group.id)) {
          window.teacherGroups.push(group);
        }
      });

      // Update the dropdown with these groups
      updateGroupDropdown(groupsWithSectionId, groupSelect);
      return;
    }
  }

  // If we don't have teacher groups data available or couldn't find groups in sections
  if (!window.teacherGroups || window.teacherGroups.length === 0) {
    // Just show "no groups" message since we should have gotten them from the sections
    groupSelect.innerHTML =
      "<option value=''>Aucun groupe pour cette section</option>";
    return;
  }

  // Filter groups by section from the already loaded groups
  const filteredGroups = window.teacherGroups.filter(
    (group) =>
      group.sectionId === sectionId ||
      (group.section && group.section.id === sectionId)
  );

  updateGroupDropdown(filteredGroups, groupSelect);
}

/**
 * Update a group dropdown with the provided groups
 * @param {Array} groups - The groups to display in the dropdown
 * @param {HTMLSelectElement} groupSelect - The group select element to update
 */
function updateGroupDropdown(groups, groupSelect) {
  groupSelect.innerHTML = "";

  // Check if this is a multiple select
  const isMultiSelect = groupSelect.hasAttribute("multiple");

  // If it's empty or has no groups, show a message
  if (!groups || groups.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun groupe pour cette section";
    groupSelect.appendChild(option);
    return;
  }

  // For multi-select, add a "Select all" option
  if (isMultiSelect) {
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Tous les groupes";
    groupSelect.appendChild(allOption);

    // Add event listener to handle "Select all" option
    if (!groupSelect.dataset.hasSelectAllHandler) {
      groupSelect.addEventListener("change", function (e) {
        const options = Array.from(this.options);
        if (options.length > 0) {
          // Check if "all" option was clicked
          const allOptionSelected =
            options[0].selected && options[0].value === "all";

          if (allOptionSelected) {
            // Select all options except the "all" option itself
            for (let i = 1; i < options.length; i++) {
              options[i].selected = true;
            }
          }
        }
      });
      groupSelect.dataset.hasSelectAllHandler = "true";
    }
  }

  if (groups && groups.length > 0) {
    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = `${group.name} - ${
        group.type === "tp" ? "TP" : "TD"
      }`;
      groupSelect.appendChild(option);
    });
  } else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun groupe pour cette section";
    groupSelect.appendChild(option);
  }
}

/**
 * Initialize delegate assignment dropdowns
 */
function initDelegateAssignmentDropdowns() {
  // Setup delegate type change handling
  const delegateTypeSelect = document.getElementById("delegate-type");
  const groupTypeContainer = document.getElementById("group-type-container");
  const groupTypeSelect = document.getElementById("group-type");
  const assignmentSelect = document.getElementById("assignment");

  if (delegateTypeSelect) {
    delegateTypeSelect.addEventListener("change", function () {
      const delegateType = this.value;

      // Reset and clear
      assignmentSelect.innerHTML = '<option value="">Chargement...</option>';
      assignmentSelect.disabled = true;

      if (!delegateType) {
        groupTypeContainer.style.display = "none";
        assignmentSelect.innerHTML =
          '<option value="">Sélectionnez d\'abord un type</option>';
        return;
      }

      if (delegateType === "section") {
        // Hide group type selection for section delegates
        groupTypeContainer.style.display = "none";

        // Get the student ID to find their sections
        const studentId = document.getElementById("student-id").value;
        loadStudentSections(studentId, assignmentSelect);
      } else if (delegateType === "group") {
        // Show group type selection for group delegates
        groupTypeContainer.style.display = "block";
        groupTypeSelect.value = "";
      }
    });
  }

  // Setup group type change handling
  if (groupTypeSelect) {
    groupTypeSelect.addEventListener("change", function () {
      const groupType = this.value;
      const studentId = document.getElementById("student-id").value;

      if (!groupType) {
        assignmentSelect.innerHTML =
          '<option value="">Sélectionnez le type de groupe</option>';
        assignmentSelect.disabled = true;
        return;
      }

      loadStudentGroups(studentId, groupType, assignmentSelect);
    });
  }
}

/**
 * Load a student's sections into the assignment dropdown
 * @param {string} studentId - The student ID
 * @param {HTMLSelectElement} assignmentSelect - The assignment select element
 */
async function loadStudentSections(studentId, assignmentSelect) {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      console.error("Teacher not authenticated");
      return;
    }

    // Find the student in the current data if available
    const studentsData = window.studentsData || [];
    const student = studentsData.find(
      (s) => s.id.toString() === studentId.toString()
    );

    if (student && student.sections && student.sections.length > 0) {
      // Use the sections we already have
      // For section delegate, we'll use the student's first section directly
      // Since a student belongs to only one section
      const section = student.sections[0];
      assignmentSelect.innerHTML = `<option value="${section.id}">${
        section.name || section.code
      }</option>`;
      assignmentSelect.disabled = false;
    } else {
      // Need to fetch the student data from API to get the section
      const response = await fetch(
        `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const studentData = await response.json();

        if (studentData.sections && studentData.sections.length > 0) {
          // Use the first section (student typically belongs to one section)
          const section = studentData.sections[0];
          assignmentSelect.innerHTML = `<option value="${section.id}">${
            section.name || section.code
          }</option>`;
          assignmentSelect.disabled = false;
        } else {
          assignmentSelect.innerHTML =
            '<option value="">Aucune section disponible</option>';
          assignmentSelect.disabled = true;
        }
      } else {
        assignmentSelect.innerHTML =
          '<option value="">Erreur lors du chargement des données</option>';
        assignmentSelect.disabled = true;
      }
    }
  } catch (error) {
    console.error("Error loading student sections:", error);
    assignmentSelect.innerHTML =
      '<option value="">Erreur lors du chargement des sections</option>';
    assignmentSelect.disabled = true;
  }
}

/**
 * Load a student's groups into the assignment dropdown
 * @param {string} studentId - The student ID
 * @param {string} groupType - The group type (td or tp)
 * @param {HTMLSelectElement} assignmentSelect - The assignment select element
 */
async function loadStudentGroups(studentId, groupType, assignmentSelect) {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      console.error("Teacher not authenticated");
      return;
    }

    // Find the student in the current data if available
    const studentsData = window.studentsData || [];
    const student = studentsData.find(
      (s) => s.id.toString() === studentId.toString()
    );

    if (student) {
      if (groupType === "td" && student.tdGroupe) {
        assignmentSelect.innerHTML = `<option value="${student.tdGroupe.id}">Groupe TD ${student.tdGroupe.name}</option>`;
        assignmentSelect.disabled = false;
      } else if (groupType === "tp" && student.tpGroupe) {
        assignmentSelect.innerHTML = `<option value="${student.tpGroupe.id}">Groupe TP ${student.tpGroupe.name}</option>`;
        assignmentSelect.disabled = false;
      } else {
        assignmentSelect.innerHTML = `<option value="">Aucun groupe ${groupType.toUpperCase()} assigné</option>`;
        assignmentSelect.disabled = true;
      }
    } else {
      // Need to fetch the student data from API
      const response = await fetch(
        `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const studentData = await response.json();

        if (groupType === "td" && studentData.tdGroupe) {
          assignmentSelect.innerHTML = `<option value="${studentData.tdGroupe.id}">Groupe TD ${studentData.tdGroupe.name}</option>`;
          assignmentSelect.disabled = false;
        } else if (groupType === "tp" && studentData.tpGroupe) {
          assignmentSelect.innerHTML = `<option value="${studentData.tpGroupe.id}">Groupe TP ${studentData.tpGroupe.name}</option>`;
          assignmentSelect.disabled = false;
        } else {
          assignmentSelect.innerHTML = `<option value="">Aucun groupe ${groupType.toUpperCase()} assigné</option>`;
          assignmentSelect.disabled = true;
        }
      } else {
        assignmentSelect.innerHTML =
          '<option value="">Erreur lors du chargement des données</option>';
        assignmentSelect.disabled = true;
      }
    }
  } catch (error) {
    console.error("Error loading student groups:", error);
    assignmentSelect.innerHTML =
      '<option value="">Erreur lors du chargement des groupes</option>';
    assignmentSelect.disabled = true;
  }
}

// Export functions for global use
window.SectionsGroupsHandler = {
  initAnnouncementSectionsAndGroups,
  initDelegateAssignmentDropdowns,
  populateSectionOptions,
  updateGroupsForSection,
  updateGroupDropdown, // Export the new function
  loadStudentSections,
  loadStudentGroups,
  populateAnnouncementForms, // Export the new function
};
