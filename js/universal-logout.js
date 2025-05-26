/**
 * Universal Logout Handler
 * Automatically detects user type and handles logout appropriately
 * Works for students, teachers, and admins
 */

// Universal logout function that works for all user types
function universalLogout() {
  // Check what type of user is logged in by checking available tokens
  const studentToken =
    localStorage.getItem("etudiant_token") ||
    sessionStorage.getItem("etudiant_token");
  const teacherToken =
    localStorage.getItem("enseignant_token") ||
    sessionStorage.getItem("enseignant_token");
  const adminToken =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");

  if (studentToken) {
    // Student logout
    localStorage.removeItem("studentData");
    localStorage.removeItem("etudiant_token");
    localStorage.removeItem("offlineRequests");
    localStorage.removeItem("lastLogin");
    localStorage.removeItem("userPreferences");
    localStorage.removeItem("studentRequests");
    sessionStorage.clear();
    window.location.href = "index.html";
  } else if (teacherToken) {
    // Teacher logout
    sessionStorage.removeItem("enseignantData");
    sessionStorage.removeItem("enseignant_token");
    sessionStorage.removeItem("enseignantUserData");
    sessionStorage.removeItem("teacherSections");
    localStorage.removeItem("enseignantData");
    localStorage.removeItem("enseignant_token");
    window.location.href = "index.html";
  } else if (adminToken) {
    // Admin logout
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_role");
    localStorage.removeItem("admin_email");
    sessionStorage.removeItem("admin_email");
    localStorage.removeItem("admin_id");
    sessionStorage.removeItem("admin_id");
    window.location.href = "index.html";
  } else {
    // Fallback - clear everything and redirect
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  }
}

// Make the function globally available
window.universalLogout = universalLogout;

// Also provide the function as 'logout' for backward compatibility
window.logout = universalLogout;

// Add event listener for logout buttons
document.addEventListener("DOMContentLoaded", function () {
  // Handle any logout button with class 'logout-btn'
  const logoutButtons = document.querySelectorAll(".logout-btn, #logout-btn");
  logoutButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      universalLogout();
      return false;
    });
  });

  // Handle logout links with data-logout attribute
  const logoutLinks = document.querySelectorAll("[data-logout]");
  logoutLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      universalLogout();
      return false;
    });
  });
});
