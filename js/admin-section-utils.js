/**
 * Admin API Utilities for Section Data
 * Provides consistent access to section data across all admin pages
 */

// Create a simplified adapter that will work across all admin pages
(function () {
  // Fallback implementation if admin-sections.js hasn't loaded yet
  if (!window.sectionAPI) {
    const API_URL = "https://unicersityback-production-1fbe.up.railway.app/api";

    // Helper function to get auth token
    function getAuthToken() {
      return (
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token")
      );
    }

    // Basic section statistics functionality
    async function getSectionStatistics(
      departmentId = null,
      level = null,
      specialty = null
    ) {
      try {
        let url = `${API_URL}/sections/statistics`;
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

    // Get section timetable schedules
    async function getSectionSchedules(sectionId, type = null) {
      try {
        let url = `${API_URL}/sections/schedules/${sectionId}`;
        if (type) {
          url += `?type=${type}`;
        }

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
        console.error("Error fetching section schedules:", error);
        throw error;
      }
    }

    // Get schedule statistics for a section
    async function getSectionScheduleStatistics(sectionId) {
      try {
        const url = `${API_URL}/sections/schedules/${sectionId}/stats`;

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
        console.error("Error fetching section schedule statistics:", error);
        throw error;
      }
    }

    // Get detailed information about a specific section
    async function getSectionDetails(sectionId) {
      try {
        const url = `${API_URL}/sections/${sectionId}`;

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
        console.error("Error fetching section details:", error);
        throw error;
      }
    }

    // Expose API to window
    window.sectionAPI = {
      getSectionStatistics,
      getSectionSchedules,
      getSectionScheduleStatistics,
      getSectionDetails,
    };

    console.log("Section API adapter initialized for admin pages");
  }
})();
