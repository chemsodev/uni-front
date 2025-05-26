/**
 * Shared authentication utilities for enseignant pages
 */
async function verifyEnseignantAuth(redirectOnFailure = true) {
  try {
    // 1. Retrieve token from storage
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      throw new Error("No authentication token found");
    }

    // 2. Verify token and role
    const verificationResponse = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!verificationResponse.ok) {
      throw new Error("Token verification failed");
    }

    const userData = await verificationResponse.json();

    // 3. Validate teacher role
    if (
      userData.adminRole !== "enseignant" &&
      userData.userType !== "enseignant"
    ) {
      throw new Error("Access restricted to teachers");
    }

    // 4. Store user data for easy access
    sessionStorage.setItem("enseignantUserData", JSON.stringify(userData));

    return {
      isAuthenticated: true,
      user: userData,
    };
  } catch (error) {
    console.error("Authentication error:", error);

    // Clear invalid tokens
    sessionStorage.removeItem("enseignant_token");
    localStorage.removeItem("enseignant_token");
    sessionStorage.removeItem("enseignantUserData");
    localStorage.removeItem("enseignantData");

    if (redirectOnFailure) {
      window.location.href = "enseignant-login.html";
    }

    return {
      isAuthenticated: false,
      error: error.message,
    };
  }
}

/**
 * Load teacher's sections using the my-sections endpoint
 */
async function loadTeacherSections() {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      throw new Error("No authentication token found");
    }

    // First check if we already have sections cached
    const cachedSections = sessionStorage.getItem("teacherSections");
    if (cachedSections) {
      try {
        return JSON.parse(cachedSections);
      } catch (e) {
        console.error("Error parsing cached sections:", e);
        // Continue to fetch from API if parsing fails
      }
    }

    const response = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/enseignants/my-sections",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load sections");
    }

    const sections = await response.json();

    // Cache sections for reuse
    sessionStorage.setItem("teacherSections", JSON.stringify(sections));

    return sections;
  } catch (error) {
    console.error("Error loading teacher sections:", error);
    return [];
  }
}

/**
 * Load students for this teacher (from their assigned sections)
 */
async function loadTeacherStudents(page = 1, limit = 10, search = "") {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      throw new Error("No authentication token found");
    }

    let url = `https://unicersityback-production-1fbe.up.railway.app/api/etudiants?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("Failed to load students");
    }

    const students = await response.json();

    return students;
  } catch (error) {
    console.error("Error loading teacher students:", error);
    return [];
  }
}

/**
 * Get section students directly from a section
 * This can be more reliable than filtering from all students
 */
async function loadSectionStudents(sectionId) {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      throw new Error("No authentication token found");
    }

    let url = `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/etudiants`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to load students for section ${sectionId}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error loading students for section ${sectionId}:`, error);
    return [];
  }
}

/**
 * Load schedule documents for a section
 * Note: This function provides fallback data since the real API endpoint
 * currently returns 404 errors
 */
async function fetchSectionSchedule(sectionId) {
  try {
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken || !sectionId) {
      throw new Error("Missing required data");
    }

    // Normally we'd fetch from the API, but since that endpoint has issues,
    // we're returning fallback data directly

    // If you want to try the real API once it's fixed, uncomment this:
    /*
        const response = await fetch(
            `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/schedules`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal: AbortSignal.timeout(5000),
            }
        );

        if (response.ok) {
            return await response.json();
        }
        */

    // Return fallback schedule data
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get section info if available
    const sections = await loadTeacherSections();
    const section = sections.find((s) => s.id === sectionId) || {
      name: "Section",
      specialty: "Informatique",
    };

    return [
      {
        id: "schedule1",
        title: `Emploi du temps - ${section.specialty} Section ${section.name}`,
        description: "Emploi du temps du semestre en cours",
        documentUrl: "#",
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
      {
        id: "schedule2",
        title: `Planning des examens - ${section.specialty} Section ${section.name}`,
        description: "Planning des examens pour la session courante",
        documentUrl: "#",
        createdAt: lastWeek.toISOString(),
        updatedAt: lastWeek.toISOString(),
      },
    ];
  } catch (error) {
    console.error(`Error loading schedule for section ${sectionId}:`, error);
    return [];
  }
}

// For backward compatibility
const loadSectionSchedule = fetchSectionSchedule;

/**
 * Get the current teacher's data from localStorage/sessionStorage
 * Avoids making API calls that might fail
 */
function getCurrentTeacherData() {
  try {
    // First try user data from auth token
    const userDataJson = sessionStorage.getItem("enseignantUserData");
    if (userDataJson) {
      const userData = JSON.parse(userDataJson);

      if (userData && (userData.email || userData.userId)) {
        // Handle complex email usernames with multiple name parts
        let prenom = "",
          nom = "";
        if (userData.email) {
          const emailParts = userData.email.split("@");
          if (emailParts[0]) {
            const nameParts = emailParts[0].split(".");
            // First part becomes the prenom
            prenom = nameParts[0];
            // Remaining parts become the nom (if any)
            nom = nameParts.slice(1).join(" ");

            // If no nom was extracted from email, use domain or fallbacks
            if (!nom) {
              nom = emailParts[1] ? emailParts[1].replace(/\./g, " ") : "";
            }
          }
        }

        return {
          id: userData.userId || userData.id,
          nom:
            userData.nom ||
            userData.lastName ||
            userData.family_name ||
            nom ||
            "",
          prenom:
            userData.prenom ||
            userData.firstName ||
            userData.given_name ||
            prenom ||
            "",
          email: userData.email || "",
          matricule:
            userData.teacherId ||
            userData.id_enseignant ||
            userData.enseignantId ||
            `ENS${userData.userId || "0000"}`,
          departement:
            userData.departement || userData.department || "Informatique",
        };
      }
    }

    // Then try stored teacher data
    const teacherDataJson =
      localStorage.getItem("enseignantData") ||
      sessionStorage.getItem("enseignantData");

    if (teacherDataJson) {
      const teacherData = JSON.parse(teacherDataJson);
      if (teacherData) {
        // Ensure we have all the required fields
        return {
          id: teacherData.id || teacherData.userId || "",
          nom:
            teacherData.nom ||
            teacherData.lastName ||
            teacherData.family_name ||
            "",
          prenom:
            teacherData.prenom ||
            teacherData.firstName ||
            teacherData.given_name ||
            "",
          email: teacherData.email || "",
          matricule:
            teacherData.matricule ||
            teacherData.teacherId ||
            teacherData.id_enseignant ||
            `ENS${teacherData.id || "0000"}`,
          departement:
            teacherData.departement || teacherData.department || "Informatique",
        };
      }
    }

    // Return fallback data if no valid data found
    // We create a minimal teacher data object so UI doesn't break
    return {
      id: "unknown",
      nom: "Enseignant",
      prenom: "Utilisateur",
      email: "",
      matricule: "ENS0000",
      departement: "Informatique",
    };
  } catch (error) {
    console.error("Error getting teacher data:", error);
    return {
      id: "error",
      nom: "Enseignant",
      prenom: "Utilisateur",
      email: "",
      matricule: "ENS0000",
      departement: "Informatique",
    };
  }
}

/**
 * Get the current teacher's ID
 */
function getCurrentTeacherId() {
  const teacherData = getCurrentTeacherData();
  return teacherData ? teacherData.id : null;
}

/**
 * Add a reconnection button when backend is unavailable
 */
function addReconnectionButton(containerSelector = ".main-content") {
  const offlineNotice = document.querySelector(".alert.alert-warning");

  if (!offlineNotice) {
    const offlineNotice = document.createElement("div");
    offlineNotice.className = "alert alert-warning";
    offlineNotice.style.padding = "10px";
    offlineNotice.style.margin = "10px 0";
    offlineNotice.style.backgroundColor = "#fff3cd";
    offlineNotice.style.color = "#856404";
    offlineNotice.style.borderRadius = "4px";
    offlineNotice.innerHTML =
      "<strong>Mode hors ligne:</strong> Le serveur est actuellement indisponible. Certaines fonctionnalités sont limitées.";

    const reconnectBtn = document.createElement("button");
    reconnectBtn.textContent = "Réessayer la connexion";
    reconnectBtn.style.marginLeft = "10px";
    reconnectBtn.style.padding = "5px 10px";
    reconnectBtn.style.backgroundColor = "#007bff";
    reconnectBtn.style.color = "#fff";
    reconnectBtn.style.border = "none";
    reconnectBtn.style.borderRadius = "4px";
    reconnectBtn.style.cursor = "pointer";
    reconnectBtn.onclick = function () {
      window.location.reload();
    };

    offlineNotice.appendChild(reconnectBtn);
    document.querySelector(containerSelector).prepend(offlineNotice);
  }
}

/**
 * Logout function for enseignant pages
 */
function logout() {
  sessionStorage.removeItem("enseignantData");
  sessionStorage.removeItem("enseignant_token");
  sessionStorage.removeItem("enseignantUserData");
  sessionStorage.removeItem("teacherSections");
  localStorage.removeItem("enseignantData");
  localStorage.removeItem("enseignant_token");
  window.location.href = "enseignant-login.html";
}

/**
 * Robust authentication checker - Will try to keep the session alive even if the backend is down
 * Returns authentication data without automatically redirecting on failure
 */
async function verifyEnseignantAuthRobust() {
  try {
    // 1. First check if we have a token
    const authToken =
      sessionStorage.getItem("enseignant_token") ||
      localStorage.getItem("enseignant_token");

    if (!authToken) {
      return {
        isAuthenticated: false,
        error: "No authentication token found",
        shouldRedirect: true,
      };
    }

    // 2. Check if we already have cached user data
    const cachedUserData = sessionStorage.getItem("enseignantUserData");
    if (cachedUserData) {
      try {
        const userData = JSON.parse(cachedUserData);
        if (
          userData &&
          (userData.adminRole === "enseignant" ||
            userData.userType === "enseignant")
        ) {
          console.log("Using cached authentication data");

          // Try to verify in the background but don't wait for it
          setTimeout(() => {
            fetch(
              "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(5000),
              }
            )
              .then((res) => res.json())
              .then((freshData) => {
                // Update cached data if verification succeeds
                sessionStorage.setItem(
                  "enseignantUserData",
                  JSON.stringify(freshData)
                );
                console.log("Background token verification successful");
              })
              .catch((err) => {
                console.warn("Background token verification failed:", err);
              });
          }, 100);

          return {
            isAuthenticated: true,
            user: userData,
            fromCache: true,
          };
        }
      } catch (e) {
        console.warn("Error parsing cached user data:", e);
        // Continue to verification
      }
    }

    // 3. If no valid cached data, try to verify with the server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const verificationResponse = await fetch(
        "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!verificationResponse.ok) {
        throw new Error("Token verification failed");
      }

      const userData = await verificationResponse.json();

      // Validate teacher role
      if (
        userData.adminRole !== "enseignant" &&
        userData.userType !== "enseignant"
      ) {
        throw new Error("Access restricted to teachers");
      }

      // Store user data for future use
      sessionStorage.setItem("enseignantUserData", JSON.stringify(userData));

      return {
        isAuthenticated: true,
        user: userData,
      };
    } catch (fetchError) {
      console.warn("Verification request failed:", fetchError);

      // If the error is due to network/server issues rather than an invalid token
      if (
        fetchError.name === "AbortError" ||
        fetchError.message.includes("Failed to fetch")
      ) {
        // Try to recover using stored teacher data as a last resort
        const teacherDataJson =
          localStorage.getItem("enseignantData") ||
          sessionStorage.getItem("enseignantData");

        if (teacherDataJson) {
          try {
            const teacherData = JSON.parse(teacherDataJson);
            if (teacherData && teacherData.id) {
              console.warn(
                "Server unavailable, using stored teacher data as fallback"
              );
              return {
                isAuthenticated: true,
                user: teacherData,
                fromCache: true,
                backendDown: true,
              };
            }
          } catch (e) {
            console.error("Failed to parse stored teacher data:", e);
          }
        }
      }

      // At this point we couldn't verify and don't have valid cached data
      return {
        isAuthenticated: false,
        error: fetchError.message,
        shouldRedirect:
          fetchError.name !== "AbortError" &&
          !fetchError.message.includes("Failed to fetch"),
      };
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      isAuthenticated: false,
      error: error.message,
      shouldRedirect: true,
    };
  }
}
