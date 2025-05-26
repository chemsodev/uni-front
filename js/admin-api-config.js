// Admin API Configuration
const API_CONFIG = {
  BASE_URL: "https://unicersityback-production-1fbe.up.railway.app/api", // Update this with your actual backend URL
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/administrateur/login",
      LOGOUT: "/auth/logout",
      REFRESH: "/auth/refresh",
      VERIFY: "/auth/verify",
    },
    ADMIN: {
      BASE: "/administrateurs",
      DASHBOARD: "/administrateurs/dashboard",
      PROFILE: "/administrateurs/profile",
      STATS: "/administrateurs/dashboard/stats",
      HIERARCHY: {
        SUBORDINATES: "/administrateurs/hierarchy/subordinates",
        ACCESS: "/administrateurs/hierarchy-access",
        STRUCTURE: "/admin-hierarchy/structure",
        MANAGEABLE_ROLES: "/admin-hierarchy/manageable-roles",
        DASHBOARD_DATA: "/admin-hierarchy/dashboard-data",
        ROLE_PERMISSIONS: (role) => `/admin-hierarchy/role-permissions/${role}`,
        DELEGATE_TASK: "/admin-hierarchy/delegate-task",
      },
    },
    DEPARTMENTS: {
      BASE: "/departments",
      BY_ID: (id) => `/departments/${id}`,
      SECTIONS: (id) => `/departments/${id}/sections`,
      ADD_SECTION: (deptId, sectionId) =>
        `/departments/${deptId}/sections/${sectionId}`,
      REMOVE_SECTION: (deptId, sectionId) =>
        `/departments/${deptId}/sections/${sectionId}`,
    },
    SECTIONS: {
      BASE: "/sections",
      BY_ID: (id) => `/sections/${id}`,
      STUDENTS: (id) => `/sections/${id}/etudiants`,
      GROUPS: (id) => `/sections/${id}/groupes`,
      RESPONSABLES: {
        BASE: (id) => `/sections/${id}/responsables`,
        BULK: (id) => `/sections/${id}/responsables/bulk`,
        BY_ID: (sectionId, responsableId) =>
          `/sections/${sectionId}/responsables/${responsableId}`,
      },
      STATISTICS: {
        BASE: "/sections/statistics",
        ANALYTICS: "/sections/statistics/analytics",
        GROWTH: (sectionId) => `/sections/statistics/${sectionId}/growth`,
      },
      SCHEDULES: {
        UPLOAD: (sectionId) => `/sections/schedules/${sectionId}/upload`,
        GET: (sectionId) => `/sections/schedules/${sectionId}`,
        LATEST: (sectionId) => `/sections/schedules/${sectionId}/latest`,
        DOCUMENT: (sectionId, scheduleId) =>
          `/sections/schedules/${sectionId}/document/${scheduleId}`,
        DOWNLOAD: (sectionId, scheduleId) =>
          `/sections/schedules/${sectionId}/download/${scheduleId}`,
        DELETE: (sectionId, scheduleId) =>
          `/sections/schedules/${sectionId}/${scheduleId}`,
        STATS: (sectionId) => `/sections/schedules/${sectionId}/stats`,
      },
    },
    TEACHERS: {
      BASE: "/enseignants",
      BY_ID: (id) => `/enseignants/${id}`,
      GROUP_CHANGE_REQUESTS: {
        BASE: "/enseignants/group-change-requests",
        BY_ID: (requestId) => `/enseignants/group-change-requests/${requestId}`,
        DOCUMENT: (requestId) =>
          `/enseignants/group-change-requests/${requestId}/document`,
      },
      MY_SECTIONS: "/enseignants/my-sections",
      STUDENTS: (teacherId, sectionId) =>
        `/enseignants/${teacherId}/sections/${sectionId}/students`,
      SECTIONS_RESPONSABLE: (id) => `/enseignants/${id}/sections-responsable`,
      TEACHER_STUDENTS: (id) => `/enseignants/${id}/students`,
      SCHEDULES: (id) => `/enseignants/${id}/schedules`,
    },
    STUDENTS: {
      BASE: "/etudiants",
      BY_ID: (id) => `/etudiants/${id}`,
      TIMETABLE: {
        BASE: "/etudiants/timetable",
        BY_ID: (id) => `/etudiants/${id}/schedule`,
      },
      NOTIFICATIONS: (id) => `/etudiants/${id}/notifications`,
      DELEGATE: {
        SET_SECTION: (id, sectionId) =>
          `/etudiants/${id}/set-section-delegate/${sectionId}`,
        SET_GROUP: (id, groupId) =>
          `/etudiants/${id}/set-group-delegate/${groupId}`,
        REMOVE_SECTION: (id) => `/etudiants/${id}/remove-section-delegate`,
        REMOVE_GROUP: (id) => `/etudiants/${id}/remove-group-delegate`,
      },
      DISABILITY: {
        BASE: "/etudiants/with-disability",
        BY_ID: (id) => "/etudiants/with-disability/${id}",
      },
    },
    REQUESTS: {
      PROFILE: {
        BASE: "/profile-requests",
        BY_ID: (id) => `/profile-requests/${id}`,
        MY_REQUESTS: "/profile-requests/my-requests",
        PENDING: "/profile-requests/pending",
        STUDENT: (id) => `/profile-requests/student/${id}`,
        CANCEL: (id) => `/profile-requests/${id}/cancel`,
      },
      CHANGE: {
        BASE: "/change-requests",
        BY_ID: (id) => `/change-requests/${id}`,
        SECTION: {
          BASE: "/change-requests/section",
          WITH_DOCUMENT: "/change-requests/section-with-document",
        },
        GROUP: "/change-requests/group",
        MY_REQUESTS: "/change-requests/my-requests",
        STATUS: (id) => `/change-requests/${id}/status`,
        CANCEL: (id) => `/change-requests/${id}/cancel`,
        DOCUMENT: (id) => `/change-requests/${id}/document`,
      },
    },
    NOTIFICATIONS: {
      BASE: "/notifications",
      ADMIN: "/admin/notifications",
      UNREAD_COUNT: "/notifications/unread-count",
      FROM_TEACHER: (teacherId) => `/notifications/from-teacher/${teacherId}`,
      BY_ID: (id) => `/notifications/${id}`,
      MARK_READ: (id) => `/notifications/${id}/mark-read`,
      MARK_ALL_READ: "/notifications/mark-all-read",
      DELETE: (id) => `/notifications/${id}`,
      DELETE_ALL_READ: "/notifications/read/all",
    },
  },
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// API Call Helper Function
async function apiCall(endpoint, method = "GET", data = null) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_CONFIG.BASE_URL}${endpoint}`;
  const token =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");

  const headers = {
    ...API_CONFIG.HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const options = {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {}),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        window.location.href = "/admin-login.html";
        throw new Error("Unauthorized access");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Export the configuration and helper function
window.API_CONFIG = API_CONFIG;
window.apiCall = apiCall;
