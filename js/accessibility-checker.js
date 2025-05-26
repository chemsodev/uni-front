/**
 * Accessibility Checker Module
 *
 * This module helps check for students with disabilities in sections and groups,
 * and provides accessibility features for the university application.
 */

// Global variables
let authToken = null;

/**
 * Initialize the module
 * @returns {Promise<boolean>} True if initialization succeeds
 */
async function initAccessibilityChecker() {
  // Get authentication token
  authToken =
    sessionStorage.getItem("enseignant_token") ||
    localStorage.getItem("enseignant_token");

  if (!authToken) {
    console.error("User not authenticated");
    return false;
  }

  return true;
}

/**
 * Check if there are students with disabilities in the specified sections or groups
 * @param {Array<string>} sectionIds - Array of section IDs to check
 * @param {Array<string>} groupIds - Array of group IDs to check
 * @returns {Promise<{hasDisabledStudents: boolean, count: number, students: Array}>} - Result with disability info
 */
async function checkForStudentsWithDisabilities(
  sectionIds = [],
  groupIds = []
) {
  try {
    // Create a progress indicator
    const progressIndicator = document.createElement("div");
    progressIndicator.className = "accessibility-check";
    progressIndicator.innerText = "Vérification des situations de handicap...";
    document.body.appendChild(progressIndicator);

    // Use the section IDs to fetch students
    let allStudents = [];

    // Get the current authenticated user info to determine if it's a teacher
    let userId = null;
    try {
      const userResponse = await fetch(
        "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.userId || userData.user?.id;
      }
    } catch (err) {
      console.warn("Could not verify user:", err);
    }

    if (!userId) {
      throw new Error("User ID not available");
    }

    // Fetch students from each section
    for (const sectionId of sectionIds) {
      try {
        const response = await fetch(
          `https://unicersityback-production-1fbe.up.railway.app/api/enseignants/${userId}/sections/${sectionId}/students?page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          allStudents = allStudents.concat(data.students || []);
        }
      } catch (err) {
        console.warn(`Error fetching students for section ${sectionId}:`, err);
      }
    }

    // Filter students with disabilities
    const studentsWithDisabilities = allStudents.filter(
      (student) => student.hasDisability || student.disability
    );

    // Filter by groups if needed
    const relevantStudents =
      groupIds.length > 0
        ? studentsWithDisabilities.filter(
            (student) =>
              (student.tdGroupe && groupIds.includes(student.tdGroupe.id)) ||
              (student.tpGroupe && groupIds.includes(student.tpGroupe.id))
          )
        : studentsWithDisabilities;

    // Remove duplicates based on student ID
    const uniqueStudents = [];
    const seenIds = new Set();

    relevantStudents.forEach((student) => {
      if (!seenIds.has(student.id)) {
        seenIds.add(student.id);
        uniqueStudents.push(student);
      }
    });

    // Remove the progress indicator
    document.body.removeChild(progressIndicator);

    return {
      hasDisabledStudents: uniqueStudents.length > 0,
      count: uniqueStudents.length,
      students: uniqueStudents,
    };
  } catch (error) {
    console.error("Error checking for students with disabilities:", error);
    return { hasDisabledStudents: false, count: 0, students: [] };
  }
}

/**
 * Show accessibility options container if needed
 * @param {string} sectionSelectId - ID of the section select element
 * @param {string} groupSelectId - ID of the group select element
 * @param {string} accessibilityContainerId - ID of the container to show/hide
 * @returns {Promise<boolean>} - Whether accessibility options are shown
 */
async function showAccessibilityOptionsIfNeeded(
  sectionSelectId,
  groupSelectId,
  accessibilityContainerId
) {
  try {
    // Get selected sections and groups
    const selectedSectionIds = Array.from(
      document.getElementById(sectionSelectId)?.selectedOptions || []
    ).map((option) => option.value);

    const selectedGroupIds = Array.from(
      document.getElementById(groupSelectId)?.selectedOptions || []
    ).map((option) => option.value);

    // Check if there are students with disabilities
    const disabilityCheck = await checkForStudentsWithDisabilities(
      selectedSectionIds,
      selectedGroupIds
    );

    // Show/hide the container
    const container = document.getElementById(accessibilityContainerId);
    if (container) {
      container.style.display = disabilityCheck.hasDisabledStudents
        ? "block"
        : "none";
    }

    return disabilityCheck.hasDisabledStudents;
  } catch (error) {
    console.error("Error showing accessibility options:", error);
    return false;
  }
}

// Export functions for use in other modules
window.AccessibilityChecker = {
  init: initAccessibilityChecker,
  checkForStudentsWithDisabilities,
  showAccessibilityOptionsIfNeeded,
};
