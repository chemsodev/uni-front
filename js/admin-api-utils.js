/**
 * Admin API Utilities - Enhanced Version
 * Provides helper functions for admin pages to interact with the backend
 * With complete CRUD support for all entities
 */

/**
 * Check if the current user has the given role or higher in the hierarchy
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - True if the user has the required role or higher
 */
function hasRoleOrHigher(requiredRole) {
  // Get the current admin role from storage
  const adminRole =
    sessionStorage.getItem("admin_role") || localStorage.getItem("admin_role");

  if (!adminRole) return false;

  // Define the role hierarchy
  const roleHierarchy = {
    doyen: 5,
    "vice-doyen": 4,
    "chef-de-departement": 3,
    "chef-de-specialite": 2,
    secretaire: 1,
  };

  // Get the user's role level
  const userRoleLevel = roleHierarchy[adminRole] || 0;

  // Get the required role level
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  // Return true if the user's role is equal or higher in the hierarchy
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Get all departments the current user has access to
 * @returns {Promise<Array>} - Array of departments
 */
async function getDepartments() {
  try {
    const response = await apiCall(API_CONFIG.ENDPOINTS.DEPARTMENTS.BASE);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

/**
 * Get all sections in a department
 * @param {string} departmentId - The department ID
 * @returns {Promise<Array>} - Array of sections
 */
async function getSections(departmentId) {
  try {
    const endpoint = departmentId
      ? API_CONFIG.ENDPOINTS.SECTIONS.BY_DEPARTMENT(departmentId)
      : API_CONFIG.ENDPOINTS.SECTIONS.BASE;

    const response = await apiCall(endpoint);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching sections:", error);
    return [];
  }
}

/**
 * Get dashboard statistics for the current admin
 * @returns {Promise<Object>} - Dashboard statistics
 */
async function getDashboardStats() {
  try {
    const response = await apiCall(API_CONFIG.ENDPOINTS.ADMIN.STATS);
    return (
      response.data || {
        teachersCount: 0,
        studentsCount: 0,
        sectionsCount: 0,
        pendingRequestsCount: 0,
      }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      teachersCount: 0,
      studentsCount: 0,
      sectionsCount: 0,
      pendingRequestsCount: 0,
    };
  }
}

/**
 * Get admin notifications
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} - Array of notifications
 */
async function getAdminNotifications(limit = 10) {
  try {
    const response = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATIONS.ADMIN);
    const notifications = response.data || [];
    return limit ? notifications.slice(0, limit) : notifications;
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return [];
  }
}

/**
 * Update student section
 * @param {string} studentId - The student ID
 * @param {string} sectionId - The new section ID
 * @returns {Promise<Object>} - Updated student
 */
async function updateStudentSection(studentId, sectionId) {
  try {
    const response = await apiCall(
      `${API_CONFIG.ENDPOINTS.STUDENTS.BY_ID(studentId)}/section`,
      "PATCH",
      { sectionId }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating student section:", error);
    throw error;
  }
}

/**
 * Update request status (approve or reject)
 * @param {string} requestId - The request ID
 * @param {string} status - The new status ('approved' or 'rejected')
 * @param {string} comment - Admin comment
 * @returns {Promise<Object>} - Updated request
 */
async function updateRequestStatus(requestId, status, comment = "") {
  try {
    const adminId =
      sessionStorage.getItem("admin_id") || localStorage.getItem("admin_id");

    const response = await apiCall(
      API_CONFIG.ENDPOINTS.REQUESTS.PROFILE.UPDATE_STATUS(requestId),
      "PATCH",
      {
        status,
        adminComment: comment,
        processedById: adminId,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
}

/**
 * Get a specific department by ID
 * @param {string} departmentId - The department ID
 * @returns {Promise<Object|null>} - Department data or null
 */
async function getDepartmentById(departmentId) {
  try {
    if (!departmentId) throw new Error("Department ID is required");

    const response = await apiCall(`departments/${departmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching department ${departmentId}:`, error);
    return null;
  }
}

/**
 * Create a new department
 * @param {Object} departmentData - The department data
 * @returns {Promise<Object>} - New department
 */
async function createDepartment(departmentData) {
  try {
    const response = await apiCall("departments", "POST", departmentData);
    return response.data;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

/**
 * Update a department
 * @param {string} departmentId - The department ID
 * @param {Object} departmentData - The updated department data
 * @returns {Promise<Object>} - Updated department
 */
async function updateDepartment(departmentId, departmentData) {
  try {
    const response = await apiCall(
      `departments/${departmentId}`,
      "PUT",
      departmentData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    throw error;
  }
}

/**
 * Delete a department
 * @param {string} departmentId - The department ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteDepartment(departmentId) {
  try {
    await apiCall(`departments/${departmentId}`, "DELETE");
    return true;
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    throw error;
  }
}

/**
 * Get a specific section by ID
 * @param {string} sectionId - The section ID
 * @returns {Promise<Object|null>} - Section data or null
 */
async function getSectionById(sectionId) {
  try {
    if (!sectionId) throw new Error("Section ID is required");

    const response = await apiCall(`sections/${sectionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching section ${sectionId}:`, error);
    return null;
  }
}

/**
 * Create a new section
 * @param {Object} sectionData - The section data
 * @returns {Promise<Object>} - New section
 */
async function createSection(sectionData) {
  try {
    // Convert departmentId to number if it's a string
    if (
      sectionData.departmentId &&
      typeof sectionData.departmentId === "string"
    ) {
      sectionData.departmentId = parseInt(sectionData.departmentId, 10);
    }

    // Ensure capacity is a number
    if (sectionData.capacity && typeof sectionData.capacity === "string") {
      sectionData.capacity = parseInt(sectionData.capacity, 10);
    }

    console.log("Sending section data to server:", JSON.stringify(sectionData));

    const response = await apiCall("sections", "POST", sectionData);
    return response.data || response;
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
}

/**
 * Update a section
 * @param {string} sectionId - The section ID
 * @param {Object} sectionData - The updated section data
 * @returns {Promise<Object>} - Updated section
 */
async function updateSection(sectionId, sectionData) {
  try {
    const response = await apiCall(`sections/${sectionId}`, "PUT", sectionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Delete a section
 * @param {string} sectionId - The section ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteSection(sectionId) {
  try {
    await apiCall(`sections/${sectionId}`, "DELETE");
    return true;
  } catch (error) {
    console.error(`Error deleting section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Get all teachers
 * @param {Object} filters - Optional filters (department, specialty, etc)
 * @returns {Promise<Array>} - Array of teachers
 */
async function getTeachers(filters = {}) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `enseignants?${queryString}` : "enseignants";

    const response = await apiCall(endpoint);

    if (response && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
}

/**
 * Get a specific teacher by ID
 * @param {string} teacherId - The teacher ID
 * @returns {Promise<Object|null>} - Teacher data or null
 */
async function getTeacherById(teacherId) {
  try {
    if (!teacherId) throw new Error("Teacher ID is required");

    const response = await apiCall(`enseignants/${teacherId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching teacher ${teacherId}:`, error);
    return null;
  }
}

/**
 * Create a new teacher
 * @param {Object} teacherData - The teacher data
 * @returns {Promise<Object>} - New teacher
 */
async function createTeacher(teacherData) {
  try {
    // Ensure id_enseignant field is present and properly formatted
    if (!teacherData.id_enseignant) {
      // Generate a default ID if not provided
      const prefix = "PROF";
      const randomDigits = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
      teacherData.id_enseignant = `${prefix}${randomDigits}`;
    }

    // Ensure active status is properly formatted (backend expects boolean)
    if (teacherData.isActive !== undefined) {
      if (typeof teacherData.isActive === "string") {
        teacherData.isActive = teacherData.isActive === "true";
      }
    }

    console.log("Creating teacher with data:", teacherData);
    const response = await apiCall("enseignants", "POST", teacherData);

    if (response && response.success) {
      return response.data;
    } else {
      throw new Error(
        response?.error ||
          (Array.isArray(response?.errorRaw)
            ? response.errorRaw.join(", ")
            : "Erreur lors de l'ajout de l'enseignant.")
      );
    }
  } catch (error) {
    console.error("Error in createTeacher:", error);
    throw error;
  }
}

/**
 * Update a teacher
 * @param {string} teacherId - The teacher ID
 * @param {Object} teacherData - The updated teacher data
 * @returns {Promise<Object>} - Updated teacher
 */
async function updateTeacher(teacherId, teacherData) {
  try {
    // Ensure active status is properly formatted (backend expects boolean)
    if (teacherData.isActive !== undefined) {
      if (typeof teacherData.isActive === "string") {
        teacherData.isActive = teacherData.isActive === "true";
      }
    }

    console.log(`Updating teacher ${teacherId} with data:`, teacherData);
    const response = await apiCall(
      `enseignants/${teacherId}`,
      "PUT",
      teacherData
    );

    if (response && response.success) {
      return response.data;
    } else {
      throw new Error(
        response?.error ||
          (Array.isArray(response?.errorRaw)
            ? response.errorRaw.join(", ")
            : "Erreur lors de la modification de l'enseignant.")
      );
    }
  } catch (error) {
    console.error(`Error in updateTeacher for ID ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Delete a teacher
 * @param {string} teacherId - The teacher ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteTeacher(teacherId) {
  try {
    await apiCall(`enseignants/${teacherId}`, "DELETE");
    return true;
  } catch (error) {
    console.error(`Error deleting teacher ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Get all students (with optional filters)
 * @param {Object} filters - Optional filters (section, specialty, etc)
 * @returns {Promise<Array>} - Array of students
 */
async function getStudents(filters = {}) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `etudiants?${queryString}` : "etudiants";

    const response = await apiCall(endpoint);

    if (response && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

/**
 * Get a specific student by ID
 * @param {string} studentId - The student ID
 * @returns {Promise<Object|null>} - Student data or null
 */
async function getStudentById(studentId) {
  try {
    if (!studentId) throw new Error("Student ID is required");

    const response = await apiCall(`etudiants/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}

/**
 * Get students in a section
 * @param {string} sectionId - The section ID
 * @returns {Promise<Array>} - Array of students
 */
async function getStudentsBySection(sectionId) {
  try {
    if (!sectionId) throw new Error("Section ID is required");

    const response = await apiCall(`sections/${sectionId}/etudiants`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching students for section ${sectionId}:`, error);
    return [];
  }
}

/**
 * Get all profile change requests
 * @param {Object} filters - Optional filters (status, etc)
 * @returns {Promise<Array>} - Array of profile requests
 */
async function getProfileRequests(filters = {}) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `profile-requests?${queryString}`
      : "profile-requests";

    const response = await apiCall(endpoint);

    if (response && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching profile requests:", error);
    return [];
  }
}

/**
 * Get a specific profile request by ID
 * @param {string} requestId - The request ID
 * @returns {Promise<Object|null>} - Request data or null
 */
async function getProfileRequestById(requestId) {
  try {
    if (!requestId) throw new Error("Request ID is required");

    const response = await apiCall(`profile-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching profile request ${requestId}:`, error);
    return null;
  }
}

/**
 * Get all section change requests
 * @param {Object} filters - Optional filters (status, etc)
 * @returns {Promise<Array>} - Array of section change requests
 */
async function getSectionChangeRequests(filters = {}) {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `change-requests?${queryString}`
      : "change-requests";

    const response = await apiCall(endpoint);

    if (response && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching section change requests:", error);
    return [];
  }
}

/**
 * Get a specific section change request by ID
 * @param {string} requestId - The request ID
 * @returns {Promise<Object|null>} - Request data or null
 */
async function getSectionChangeRequestById(requestId) {
  try {
    if (!requestId) throw new Error("Request ID is required");

    const response = await apiCall(`change-requests/${requestId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching section change request ${requestId}:`, error);
    return null;
  }
}

/**
 * Update section change request status
 * @param {string} requestId - The request ID
 * @param {string} status - The new status ('approved' or 'rejected')
 * @param {string} comment - Admin comment
 * @returns {Promise<Object>} - Updated request
 */
async function updateSectionChangeStatus(requestId, status, comment = "") {
  try {
    // Get current admin ID
    const adminId =
      sessionStorage.getItem("admin_id") || localStorage.getItem("admin_id");

    const response = await apiCall(
      `change-requests/${requestId}/status`,
      "PATCH",
      {
        status,
        adminComment: comment,
        processedById: adminId,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating section change status:", error);
    throw error;
  }
}

/**
 * Fetch recent admin activities
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise<Array>} - Array of activity items
 */
async function fetchRecentActivities(limit = 10) {
  try {
    const response = await apiCall("admin/activities");

    if (response && response.data) {
      const activities = Array.isArray(response.data) ? response.data : [];
      return limit ? activities.slice(0, limit) : activities;
    }

    return [];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}

// Export all functions via window.adminAPI global
window.adminAPI = {
  // Role and permissions
  hasRoleOrHigher,

  // Department operations
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  // Section operations
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,

  // Teacher operations
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,

  // Student operations
  getStudents,
  getStudentById,
  getStudentsBySection,
  updateStudentSection,

  // Dashboard operations
  getDashboardStats,
  getAdminNotifications,
  fetchRecentActivities,

  // Profile requests
  getProfileRequests,
  getProfileRequestById,
  updateRequestStatus,

  // Section change requests
  getSectionChangeRequests,
  getSectionChangeRequestById,
  updateSectionChangeStatus,
};
