/**
 * Common sidebar loader for enseignant pages
 * This script ensures consistent loading of the teacher sidebar across all pages
 */

/**
 * Load the teacher sidebar and properly populate it with user data
 * @param {string} containerId - The ID of the container element to load the sidebar into
 * @returns {Promise<void>}
 */
function loadTeacherSidebar(containerId = "navbar-container") {
  // 1. Load the sidebar HTML
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Sidebar container with ID "${containerId}" not found`);
    return;
  }

  // Fetch the sidebar HTML
  fetch("enseignant-nav.html")
    .then((response) => response.text())
    .then((html) => {
      container.innerHTML = html;

      // 2. Make sure enseignant-auth.js is loaded
      if (typeof getCurrentTeacherData !== "function") {
        console.warn("getCurrentTeacherData function not found");
        // Can't use await in a non-async function
        loadScript("js/enseignant-auth.js");
      }

      // 3. Update the user info in the sidebar
      try {
        const user = getCurrentTeacherData();
        if (user) {
          updateSidebarUserInfo(user);
        }
      } catch (e) {
        console.error("Error getting teacher data:", e);
      }

      // 4. Mark the active link
      setActiveSidebarLink();
    })
    .catch((error) => {
      console.error("Error loading teacher sidebar:", error);
    });
}

/**
 * Update the user information in the sidebar
 * @param {Object} user - The teacher user data
 */
function updateSidebarUserInfo(user) {
  if (!user) return;

  try {
    // Get elements from the sidebar
    const nameElement = document.getElementById("userFullName");
    const idElement = document.getElementById("userId");
    const avatarElement = document.getElementById("userAvatar");
    const deptElement = document.getElementById("userDepartment");

    // Update elements if they exist
    if (nameElement) {
      // Get enseignantData from local or session storage
      let enseignantData = JSON.parse(
        localStorage.getItem("enseignantData") ||
          sessionStorage.getItem("enseignantData") ||
          "{}"
      );
      let fullName;

      // Extract name from email: get part before @, replace dots with spaces
      if (enseignantData && enseignantData.email) {
        const emailPart = enseignantData.email.split("@")[0];
        fullName = emailPart.replace(/\./g, " ");
      } else {
        fullName = `${user.prenom || ""} ${user.nom || ""}`.trim();
      }

      nameElement.textContent = fullName || "Enseignant";
    }

    if (idElement) {
      idElement.textContent = user.matricule || "N/A";
    }

    if (avatarElement) {
      const initials = `${(user.prenom || " ").charAt(0)}${(
        user.nom || " "
      ).charAt(0)}`.toUpperCase();
      avatarElement.textContent = initials || "EN";
    }

    if (deptElement) {
      deptElement.textContent = user.departement || "Informatique";
    }
  } catch (error) {
    console.error("Error updating sidebar user info:", error);
  }
}

/**
 * Mark the active link in the sidebar based on current page
 */
function setActiveSidebarLink() {
  const currentPage = window.location.pathname.split("/").pop();

  try {
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.classList.remove("active");

      const href = link.getAttribute("href");
      if (
        href === currentPage ||
        (currentPage === "" && href === "dashbord-teacher.html")
      ) {
        link.classList.add("active");
      }
    });
  } catch (error) {
    console.error("Error setting active sidebar link:", error);
  }
}

/**
 * Dynamically load a script
 * @param {string} src - The script source path
 * @returns {Promise<void>} - Resolves when script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

// Sidebar Loader - Loads the correct sidebar based on user role
function loadSidebar() {
  // Get role from storage
  const role =
    localStorage.getItem("admin_role") || sessionStorage.getItem("admin_role");

  console.log("Loading sidebar for role:", role);

  // Map roles to sidebar files
  const sidebarFiles = {
    doyen: "admin-sidebar-doyen.html",
    "vice-doyen": "admin-sidebar-vice-doyen.html",
    "chef-de-departement": "admin-sidebar-chef-departement.html",
    "chef-de-specialite": "admin-sidebar-chef-specialite.html",
    secretaire: "admin-sidebar-secretaire.html",
  };

  // Get the sidebar file for the role
  const sidebarFile = sidebarFiles[role] || sidebarFiles["doyen"]; // Default to doyen

  console.log("Loading sidebar file:", sidebarFile);

  // Create iframe to load the sidebar
  const iframe = document.createElement("iframe");
  iframe.src = sidebarFile;
  iframe.style.border = "none";
  iframe.style.width = "260px";
  iframe.style.height = "100vh";
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.zIndex = "1000";
  iframe.id = "sidebar-iframe";

  // Remove any existing sidebar
  const existingSidebar = document.getElementById("sidebar-iframe");
  if (existingSidebar) {
    existingSidebar.remove();
  }

  // Add the iframe to the page
  document.body.appendChild(iframe);

  console.log("Sidebar loaded successfully");
}

// Export loadSidebar for admin pages to use
window.loadSidebar = loadSidebar;
