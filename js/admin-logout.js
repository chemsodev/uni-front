/**
 * Admin Logout Handler
 * Provides consistent logout functionality across all admin pages
 */

// Function to handle admin logout
async function handleAdminLogout() {
  try {
    // Get the auth token
    const authToken =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (authToken) {
      // Call the logout endpoint if available
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.warn(
          "Logout API call failed, proceeding with local logout:",
          error
        );
      }
    }

    // Clear all admin-related data
    clearAdminAuth();

    // Redirect to index page
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error during logout:", error);
    // Even if there's an error, try to clear local data and redirect
    clearAdminAuth();
    window.location.href = "index.html";
  }
}

// Add event listener for logout button
document.addEventListener("DOMContentLoaded", function () {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleAdminLogout);
  }
});

// Make the function available globally
window.handleAdminLogout = handleAdminLogout;
