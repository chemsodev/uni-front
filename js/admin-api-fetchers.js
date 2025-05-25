/**
 * Admin API Fetchers
 * Bridge functions to connect admin pages with the API utilities
 * These functions are called directly from the HTML files
 */

// Import dependencies (these are already loaded in the HTML)
// const API_BASE_URL is defined in admin-auth.js
// The apiCall function is defined in admin-auth.js

/**
 * Fetch section change requests from the API
 * @param {Object} filters - Optional filters to apply to the request
 * @returns {Promise<Array>} - Promise resolving to an array of section change requests
 */
async function fetchSectionChangeRequests(filters = {}) {
  try {
    console.log("Fetching section change requests with filters:", filters);

    // Prepare the endpoint
    const endpoint = "change-requests";
    const queryParams = new URLSearchParams();

    // Add filters to query parameters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(url);

    if (response && response.success && response.data) {
      console.log(
        "Successfully fetched section change requests:",
        response.data
      );
      return {
        requests: Array.isArray(response.data) ? response.data : [],
        success: true,
      };
    }

    console.warn("No data received from section change requests API");
    return { requests: [], success: false };
  } catch (error) {
    console.error("Error in fetchSectionChangeRequests:", error);
    return { requests: [], success: false, error: error.message };
  }
}

/**
 * Fetch teachers data from the API
 * @param {Object} filters - Optional filters to apply to the request
 * @returns {Promise<Array>} - Promise resolving to an array of teacher data
 */
async function fetchTeachersAPI(filters = {}) {
  try {
    console.log("Fetching teachers with filters:", filters);

    // Prepare the endpoint - use enseignants which is the correct endpoint in the API
    const endpoint = "enseignants";
    const queryParams = new URLSearchParams();

    // Add filters to query parameters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(url);

    if (response && response.success && response.data) {
      console.log("Successfully fetched teachers:", response.data);
      return {
        teachers: Array.isArray(response.data) ? response.data : [],
        success: true,
      };
    }

    console.warn("No data received from teachers API");
    return { teachers: [], success: false };
  } catch (error) {
    console.error("Error in fetchTeachersAPI:", error);
    return { teachers: [], success: false, error: error.message };
  }
}

/**
 * Fetch sections data from the API
 * @param {Object} filters - Optional filters to apply to the request
 * @returns {Promise<Array>} - Promise resolving to an array of section data
 */
async function fetchSectionsAPI(filters = {}) {
  try {
    console.log("Fetching sections with filters:", filters);

    // Prepare the endpoint
    const endpoint = "sections";
    const queryParams = new URLSearchParams();

    // Add filters to query parameters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(url);

    if (response && response.success && response.data) {
      console.log("Successfully fetched sections:", response.data);
      return { sections: response.data, success: true };
    }

    // Mock data
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Using mock data for sections");
      return {
        sections: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          name: `Section ${String.fromCharCode(65 + i)}`,
          code: `SEC${i + 1}`,
          level: ["L1", "L2", "L3", "M1", "M2"][Math.floor(Math.random() * 5)],
          capacity: Math.floor(Math.random() * 30) + 20,
          currentStudents: Math.floor(Math.random() * 25) + 10,
          speciality: ["Mathematics", "Computer Science", "Physics"][
            Math.floor(Math.random() * 3)
          ],
        })),
        success: true,
      };
    }

    return { sections: [], success: false };
  } catch (error) {
    console.error("Error in fetchSectionsAPI:", error);
    return { sections: [], success: false, error: error.message };
  }
}

/**
 * Fetch students data from the API
 * @param {Object} filters - Optional filters to apply to the request
 * @returns {Promise<Array>} - Promise resolving to an array of student data
 */
async function fetchStudentsAPI(filters = {}) {
  try {
    console.log("Fetching students with filters:", filters);

    // Prepare the endpoint - use etudiants which is the correct endpoint in the API
    const endpoint = "etudiants";
    const queryParams = new URLSearchParams();

    // Add filters to query parameters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(url);

    if (response && response.success && response.data) {
      console.log("Successfully fetched students:", response.data);
      return {
        students: Array.isArray(response.data) ? response.data : [],
        success: true,
      };
    }

    // Mock data
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Using mock data for students");
      return {
        students: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          firstName: `Student${i + 1}`,
          lastName: `LastName${i + 1}`,
          matricule: `2023${i.toString().padStart(4, "0")}`,
          email: `student${i + 1}@university.edu`,
          section: `Section ${String.fromCharCode(65 + (i % 8))}`,
          level: ["L1", "L2", "L3", "M1", "M2"][Math.floor(Math.random() * 5)],
          active: Math.random() > 0.1, // 90% active
        })),
        success: true,
      };
    }

    return { students: [], success: false };
  } catch (error) {
    console.error("Error in fetchStudentsAPI:", error);
    return { students: [], success: false, error: error.message };
  }
}

/**
 * Fetch profile modification requests from the API
 * @param {Object} filters - Optional filters to apply to the request
 * @returns {Promise<Array>} - Promise resolving to an array of profile modification requests
 */
async function fetchProfileRequestsAPI(filters = {}) {
  try {
    console.log("Fetching profile requests with filters:", filters);

    // Prepare the endpoint
    const endpoint = "profile-requests";
    const queryParams = new URLSearchParams();

    // Add filters to query parameters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(url);

    if (response && response.success && response.data) {
      console.log("Successfully fetched profile requests:", response.data);
      return {
        requests: Array.isArray(response.data) ? response.data : [],
        success: true,
      };
    }

    // Mock data
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Using mock data for profile requests");
      return {
        requests: Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          userId: i + 100,
          userName: `User ${i + 1}`,
          userEmail: `user${i + 1}@university.edu`,
          userType: ["student", "teacher", "admin"][
            Math.floor(Math.random() * 3)
          ],
          requestType: ["name", "email", "password", "photo"][
            Math.floor(Math.random() * 4)
          ],
          oldValue: `Old Value ${i + 1}`,
          newValue: `New Value ${i + 1}`,
          status: ["pending", "approved", "rejected"][
            Math.floor(Math.random() * 3)
          ],
          date: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          reason: `Reason for profile modification ${i + 1}`,
        })),
        success: true,
      };
    }

    return { requests: [], success: false };
  } catch (error) {
    console.error("Error in fetchProfileRequestsAPI:", error);
    return { requests: [], success: false, error: error.message };
  }
}

/**
 * Fetch statistics for the dashboard from the API
 * @returns {Promise<Object>} - Promise resolving to an object containing statistics data
 */
async function fetchDashboardStats() {
  try {
    console.log("Fetching dashboard stats");

    // Use the correct endpoint based on the API structure
    const endpoint = "administrateurs/dashboard/stats";

    // Use the apiCall function from admin-auth.js
    const response = await apiCall(endpoint);

    if (response && response.success && response.data) {
      console.log("Successfully fetched dashboard stats:", response.data);
      return {
        stats: response.data,
        success: true,
      };
    }

    // Mock data
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.warn("Using mock data for dashboard stats");
      return {
        stats: {
          totalStudents: 2530,
          totalTeachers: 156,
          totalSections: 32,
          pendingSectionRequests: 18,
          pendingProfileRequests: 24,
          recentActivities: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            type: ["login", "section_change", "profile_update", "grade_entry"][
              Math.floor(Math.random() * 4)
            ],
            user: `User ${i + 1}`,
            description: `Activity description ${i + 1}`,
            timestamp: new Date(
              Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })),
        },
        success: true,
      };
    }

    return { stats: {}, success: false };
  } catch (error) {
    console.error("Error in fetchDashboardStats:", error);
    return { stats: {}, success: false, error: error.message };
  }
}

/**
 * Create a new teacher (enseignant)
 * @param {Object} teacherData - { firstName, lastName, email, password }
 * @returns {Promise<Object>} - { success, data, message }
 */
async function createTeacherAPI(teacherData) {
  try {
    const response = await apiCall("enseignants", "POST", teacherData);
    if (response && response.success) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        message: response.error || "Erreur lors de l'ajout.",
      };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update an existing teacher (enseignant)
 * @param {string|number} teacherId
 * @param {Object} teacherData - { firstName, lastName, email, password? }
 * @returns {Promise<Object>} - { success, data, message }
 */
async function updateTeacherAPI(teacherId, teacherData) {
  try {
    const response = await apiCall(
      `enseignants/${teacherId}`,
      "PUT",
      teacherData
    );
    if (response && response.success) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        message: response.error || "Erreur lors de la mise à jour.",
      };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Delete a teacher (enseignant)
 * @param {string|number} teacherId
 * @returns {Promise<Object>} - { success, message }
 */
async function deleteTeacherAPI(teacherId) {
  try {
    const response = await apiCall(`enseignants/${teacherId}`, "DELETE");
    if (response && response.success) {
      return { success: true };
    } else {
      return {
        success: false,
        message: response.error || "Erreur lors de la suppression.",
      };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
