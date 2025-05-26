/**
 * Admin Dashboard Utility Functions
 * Provides helper functions for the admin dashboard
 */

// Function to fetch dashboard statistics from the backend
async function fetchDashboardStats() {
  try {
    // First try to use the admin dashboard stats endpoint
    const response = await apiCall("administrateurs/dashboard/stats");

    if (response && response.success && response.data) {
      console.log(
        "Successfully fetched dashboard stats from endpoint:",
        response.data
      );
      return {
        stats: response.data,
        success: true,
      };
    }

    // If the endpoint failed or returned no data, calculate stats manually
    console.warn("Dashboard stats endpoint failed, calculating manually...");
    const stats = {};

    // Fetch teachers count
    const teachersResp = await apiCall("enseignants");
    const teachers =
      teachersResp && Array.isArray(teachersResp.data) ? teachersResp.data : [];
    stats.teachersCount = teachers.length;

    // Fetch students count
    let students = [];
    try {
      const studentsResp = await apiCall("etudiants");
      students =
        studentsResp && Array.isArray(studentsResp.data)
          ? studentsResp.data
          : [];
    } catch (e) {
      console.log("Students endpoint not available");
    }
    stats.studentsCount = students.length;

    // Fetch sections count
    const sectionsResp = await apiCall("sections");
    const sections =
      sectionsResp && Array.isArray(sectionsResp.data) ? sectionsResp.data : [];
    stats.sectionsCount = sections.length;

    // Fetch pending requests count
    let requests = [];
    try {
      const requestsResp = await apiCall("change-requests");
      if (requestsResp && requestsResp.data) {
        requests = Array.isArray(requestsResp.data) ? requestsResp.data : [];
      }
    } catch (e) {
      // fallback
      console.log("Change requests endpoint not available:", e);
    }
    stats.pendingRequestsCount =
      Array.isArray(requests) && requests.length > 0
        ? requests.filter((req) => req && req.status === "pending").length
        : 0;

    return {
      stats: stats,
      success: true,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      stats: {
        teachersCount: 0,
        studentsCount: 0,
        sectionsCount: 0,
        pendingRequestsCount: 0,
      },
      success: false,
      error: error.message,
    };
  }
}

// Function to fetch recent activities
async function fetchRecentActivities(limit = 5) {
  try {
    let activities = [];
    try {
      const resp = await apiCall("admin/notifications");
      if (resp && resp.data) {
        activities = Array.isArray(resp.data) ? resp.data : [];
      }
    } catch (e) {
      console.log("Admin notifications endpoint not available:", e);
      try {
        const resp2 = await apiCall("notifications");
        if (resp2 && resp2.data) {
          activities = Array.isArray(resp2.data) ? resp2.data : [];
        }
      } catch (e2) {
        console.log("Notifications endpoint not available:", e2);
        // fallback to mock data if endpoints don't exist yet
        return [
          {
            id: 1,
            type: "SECTION_REQUEST",
            message: "Nouvelle demande de changement de section",
            createdAt: new Date().toISOString(),
            read: false,
          },
          {
            id: 2,
            type: "NEW_USER",
            message: "Nouvel enseignant inscrit",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            read: true,
          },
          {
            id: 3,
            type: "PROFILE_REQUEST",
            message: "Demande de modification de profil",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            read: false,
          },
        ];
      }
    }

    // Make sure activities is an array before calling slice
    return Array.isArray(activities) ? activities.slice(0, limit) : [];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    // Return mock data as fallback
    return [
      {
        id: 1,
        type: "SECTION_REQUEST",
        message: "Nouvelle demande de changement de section",
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];
  }
}

// Make these functions available globally
window.fetchDashboardStats = fetchDashboardStats;
window.fetchRecentActivities = fetchRecentActivities;
