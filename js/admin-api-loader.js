/**
 * Admin API Loader
 * This script ensures that all required API utilities are loaded
 * and provides global fallback methods for backward compatibility
 */

// Check if fetchSectionChangeRequests is defined, if not provide it
if (typeof fetchSectionChangeRequests !== "function") {
  window.fetchSectionChangeRequests = async function (filters = {}) {
    console.log("Using automatically loaded fetchSectionChangeRequests");
    try {
      // Try to use the API fetchers if available
      if (
        typeof window.adminAPI !== "undefined" &&
        typeof window.adminAPI.getSectionChangeRequests === "function"
      ) {
        const requests = await window.adminAPI.getSectionChangeRequests(
          filters
        );
        return { requests, success: true };
      }

      // Fall back to our api-fetchers.js implementation
      if (typeof getSectionChangeRequests === "function") {
        const requests = await getSectionChangeRequests(filters);
        return { requests, success: true };
      }

      // Last resort - mocked data
      return {
        requests: getMockSectionRequests(),
        success: true,
      };
    } catch (error) {
      console.error("Error in fetchSectionChangeRequests fallback:", error);
      return {
        requests: getMockSectionRequests(),
        success: false,
        error: error.message,
      };
    }
  };
}

// Check if fetchTeachersAPI is defined, if not provide it
if (typeof fetchTeachersAPI !== "function") {
  window.fetchTeachersAPI = async function (filters = {}) {
    console.log("Using automatically loaded fetchTeachersAPI");
    try {
      // Try to use the API fetchers if available
      if (
        typeof window.adminAPI !== "undefined" &&
        typeof window.adminAPI.getTeachers === "function"
      ) {
        const teachers = await window.adminAPI.getTeachers(filters);
        return { teachers, success: true };
      }

      // Fall back to direct API call
      const endpoint = "teachers";
      const queryParams = new URLSearchParams();

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      }

      const queryString = queryParams.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      // Use apiCall if available
      if (typeof apiCall === "function") {
        const response = await apiCall(url);

        if (response && response.data) {
          return { teachers: response.data, success: true };
        }
      }

      // Last resort - mocked data
      return {
        teachers: getMockTeachers(),
        success: true,
      };
    } catch (error) {
      console.error("Error in fetchTeachersAPI fallback:", error);
      return {
        teachers: getMockTeachers(),
        success: false,
        error: error.message,
      };
    }
  };
}

// Mock data generators for fallback
function getMockSectionRequests() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `req-${i + 1}`,
    student: {
      id: `stu-${i + 1}`,
      name: `Student ${i + 1}`,
      matricule: `20230${i + 1}`,
      email: `student${i + 1}@example.com`,
      avatar: null,
    },
    currentSection: {
      id: `sec-${i + 1}`,
      name: `Section ${String.fromCharCode(65 + i)}`,
    },
    requestedSection: {
      id: `sec-${i + 2}`,
      name: `Section ${String.fromCharCode(66 + i)}`,
    },
    status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)],
    dateSubmitted: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    reason: `Raison de changement de section ${i + 1}`,
  }));
}

function getMockTeachers() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `tea-${i + 1}`,
    firstName: `Prénom${i + 1}`,
    lastName: `Nom${i + 1}`,
    email: `teacher${i + 1}@example.com`,
    specialty: ["Mathématiques", "Informatique", "Physique", "Chimie"][i % 4],
    phone: `+213 56${i}${i}${i}${i}${i}${i}${i}`,
    active: Math.random() > 0.2,
  }));
}

// Announce that the API loader has been initialized
console.log("Admin API Loader initialized - fallback functions are available");
