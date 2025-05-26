// Admin authentication helper functions
const API_BASE_URL =
  "https://unicersityback-production-1fbe.up.railway.app/api";

// Enable production mode
const DEV_MODE = false; // Permanently disabled

// Mock data functions for development mode
function getMockTeachers() {
  return [
    {
      id: 1,
      firstName: "Ahmed",
      lastName: "Benali",
      email: "ahmed.benali@univ.dz",
      specialty: "Computer Science",
      phone: "+213 555 123 456",
      createdAt: new Date(Date.now() - 7000000000).toISOString(),
    },
    {
      id: 2,
      firstName: "Fatima",
      lastName: "Zahra",
      email: "f.zahra@univ.dz",
      specialty: "Mathematics",
      phone: "+213 555 789 012",
      createdAt: new Date(Date.now() - 6000000000).toISOString(),
    },
    {
      id: 3,
      firstName: "Mohammed",
      lastName: "Larbi",
      email: "m.larbi@univ.dz",
      specialty: "Physics",
      phone: "+213 555 345 678",
      createdAt: new Date(Date.now() - 5000000000).toISOString(),
    },
  ];
}

function getMockStudents() {
  return [
    {
      id: 101,
      firstName: "Karim",
      lastName: "Khaled",
      email: "karim.khaled@student.univ.dz",
      matricule: "20230001",
      section: "Section A",
      speciality: "Computer Science",
      level: "L2",
      createdAt: new Date(Date.now() - 2000000000).toISOString(),
      status: "active",
      phone: "+213 555 123 789",
      address: "123 Rue des Oliviers, Alger",
      dateOfBirth: "2000-05-15",
    },
    {
      id: 102,
      firstName: "Leila",
      lastName: "Ahmed",
      email: "leila.ahmed@student.univ.dz",
      matricule: "20230002",
      section: "Section B",
      speciality: "Mathematics",
      level: "L3",
      createdAt: new Date(Date.now() - 1900000000).toISOString(),
      status: "active",
      phone: "+213 555 456 789",
      address: "45 Avenue de l'Université, Alger",
      dateOfBirth: "2001-03-22",
    },
    {
      id: 103,
      firstName: "Mohammed",
      lastName: "Hakim",
      email: "m.hakim@student.univ.dz",
      matricule: "20230003",
      section: "Section A",
      speciality: "Computer Science",
      level: "L2",
      createdAt: new Date(Date.now() - 1800000000).toISOString(),
      status: "active",
      phone: "+213 555 789 123",
      address: "78 Boulevard des Sciences, Oran",
      dateOfBirth: "2000-11-10",
    },
    {
      id: 104,
      firstName: "Amina",
      lastName: "Benali",
      email: "a.benali@student.univ.dz",
      matricule: "20230004",
      section: "Section C",
      speciality: "Physics",
      level: "L1",
      createdAt: new Date(Date.now() - 1700000000).toISOString(),
      status: "active",
      phone: "+213 555 321 654",
      address: "15 Rue des Sciences, Constantine",
      dateOfBirth: "2002-07-30",
    },
    {
      id: 105,
      firstName: "Youcef",
      lastName: "Mansouri",
      email: "y.mansouri@student.univ.dz",
      matricule: "20230005",
      section: "Section B",
      speciality: "Mathematics",
      level: "L3",
      createdAt: new Date(Date.now() - 1600000000).toISOString(),
      status: "active",
      phone: "+213 555 987 654",
      address: "32 Avenue des Mathématiques, Alger",
      dateOfBirth: "1999-12-05",
    },
  ];
}

function getMockSections() {
  return [
    {
      id: 1,
      name: "Section A",
      specialty: "Computer Science",
      level: "L2",
      studentsCount: 35,
      teacherId: 1,
    },
    {
      id: 2,
      name: "Section B",
      specialty: "Mathematics",
      level: "L3",
      studentsCount: 28,
      teacherId: 2,
    },
    {
      id: 3,
      name: "Section C",
      specialty: "Physics",
      level: "L1",
      studentsCount: 42,
      teacherId: 3,
    },
  ];
}

function getMockChangeRequests() {
  return [
    {
      id: 1,
      studentId: 101,
      student: {
        id: 101,
        firstName: "Karim",
        lastName: "Khaled",
        email: "karim.khaled@student.univ.dz",
      },
      currentSectionId: 1,
      currentSection: "Section A",
      requestedSectionId: 2,
      requestedSection: "Section B",
      reason: "Schedule conflict with part-time job",
      status: "pending",
      createdAt: new Date(Date.now() - 400000000).toISOString(),
    },
    {
      id: 2,
      studentId: 102,
      student: {
        id: 102,
        firstName: "Leila",
        lastName: "Ahmed",
        email: "leila.ahmed@student.univ.dz",
      },
      currentSectionId: 2,
      currentSection: "Section B",
      requestedSectionId: 3,
      requestedSection: "Section C",
      reason: "Moving to a new address closer to campus",
      status: "approved",
      adminComment: "Request approved based on valid reason",
      createdAt: new Date(Date.now() - 500000000).toISOString(),
      updatedAt: new Date(Date.now() - 300000000).toISOString(),
    },
  ];
}

function getMockDashboardStats() {
  return {
    teachersCount: 24,
    studentsCount: 450,
    sectionsCount: 16,
    pendingRequestsCount: 5,
  };
}

function getMockNotifications() {
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
    {
      id: 4,
      type: "SECTION_REQUEST",
      message: "Nouvelle demande approuvée",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      read: true,
    },
    {
      id: 5,
      type: "NEW_USER",
      message: "Nouvel étudiant inscrit",
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      read: false,
    },
  ];
}

// Add missing global mock for section requests (for admin-demandes-section.html fallback)
function getMockSectionRequests() {
  return [
    {
      id: 1,
      student: {
        id: 101,
        firstName: "Mohammed",
        lastName: "Aziz",
        idNumber: "20200532",
        email: "m.aziz@student.edu",
      },
      currentSection: { id: 1, name: "Section A" },
      requestedSection: { id: 2, name: "Section B" },
      justification: "Raisons médicales - difficultés de transport",
      status: "pending",
      createdAt: new Date(Date.now() - 400000000).toISOString(),
      documentUrl: null,
    },
    {
      id: 2,
      student: {
        id: 102,
        firstName: "Fatima",
        lastName: "Benali",
        idNumber: "20190217",
        email: "f.benali@student.edu",
      },
      currentSection: { id: 3, name: "Section C" },
      requestedSection: { id: 4, name: "Section D" },
      justification: "Horaires incompatibles avec situation familiale",
      status: "approved",
      adminResponse: "Demande approuvée suite à la validation des documents",
      createdAt: new Date(Date.now() - 604800000).toISOString(),
      documentUrl: "https://example.com/docs/justification.pdf",
      documentName: "attestation_medicale.pdf",
    },
    {
      id: 3,
      student: {
        id: 103,
        firstName: "Karim",
        lastName: "Mansouri",
        idNumber: "20210189",
        email: "k.mansouri@student.edu",
      },
      currentSection: { id: 2, name: "Section B" },
      requestedSection: { id: 1, name: "Section A" },
      justification: "Changement de domicile",
      status: "rejected",
      adminResponse: "Documents justificatifs insuffisants",
      createdAt: new Date(Date.now() - 1209600000).toISOString(),
      documentUrl: null,
    },
  ];
}
window.getMockSectionRequests = getMockSectionRequests;

// Make all mock data functions available globally
window.getMockTeachers = getMockTeachers;
window.getMockStudents = getMockStudents;
window.getMockSections = getMockSections;
window.getMockChangeRequests = getMockChangeRequests;
window.getMockDashboardStats = getMockDashboardStats;
window.getMockNotifications = getMockNotifications;

// Helper function to get mock data based on endpoint and method
const getMockDataForEndpoint = (ep, method = "GET", body = null) => {
  // Ensure ep is just the path without API_BASE_URL for matching
  const endpointPath = ep.startsWith(API_BASE_URL)
    ? ep.substring(API_BASE_URL.length)
    : ep;
  const cleanEndpointPath = endpointPath.startsWith("/")
    ? endpointPath.substring(1)
    : endpointPath;

  if (cleanEndpointPath.includes("teachers")) return getMockTeachers();
  if (cleanEndpointPath.includes("students")) return getMockStudents();
  if (cleanEndpointPath.includes("sections")) return getMockSections();
  if (cleanEndpointPath.includes("change-requests"))
    return getMockChangeRequests();
  if (cleanEndpointPath.includes("dashboard/stats"))
    return getMockDashboardStats();
  if (cleanEndpointPath.includes("notifications"))
    return getMockNotifications();
  return null;
};

async function apiCall(endpoint, method = "GET", body = null) {
  let normalizedEndpointForMock = endpoint.startsWith(API_BASE_URL)
    ? endpoint.substring(API_BASE_URL.length)
    : endpoint;
  normalizedEndpointForMock = normalizedEndpointForMock.startsWith("/")
    ? normalizedEndpointForMock.substring(1)
    : normalizedEndpointForMock;
  const fetchEndpoint = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}/${normalizedEndpointForMock}`;

  try {
    const authToken =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    // Allow login endpoint to proceed without a token; check for actual login page path if applicable
    if (
      !authToken &&
      !normalizedEndpointForMock.includes("auth/login") &&
      !normalizedEndpointForMock.includes("admin-login.html")
    ) {
      clearAdminAuth();
      redirectToLogin();
      throw new Error(
        "No auth token and not on login page. Redirecting to login."
      );
    }

    const options = {
      method,
      headers: {}, // Initialize headers
    };

    // Set Content-Type for JSON, unless it's FormData
    if (!(body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
    }

    if (authToken) {
      options.headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (body) {
      if (body instanceof FormData) {
        options.body = body; // Let browser set Content-Type for FormData
      } else {
        options.body = JSON.stringify(body);
      }
    }

    console.log(`Calling API: ${method} ${fetchEndpoint}`);
    const response = await fetch(fetchEndpoint, options);

    if (!response.ok) {
      let errorText = "";
      let errorJson = null;
      try {
        const text = await response.text();
        errorText = text;
        if (text && text.trim().startsWith("{")) {
          errorJson = JSON.parse(text);
        }
      } catch (e) {
        /* ignore */
      }
      // Return a consistent error object
      return {
        data: null,
        success: false,
        status: response.status,
        error: errorJson?.message || errorText || response.statusText,
        errorRaw: errorJson || errorText,
      };
    }

    if (response.status === 204) {
      // Handle No Content responses
      return { data: null, success: true };
    }

    // Only parse JSON if there is content
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const responseData = await response.json();
      return {
        data: responseData,
        success: true,
      };
    } else {
      // If not JSON, just return the text
      const text = await response.text();
      return {
        data: text,
        success: true,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `API call error for ${method} ${normalizedEndpointForMock}: ${errorMessage}`
    );
    throw error;
  }
}

// Patch: always export DEV_MODE for use in other scripts
window.DEV_MODE = DEV_MODE;

// Patch: add verifyAdminToken if missing
async function verifyAdminToken() {
  const token =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");
  if (!token) {
    clearAdminAuth();
    redirectToLogin();
    return false;
  }
  // Optionally, validate token with backend or decode JWT
  return true;
}
window.verifyAdminToken = verifyAdminToken;

// Fix: define clearAdminAuth and redirectToLogin globally
function clearAdminAuth() {
  localStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_token");
  localStorage.removeItem("admin_role");
  sessionStorage.removeItem("admin_role");
  localStorage.removeItem("admin_email");
  sessionStorage.removeItem("admin_email");
  localStorage.removeItem("admin_id");
  sessionStorage.removeItem("admin_id");
}
window.clearAdminAuth = clearAdminAuth;

function redirectToLogin() {
  window.location.href = "index.html";
}
window.redirectToLogin = redirectToLogin;

// Verify the admin token and redirect if invalid
// async function verifyAdminToken() { ... } // This line indicates the end of the replacement
