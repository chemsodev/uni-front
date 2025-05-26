// Teacher Announcements Module
// This module handles the creation and management of announcements from teachers to students

// Global variables
let currentTeacher = null;
let teacherAuthToken = null;
let teacherSections = [];
let teacherGroups = [];

// Create a namespace for the module
window.TeacherAnnouncements = {};

// Announcement types
const ANNOUNCEMENT_TYPES = {
  COURS: "cours",
  EXAMEN: "examen",
  EMPLOI_DU_TEMPS: "emploi_du_temps",
  ROOM_CHANGE: "cours", // Using cours type for room changes
  TEST: "examen", // Using examen type for tests/quizzes
};

/**
 * Initialize the module
 */
async function initAnnouncementModule() {
  // Get authentication token
  teacherAuthToken =
    sessionStorage.getItem("enseignant_token") ||
    localStorage.getItem("enseignant_token");

  if (!teacherAuthToken) {
    console.error("Teacher not authenticated");
    return false;
  }

  // Make sure we export currentTeacher to window
  window.currentTeacher = currentTeacher;
  // Get teacher data
  const teacherDataJson =
    localStorage.getItem("enseignantData") ||
    sessionStorage.getItem("enseignantData");
  if (teacherDataJson) {
    try {
      currentTeacher = JSON.parse(teacherDataJson);
    } catch (e) {
      console.error("Error parsing teacher data", e);
      return false;
    }
  } else {
    console.error("No teacher data found");
    // Try to get teacher data from API if not found in storage
    try {
      // Use the helper function if available
      if (typeof getCurrentTeacherData === "function") {
        currentTeacher = getCurrentTeacherData();
        if (
          currentTeacher &&
          currentTeacher.id !== "unknown" &&
          currentTeacher.id !== "error"
        ) {
          // Save it for future use
          const storage = localStorage.getItem("enseignant_token")
            ? localStorage
            : sessionStorage;
          storage.setItem("enseignantData", JSON.stringify(currentTeacher));
          console.log("Teacher data retrieved from helper function");
          // Continue with initialization if we got valid data
          return (
            currentTeacher.id !== "unknown" && currentTeacher.id !== "error"
          );
        }
      }
      return false;
    } catch (e) {
      console.error("Failed to retrieve teacher data:", e);
      return false;
    }
  }

  // Load sections and groups assigned to this teacher
  await loadTeacherAssignments();

  // Check if there are any students with disabilities and show/hide banner accordingly
  await checkForDisabledStudentsAndUpdateUI();

  return true;
}

// Export the init function to be called from the HTML
window.TeacherAnnouncements.init = initAnnouncementModule;
window.TeacherAnnouncements.loadTeacherAssignments = loadTeacherAssignments;

/**
 * Check if there are any students with disabilities and update UI accordingly
 */
async function checkForDisabledStudentsAndUpdateUI() {
  try {
    // Only continue if we have sections
    if (!teacherSections || teacherSections.length === 0) {
      return;
    }

    // Get section IDs and group IDs
    const sectionIds = teacherSections.map((section) => section.id);
    const groupIds = teacherGroups.map((group) => group.id);

    // Check for students with disabilities
    const disabilityCheck = await checkForStudentsWithDisabilities(
      sectionIds,
      groupIds
    );

    // Show or hide the accessibility banner based on the result
    const accessibilityBanner = document.getElementById("accessibility-banner");
    if (accessibilityBanner) {
      if (disabilityCheck.hasDisabledStudents) {
        accessibilityBanner.style.display = "flex";

        // Update the banner content with count
        const bannerContent = accessibilityBanner.querySelector(
          ".accessibility-banner-content p"
        );
        if (bannerContent) {
          bannerContent.innerHTML = `${
            disabilityCheck.count
          } étudiant(s) en situation de handicap ${
            disabilityCheck.count > 1 ? "sont présents" : "est présent"
          } dans vos sections.
            Veuillez vous assurer que vos annonces sont accessibles à tous.
            <a href="students-with-disabilities.html" class="btn-link">Voir la liste des étudiants concernés</a>`;
        }
      } else {
        accessibilityBanner.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error checking for students with disabilities:", error);
  }
}

/**
 * Load sections and groups assigned to the current teacher
 */
async function loadTeacherAssignments() {
  try {
    // Fetch teacher's assigned sections
    const sectionsResponse = await fetch(
      "http://localhost:3000/api/enseignants/my-sections",
      {
        headers: {
          Authorization: `Bearer ${teacherAuthToken}`,
        },
      }
    );

    if (sectionsResponse.ok) {
      teacherSections = await sectionsResponse.json();
      console.log("Loaded teacher sections:", teacherSections);

      // Make sure teacherSections is available globally
      window.teacherSections = teacherSections;

      // Extract groups directly from the sections response
      teacherGroups = [];

      // Process each section to extract its groups
      for (const section of teacherSections) {
        if (section.groupes && Array.isArray(section.groupes)) {
          // Add sectionId to each group for easier filtering later
          const groupsWithSectionId = section.groupes.map((group) => ({
            ...group,
            sectionId: section.id,
          }));
          teacherGroups = teacherGroups.concat(groupsWithSectionId);
        }
      }

      // Remove duplicates by ID
      const uniqueGroups = [];
      const seenIds = new Set();
      teacherGroups.forEach((group) => {
        if (!seenIds.has(group.id)) {
          seenIds.add(group.id);
          uniqueGroups.push(group);
        }
      });

      teacherGroups = uniqueGroups;

      // Make sure teacherGroups is available globally
      window.teacherGroups = teacherGroups;

      console.log("Extracted teacher groups from sections:", teacherGroups);
    } else {
      console.error(
        "Failed to load teacher sections:",
        sectionsResponse.status
      );
    }

    // Return both sections and groups for convenience
    return { sections: teacherSections, groups: teacherGroups };
  } catch (error) {
    console.error("Error loading teacher assignments:", error);
    return { sections: [], groups: [] };
  }
}

/**
 * Check if there are students with disabilities in the specified sections or groups
 * @param {Array<number>} sectionIds - Array of section IDs to check
 * @param {Array<number>} groupIds - Array of group IDs to check
 * @returns {Promise<{hasDisabledStudents: boolean, count: number}>} - Result with disability info
 */
async function checkForStudentsWithDisabilities(sectionIds, groupIds) {
  try {
    // Create a progress indicator
    const progressIndicator = document.createElement("div");
    progressIndicator.className = "accessibility-check";
    progressIndicator.innerText = "Vérification des situations de handicap...";
    document.body.appendChild(progressIndicator);

    if (!currentTeacher || !currentTeacher.id) {
      throw new Error("Teacher ID not available");
    }

    // Use the section IDs to fetch students
    let allStudents = [];

    // Fetch students from each section
    for (const sectionId of sectionIds) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/enseignants/${currentTeacher.id}/sections/${sectionId}/students?page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${teacherAuthToken}`,
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
 * Create an announcement for students
 * @param {Object} announcement - The announcement data
 * @param {string} announcement.title - Title of the announcement
 * @param {string} announcement.content - Content of the announcement
 * @param {string} announcement.type - Type of announcement (cours, examen, emploi_du_temps)
 * @param {Array<number>} announcement.targetSectionIds - Array of section IDs to receive the announcement
 * @param {Array<number>} [announcement.targetGroupIds] - Optional array of group IDs to receive the announcement
 * @param {string} [announcement.actionLink] - Optional link for action button
 * @param {string} [announcement.actionLabel] - Optional label for action button
 */
async function createAnnouncement(announcement) {
  if (!teacherAuthToken || !currentTeacher) {
    console.error("Teacher not authenticated");
    return null;
  }

  try {
    // Check for students with disabilities
    const targetSectionIds = announcement.targetSectionIds || [];
    const targetGroupIds = announcement.targetGroupIds || [];

    // First check if there are students with disabilities in the target groups/sections
    const disabilityCheck = await checkForStudentsWithDisabilities(
      targetSectionIds,
      targetGroupIds
    );

    // If there are students with disabilities, show an accessibility warning
    if (disabilityCheck.hasDisabledStudents) {
      const confirmAccessibility = window.confirm(
        `⚠️ IMPORTANT: ${
          disabilityCheck.count
        } étudiant(s) en situation de handicap ${
          disabilityCheck.count > 1 ? "sont concernés" : "est concerné"
        } par cette annonce.\n\n` +
          `Assurez-vous que:\n` +
          `- Les salles sont accessibles aux personnes à mobilité réduite\n` +
          `- Les informations sont claires et visibles\n` +
          `- Un délai suffisant est prévu avant l'événement\n\n` +
          `Voulez-vous continuer avec l'envoi de l'annonce?`
      );

      if (!confirmAccessibility) {
        return { cancelled: true, message: "Annonce annulée" };
      }

      // Add accessibility note to the announcement content
      announcement.content +=
        "\n\nNote aux étudiants en situation de handicap: Si vous avez besoin d'aménagements spécifiques, veuillez contacter l'enseignant.";
    }

    // Create notifications for each target section or group
    const notificationsPromises = []; // Get students from target sections
    if (targetSectionIds.length > 0) {
      for (const sectionId of targetSectionIds) {
        try {
          const studentsResponse = await fetch(
            `http://localhost:3000/api/enseignants/${currentTeacher.id}/sections/${sectionId}/students`,
            {
              headers: {
                Authorization: `Bearer ${teacherAuthToken}`,
              },
            }
          );

          if (studentsResponse.ok) {
            const students = await studentsResponse.json();

            // Create a notification for each student in the section
            for (const student of students) {
              notificationsPromises.push(
                createStudentNotification({
                  ...announcement,
                  userId: student.id,
                  createdBy: currentTeacher.id,
                })
              );
            }
          }
        } catch (error) {
          console.error(
            `Error fetching students for section ${sectionId}:`,
            error
          );
        }
      }
    }

    // Get students from target groups without making the problematic API call
    if (targetGroupIds.length > 0) {
      for (const groupId of targetGroupIds) {
        try {
          // First, get the selected section that contains this group
          const selectedSection = teacherSections.find(
            (section) =>
              section.groupes &&
              section.groupes.some((group) => group.id === groupId)
          );

          if (selectedSection) {
            // Create a "section-wide" notification but mark it with the group ID
            notificationsPromises.push(
              fetch("http://localhost:3000/api/notifications", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${teacherAuthToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  title: announcement.title,
                  content: announcement.content,
                  type: announcement.type,
                  groupId: groupId,
                  sectionId: selectedSection.id,
                  createdBy: currentTeacher.id,
                  actionLink: announcement.actionLink || null,
                  actionLabel: announcement.actionLabel || null,
                }),
              }).then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `Failed to create group notification: ${response.status}`
                  );
                }
                return response.json();
              })
            );
          }
        } catch (error) {
          console.error(
            `Error creating notification for group ${groupId}:`,
            error
          );
        }
      }
    }

    // Wait for all notifications to be created
    const results = await Promise.allSettled(notificationsPromises);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Created ${successful} notifications, ${failed} failed`);

    return {
      successful,
      failed,
      total: successful + failed,
    };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return null;
  }
}

/**
 * Create a notification for a specific student
 */
async function createStudentNotification(notification) {
  try {
    // Get the teacher's name from current teacher data
    const teacherName = currentTeacher
      ? `${currentTeacher.firstName || ""} ${
          currentTeacher.lastName || ""
        }`.trim()
      : "Enseignant";

    const response = await fetch("http://localhost:3000/api/notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${teacherAuthToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: notification.title,
        content: notification.content,
        type: notification.type,
        userId: notification.userId,
        createdBy: notification.createdBy || currentTeacher?.id,
        actionLink: notification.actionLink || null,
        actionLabel: notification.actionLabel || null,
        metadata: {
          senderName: teacherName,
          senderId: currentTeacher?.id,
          importance: notification.importance || "normal",
          groupId: Date.now().toString(), // Group notifications by creation batch
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Helper functions for common announcement types

/**
 * Create a room change announcement
 * @param {Object} data - The room change data
 * @param {string} data.courseName - The name of the course
 * @param {string} data.dateTime - The date and time of the course
 * @param {string} data.oldRoom - The original room
 * @param {string} data.newRoom - The new room
 * @param {Array<number>} data.targetSectionIds - Array of section IDs to notify
 * @param {Array<number>} [data.targetGroupIds] - Optional array of group IDs to notify
 * @param {boolean} [data.isNewRoomAccessible] - Whether the new room is accessible
 */
async function createRoomChangeAnnouncement(data) {
  const title = `Changement de salle - ${data.courseName}`;

  // Check if we need to verify room accessibility
  const disabilityCheck = await checkForStudentsWithDisabilities(
    data.targetSectionIds || [],
    data.targetGroupIds || []
  );

  let content = `Le cours de ${data.courseName} prévu le ${data.dateTime} est déplacé de la salle ${data.oldRoom} à la salle ${data.newRoom}.`;

  // If there are students with disabilities and we know about room accessibility
  if (
    disabilityCheck.hasDisabledStudents &&
    data.isNewRoomAccessible !== undefined
  ) {
    if (data.isNewRoomAccessible) {
      content += `\n\nInformation d'accessibilité: La salle ${data.newRoom} est accessible aux personnes à mobilité réduite.`;
    } else {
      // Show warning about inaccessible room
      const proceed = window.confirm(
        `⚠️ ATTENTION: La salle ${data.newRoom} n'est pas accessible aux personnes à mobilité réduite, mais ${disabilityCheck.count} étudiant(s) en situation de handicap pourraient être concernés.\n\n` +
          `Voulez-vous continuer avec cette annonce ou choisir une autre salle?`
      );

      if (!proceed) {
        return {
          cancelled: true,
          message: "Annonce annulée - Veuillez choisir une salle accessible",
        };
      }

      // Add warning to the announcement
      content += `\n\n⚠️ Information d'accessibilité: La salle ${data.newRoom} n'est PAS accessible aux personnes à mobilité réduite. Les étudiants concernés sont priés de contacter l'enseignant pour des aménagements.`;
    }
  }

  return createAnnouncement({
    title,
    content,
    type: ANNOUNCEMENT_TYPES.ROOM_CHANGE,
    targetSectionIds: data.targetSectionIds,
    targetGroupIds: data.targetGroupIds,
    actionLink: "schedule.html",
    actionLabel: "Voir emploi du temps",
  });
}

/**
 * Create a test announcement
 * @param {Object} data - The test data
 * @param {string} data.courseName - The name of the course
 * @param {string} data.testType - Type of test (e.g., "Interrogation", "Examen", "Quiz")
 * @param {string} data.dateTime - The date and time of the test
 * @param {string} data.room - The room of the test
 * @param {string} [data.details] - Optional details about the test
 * @param {Array<number>} data.targetSectionIds - Array of section IDs to notify
 * @param {Array<number>} [data.targetGroupIds] - Optional array of group IDs to notify
 * @param {boolean} [data.isRoomAccessible] - Whether the room is accessible
 * @param {boolean} [data.allowsExtraTime] - Whether extra time is allowed for students with disabilities
 */
async function createTestAnnouncement(data) {
  const title = `${data.testType} - ${data.courseName}`;
  let content = `Une ${data.testType} de ${data.courseName} aura lieu le ${
    data.dateTime
  } en salle ${data.room}.${data.details ? " " + data.details : ""}`;

  // Check if we need to add accessibility information
  const disabilityCheck = await checkForStudentsWithDisabilities(
    data.targetSectionIds || [],
    data.targetGroupIds || []
  );

  if (disabilityCheck.hasDisabledStudents) {
    // Add extra time information if specified
    if (data.allowsExtraTime) {
      content += `\n\nInformation pour les étudiants en situation de handicap: Un tiers-temps supplémentaire sera accordé sur demande.`;
    }

    // Add room accessibility information if specified
    if (data.isRoomAccessible !== undefined) {
      if (data.isRoomAccessible) {
        content += `\n\nInformation d'accessibilité: La salle ${data.room} est accessible aux personnes à mobilité réduite.`;
      } else {
        // Show warning about inaccessible exam room
        const proceed = window.confirm(
          `⚠️ ATTENTION: La salle ${data.room} n'est pas accessible aux personnes à mobilité réduite, mais ${disabilityCheck.count} étudiant(s) en situation de handicap pourraient être concernés.\n\n` +
            `Voulez-vous continuer avec cette annonce ou choisir une autre salle?`
        );

        if (!proceed) {
          return {
            cancelled: true,
            message: "Annonce annulée - Veuillez choisir une salle accessible",
          };
        }

        // Add warning to the announcement
        content += `\n\n⚠️ Information d'accessibilité: La salle ${data.room} n'est PAS accessible aux personnes à mobilité réduite. Les étudiants concernés sont priés de contacter l'enseignant pour des aménagements.`;
      }
    }

    // Always add contact information
    content += `\n\nLes étudiants en situation de handicap nécessitant des aménagements spécifiques sont priés de contacter l'enseignant au moins 3 jours avant la date prévue.`;
  }

  return createAnnouncement({
    title,
    content,
    type: ANNOUNCEMENT_TYPES.TEST,
    targetSectionIds: data.targetSectionIds,
    targetGroupIds: data.targetGroupIds,
    actionLink: "schedule.html",
    actionLabel: "Voir emploi du temps",
  });
}

/**
 * Create a course material announcement
 * @param {Object} data - The course material data
 * @param {string} data.courseName - The name of the course
 * @param {string} data.materialType - Type of material (e.g., "Polycopié", "Exercices", "Document")
 * @param {string} data.title - Title of the material
 * @param {string} [data.details] - Optional details about the material
 * @param {string} [data.link] - Optional link to the material
 * @param {Array<number>} data.targetSectionIds - Array of section IDs to notify
 * @param {Array<number>} [data.targetGroupIds] - Optional array of group IDs to notify
 */
async function createCourseMaterialAnnouncement(data) {
  const title = `Nouveau ${data.materialType} - ${data.courseName}`;
  const content = `Un nouveau ${data.materialType} intitulé "${
    data.title
  }" a été mis en ligne pour le cours de ${data.courseName}.${
    data.details ? " " + data.details : ""
  }`;

  return createAnnouncement({
    title,
    content,
    type: ANNOUNCEMENT_TYPES.COURS,
    targetSectionIds: data.targetSectionIds,
    targetGroupIds: data.targetGroupIds,
    actionLink: data.link || null,
    actionLabel: data.link ? "Télécharger" : null,
  });
}

/**
 * Load and display announcement history in the table format
 */
async function loadAnnouncementHistory() {
  const historyContainer = document.getElementById("announcement-history");

  if (!historyContainer) {
    console.error("Announcement history container not found");
    return;
  }

  // Show loading message
  historyContainer.innerHTML = `
    <tr>
      <td colspan="4" class="text-center">Chargement des annonces récentes...</td>
    </tr>
  `;

  try {
    // Get authentication token
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      historyContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Erreur d'authentification. Veuillez vous reconnecter.</td>
        </tr>
      `;
      return;
    }

    // Get current teacher ID
    const teacherId = currentTeacher ? currentTeacher.id : null;

    if (!teacherId) {
      historyContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Impossible d'identifier l'enseignant actuel.</td>
        </tr>
      `;
      return;
    }

    // Fetch notifications created by this teacher
    let response;
    try {
      response = await fetch(
        `http://localhost:3000/api/notifications/from-teacher/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        // If the API endpoint doesn't exist yet or returns 404, use fallback
        if (response.status === 404) {
          console.warn(
            "API endpoint not found, falling back to main notifications endpoint"
          );
          response = await fetch(`http://localhost:3000/api/notifications`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Erreur lors de la récupération des notifications (fallback): ${response.status}`
            );
          }
        } else {
          throw new Error(
            `Erreur lors de la récupération des notifications: ${response.status}`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw new Error(
        `Erreur lors de la récupération des notifications: ${error.message}`
      );
    }

    const notifications = await response.json(); // Group notifications by title and content to avoid duplicates
    const groupedNotifications = {};

    // Keep track of unique students per announcement to avoid double counting
    const studentTracker = {};
    notifications.forEach((notification) => {
      // Create a unique key for each distinct announcement
      const key = `${notification.title}-${
        notification.type
      }-${notification.createdAt.substring(0, 10)}`;

      // Create tracker for this announcement if it doesn't exist
      if (!studentTracker[key]) {
        studentTracker[key] = new Set();
      }

      // Add student ID to tracker (if available)
      if (notification.studentId) {
        studentTracker[key].add(notification.studentId);
      } else {
        // If no studentId is available, use the notification ID as a fallback
        // This ensures we at least count unique notifications
        studentTracker[key].add(`notification-${notification.id}`);
      }

      if (!groupedNotifications[key]) {
        groupedNotifications[key] = {
          id: notification.id,
          title: notification.title,
          type: notification.type,
          date: new Date(notification.createdAt).toLocaleDateString("fr-FR"),
          recipients: studentTracker[key].size || 1, // Count unique students
          status: notification.status || "sent",
          createdAt: notification.createdAt, // Keep for sorting
        };
      } else {
        // Update recipient count with unique student count
        groupedNotifications[key].recipients = studentTracker[key].size;
      }
    });

    // Convert to array and sort by date (newest first)
    const announcementHistory = Object.values(groupedNotifications).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Prepare rows HTML
    let tableHTML = "";

    // Add rows
    announcementHistory.forEach((announcement) => {
      const badgeClass = `badge-${announcement.type}`;
      let typeText = "";

      switch (announcement.type) {
        case "cours":
          typeText = "Cours";
          break;
        case "examen":
          typeText = "Examen";
          break;
        case "emploi_du_temps":
          typeText = "EDT";
          break;
        default:
          typeText = "Autre";
      }
      tableHTML += `
        <tr>
          <td>${announcement.date}</td>
          <td><span class="badge ${badgeClass}">${typeText}</span></td>
          <td>${announcement.title}</td>
          <td>${announcement.recipients} étudiant${
        announcement.recipients > 1 ? "s" : ""
      }</td>
        </tr>
      `;
    });

    // Update the container
    if (announcementHistory.length > 0) {
      historyContainer.innerHTML = tableHTML;
    } else {
      historyContainer.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Aucune annonce récente trouvée.</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Error loading announcement history:", error);
    historyContainer.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Erreur lors du chargement des annonces récentes.</td>
      </tr>
    `;
  }
}

// Export functions
window.TeacherAnnouncements = {
  init: initAnnouncementModule,
  createAnnouncement,
  createRoomChangeAnnouncement,
  createTestAnnouncement,
  createCourseMaterialAnnouncement,
  TYPES: ANNOUNCEMENT_TYPES,
};

// Also expose teacher data, sections, and groups to the global scope for the UI to use
window.currentTeacher = currentTeacher;
window.teacherSections = teacherSections;
window.teacherGroups = teacherGroups;

// Export to global scope
window.loadAnnouncementHistory = loadAnnouncementHistory;
