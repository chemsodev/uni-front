/**
 * Global Page Setup Script
 * Ensures all pages have consistent logout functionality and removes unused buttons
 */

(function () {
  "use strict";

  // Auto-load universal logout script
  if (!window.universalLogout && !window.logout) {
    const logoutScript = document.createElement("script");
    logoutScript.src = "js/universal-logout.js";
    logoutScript.async = true;
    document.head.appendChild(logoutScript);
  }

  // List of buttons/links that should be removed if they don't have proper functionality
  const UNUSED_BUTTON_SELECTORS = [
    'a[href="note-evaluation.html"]', // Non-existent page
    'a[href="#"]:not([onclick]):not([data-logout])', // Empty hash links without functionality
    'button[onclick="#"]', // Buttons that just go to hash
  ];

  // Function to remove unused buttons
  function removeUnusedButtons() {
    UNUSED_BUTTON_SELECTORS.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // Don't remove if it's a logout link
        if (
          element.textContent.toLowerCase().includes("déconnexion") ||
          element.textContent.toLowerCase().includes("logout")
        ) {
          return;
        }

        console.log("Removing unused button/link:", element.textContent);
        element.style.display = "none";
      });
    });
  }

  // Function to ensure logout buttons work properly
  function ensureLogoutFunctionality() {
    // Find all logout buttons/links
    const logoutElements = document.querySelectorAll(`
      [onclick*="logout"],
      [href*="logout"],
      .logout-btn,
      #logout-btn,
      [data-logout]
    `);

    logoutElements.forEach((element) => {
      // Make sure they have proper logout functionality
      if (!element.onclick && !element.getAttribute("data-logout")) {
        element.onclick = function (e) {
          e.preventDefault();
          if (window.universalLogout) {
            window.universalLogout();
          } else if (window.logout) {
            window.logout();
          } else {
            // Fallback logout
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "index.html";
          }
          return false;
        };
      }
    });
  }

  // Function to add logout button to pages that don't have navigation
  function addLogoutButtonIfNeeded() {
    // Check if page has navigation containers
    const hasNavigation = document.querySelector(
      "#navbar-container, #sidebar-container, .sidebar, .nav-menu"
    );

    if (!hasNavigation) {
      // This is likely a standalone page - add a logout button
      const existingLogout = document.querySelector(
        '.logout-btn, #logout-btn, [onclick*="logout"]'
      );

      if (!existingLogout) {
        console.log("Adding logout button to standalone page");

        // Try to find a good place to add the logout button
        const header = document.querySelector(".header, .page-header");
        const headerActions = document.querySelector(
          ".header-actions, .header-buttons"
        );

        if (headerActions) {
          const logoutBtn = document.createElement("button");
          logoutBtn.className = "logout-btn";
          logoutBtn.innerHTML =
            '<i class="fas fa-sign-out-alt"></i> Déconnexion';
          logoutBtn.title = "Se déconnecter";
          logoutBtn.onclick = function () {
            if (window.universalLogout) {
              window.universalLogout();
            } else {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "index.html";
            }
          };

          // Add some basic styling
          logoutBtn.style.cssText = `
            background-color: #dc2626;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 5px;
          `;

          headerActions.appendChild(logoutBtn);
        }
      }
    }
  }

  // Run setup when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(() => {
        removeUnusedButtons();
        ensureLogoutFunctionality();
        addLogoutButtonIfNeeded();
      }, 100); // Small delay to let other scripts load
    });
  } else {
    // DOM is already loaded
    setTimeout(() => {
      removeUnusedButtons();
      ensureLogoutFunctionality();
      addLogoutButtonIfNeeded();
    }, 100);
  }

  // Also run when window loads (for dynamic content)
  window.addEventListener("load", function () {
    setTimeout(() => {
      removeUnusedButtons();
      ensureLogoutFunctionality();
      addLogoutButtonIfNeeded();
    }, 200);
  });
})();
