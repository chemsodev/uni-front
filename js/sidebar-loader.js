/**
 * Common sidebar loader for enseignant pages
 * This script ensures consistent loading of the teacher sidebar across all pages
 */

/**
 * Load the teacher sidebar and properly populate it with user data
 * @param {string} containerId - The ID of the container element to load the sidebar into
 * @returns {Promise<void>}
 */
async function loadTeacherSidebar(containerId = "navbar-container") {
    try {
        // 1. Load the sidebar HTML
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Sidebar container with ID "${containerId}" not found`);
            return;
        }

        // Fetch the sidebar HTML
        const response = await fetch("enseignant-nav.html");
        const html = await response.text();
        container.innerHTML = html;

        // 2. Make sure enseignant-auth.js is loaded
        if (typeof getCurrentTeacherData !== 'function') {
            console.warn("getCurrentTeacherData function not found, loading script");
            await loadScript("js/enseignant-auth.js");
        }

        // 3. Update the user info in the sidebar
        const user = getCurrentTeacherData();
        if (user) {
            updateSidebarUserInfo(user);
        }

        // 4. Mark the active link
        setActiveSidebarLink();

    } catch (error) {
        console.error("Error loading teacher sidebar:", error);
    }
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
            const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim();
            nameElement.textContent = fullName || "Enseignant";
        }

        if (idElement) {
            idElement.textContent = user.matricule || "N/A";
        }

        if (avatarElement) {
            const initials = `${(user.prenom || " ").charAt(0)}${(user.nom || " ").charAt(0)}`.toUpperCase();
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
            if (href === currentPage || 
               (currentPage === "" && href === "dashbord-teacher.html")) {
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
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
} 