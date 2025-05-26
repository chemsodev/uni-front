// Admin pages validation script
// This script helps validate that all admin pages are properly connected to the auth system

const adminPages = [
  "admin-dashboard.html",
  "admin-gestion-sections.html",
  "admin-gestion-enseignants.html",
  "admin-demandes-section.html",
  "admin-profile-requests.html",
];

// Configuration information for each page
const pageConfig = {
  "admin-dashboard.html": {
    title: "Tableau de Bord - Administration",
    requiredScripts: ["js/admin-auth.js"],
    apiEndpoints: [],
  },
  "admin-gestion-sections.html": {
    title: "Gestion des Sections - Administration",
    requiredScripts: ["js/admin-auth.js"],
    apiEndpoints: ["sections", "departments", "specialities"],
  },
  "admin-gestion-enseignants.html": {
    title: "Gestion des Enseignants - Administration",
    requiredScripts: ["js/admin-auth.js"],
    apiEndpoints: ["teachers", "departments", "specialities"],
  },
  "admin-demandes-section.html": {
    title: "Demandes de Changement de Section - Administration",
    requiredScripts: ["js/admin-auth.js"],
    apiEndpoints: ["section-requests", "sections"],
  },
  "admin-profile-requests.html": {
    title: "Gestion des demandes de modification de profil - Administration",
    requiredScripts: ["js/admin-auth.js"],
    apiEndpoints: ["profile-requests"],
  },
};

// Function to check if a page includes admin-auth.js
function checkAdminAuthScript(page) {
  const htmlContent = document.documentElement.innerHTML;
  return htmlContent.includes("admin-auth.js");
}

// Function to check if page has removed redundant API_BASE_URL
function checkNoRedundantApiBaseUrl(page) {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    if (
      scripts[i].innerText.includes(
        'const API_BASE_URL = "https://unicersityback-production-1fbe.up.railway.app/api"'
      )
    ) {
      return false;
    }
  }
  return true;
}

// Function to check if page uses verifyAdminToken
function checksVerifyAdminToken(page) {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].innerText.includes("verifyAdminToken(")) {
      return true;
    }
  }
  return false;
}

// Function to check if the page uses apiCall helper
function checksApiCallHelper(page) {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].innerText.includes("apiCall(")) {
      return true;
    }
  }
  return false;
}

// Function to run the validation checks
function validateCurrentPage() {
  const currentPath = window.location.pathname;
  const fileName = currentPath.substring(currentPath.lastIndexOf("/") + 1);

  if (!pageConfig[fileName]) {
    console.log("This page is not configured for validation");
    return;
  }

  const config = pageConfig[fileName];
  const results = {
    page: fileName,
    title: document.title === config.title,
    hasAdminAuthScript: checkAdminAuthScript(fileName),
    noRedundantApiBaseUrl: checkNoRedundantApiBaseUrl(fileName),
    usesVerifyAdminToken: checksVerifyAdminToken(fileName),
    usesApiCallHelper: checksApiCallHelper(fileName),
  };

  console.log("Admin Page Validation Results:", results);
  return results;
}

// Auto-run validation when included in a page
document.addEventListener("DOMContentLoaded", validateCurrentPage);
