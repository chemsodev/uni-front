/**
 * Admin Teachers Management
 * This script provides functionality for managing teachers in the admin panel
 */

// API configuration should be loaded from admin-api-config.js

/**
 * Get all teachers
 * @returns {Promise<Array>} List of teachers
 */
async function getTeachers() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/enseignants`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }
}

/**
 * Get a specific teacher by ID
 * @param {string} id - Teacher ID
 * @returns {Promise<Object>} Teacher data
 */
async function getTeacher(id) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/enseignants/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching teacher ${id}:`, error);
    throw error;
  }
}

/**
 * Get sections assigned to a teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Promise<Array>} List of sections the teacher is responsible for
 */
async function getTeacherSections(teacherId) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/enseignants/${teacherId}/sections-responsable`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching sections for teacher ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Create a new teacher
 * @param {Object} teacherData - Teacher data
 * @returns {Promise<Object>} Created teacher
 */
async function createTeacher(teacherData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/enseignants`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating teacher:", error);
    throw error;
  }
}

/**
 * Update an existing teacher
 * @param {string} id - Teacher ID
 * @param {Object} teacherData - Teacher data to update
 * @returns {Promise<Object>} Updated teacher
 */
async function updateTeacher(id, teacherData) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/enseignants/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating teacher ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a teacher
 * @param {string} id - Teacher ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteTeacher(id) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/enseignants/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting teacher ${id}:`, error);
    throw error;
  }
}

/**
 * Helper function to get the authentication token
 */
function getAuthToken() {
  return (
    localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
  );
}

// Export functions through the API object
window.teacherAPI = {
  getTeachers,
  getTeacher,
  getTeacherSections,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
