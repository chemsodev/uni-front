/**
 * Admin Section Management
 * Handles admin operations for section management
 */

// Use the API utils for backend communication
// API_CONFIG is defined in admin-api-config.js

/**
 * Get sections with statistics
 * @returns {Promise<Array>} List of sections with student counts and capacity
 */
async function getSections(
  departmentId = null,
  level = null,
  specialty = null
) {
  try {
    let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.BASE}`;
    const params = new URLSearchParams();

    if (departmentId) params.append("departmentId", departmentId);
    if (level) params.append("level", level);
    if (specialty) params.append("specialty", specialty);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const sections = await response.json();

    // Enrich with student counts if they're not already included
    for (const section of sections) {
      if (!section.studentCount && !section.etudiantsCount && section.id) {
        try {
          const studentsResponse = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.STUDENTS(
              section.id
            )}`,
            {
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (studentsResponse.ok) {
            const students = await studentsResponse.json();
            section.etudiantsCount = Array.isArray(students)
              ? students.length
              : 0;
          } else {
            const errorData = await studentsResponse.json().catch(() => ({}));
            console.warn(
              `Could not fetch students for section ${section.id}:`,
              errorData.message
            );
            section.etudiantsCount = 0;
          }
        } catch (error) {
          console.warn(
            `Could not fetch students for section ${section.id}:`,
            error
          );
          section.etudiantsCount = 0;
        }
      } else if (section.studentCount && !section.etudiantsCount) {
        section.etudiantsCount = section.studentCount;
      } else if (!section.etudiantsCount) {
        section.etudiantsCount = 0;
      }
    }

    return sections;
  } catch (error) {
    console.error("Error fetching sections:", error);
    throw error;
  }
}

/**
 * Get departments for dropdown selection
 */
async function getDepartments() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

/**
 * Create a new section
 */
async function createSection(sectionData) {
  try {
    // Validate required fields
    const requiredFields = [
      "name",
      "code",
      "specialty",
      "level",
      "capacity",
      "departmentId",
    ];
    const missingFields = requiredFields.filter((field) => !sectionData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const requestData = {
      ...sectionData,
      departmentId: parseInt(sectionData.departmentId), // Ensure departmentId is a number
    };

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.BASE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
}

/**
 * Update an existing section
 */
async function updateSection(id, sectionData) {
  try {
    // Validate required fields
    const requiredFields = [
      "name",
      "code",
      "specialty",
      "level",
      "capacity",
      "departmentId",
    ];
    const missingFields = requiredFields.filter((field) => !sectionData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const requestData = {
      ...sectionData,
      departmentId: parseInt(sectionData.departmentId), // Ensure departmentId is a number
    };

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.BY_ID(id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating section:", error);
    throw error;
  }
}

/**
 * Delete a section
 */
async function deleteSection(id) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.BY_ID(id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error deleting section:", error);
    throw error;
  }
}

/**
 * Get groups for a section
 */
async function getSectionGroups(sectionId) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.GROUPS(
        sectionId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching groups for section ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Get section responsables (teachers assigned to the section)
 */
async function getSectionResponsables(sectionId) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.RESPONSABLES(
        sectionId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching responsables for section ${sectionId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get sections with detailed statistics
 * @param {string} departmentId - Optional filter by department ID
 * @param {string} level - Optional filter by level (L1, L2, etc.)
 * @param {string} specialty - Optional filter by specialty
 * @returns {Promise<Array>} List of sections with detailed statistics
 */
async function getSectionStatistics(
  departmentId = null,
  level = null,
  specialty = null
) {
  try {
    let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.STATISTICS}`;
    const params = new URLSearchParams();

    if (departmentId) params.append("departmentId", departmentId);
    if (level) params.append("level", level);
    if (specialty) params.append("specialty", specialty);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching section statistics:", error);
    throw error;
  }
}

/**
 * Get section schedule statistics
 * @param {string} sectionId - The section ID to get schedule statistics for
 * @returns {Promise<Object>} Schedule statistics for the section
 */
async function getSectionScheduleStats(sectionId) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SECTIONS.SCHEDULES(
        sectionId
      )}/stats`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching schedule stats for section ${sectionId}:`,
      error
    );
    return {
      totalSchedules: 0,
      examSchedules: 0,
      regularSchedules: 0,
      latestUpload: null,
    };
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

// Export functions through window.sectionAPI
window.sectionAPI = {
  getSections,
  getDepartments,
  createSection,
  updateSection,
  deleteSection,
  getSectionGroups,
  getSectionResponsables,
  getSectionStatistics,
  getSectionScheduleStats,
};
