// Section schema (JavaScript object instead of TypeScript interface)
/**
 * @typedef {Object} Section
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string} level
 * @property {string} departmentId
 * @property {number} capacity
 * @property {number} studentCount
 * @property {string} status
 */

// Role-specific stats schemas
/**
 * @typedef {Object} DoyenStats
 * @property {number} departments
 * @property {number} totalAdmins
 * @property {number} pendingApprovals
 */

/**
 * @typedef {Object} ViceDoyenStats
 * @property {number} departments
 * @property {number} specialties
 * @property {number} pendingApprovals
 */

/**
 * @typedef {Object} ChefDepartementStats
 * @property {number} teachers
 * @property {number} specialties
 * @property {number} sections
 */

/**
 * @typedef {Object} ChefSpecialiteStats
 * @property {number} sections
 * @property {number} students
 * @property {number} groups
 */

/**
 * @typedef {Object} SecretaireStats
 * @property {number} schedules
 * @property {number} announcements
 * @property {number} pendingRequests
 */

// Role-specific access cards
/**
 * @typedef {Object} AccessCard
 * @property {string} title
 * @property {string} description
 * @property {string} icon
 * @property {string} link
 * @property {Object} [badge]
 * @property {string} [badge.text]
 * @property {string} [badge.type] - "primary" | "success" | "warning" | "danger" | "info"
 */

// Export specific role configs with their allowed pages
const roleConfigs = {
  doyen: {
    stats: {
      key: "doyen",
      cards: [
        { id: "departments", label: "Départements", icon: "building" },
        { id: "totalAdmins", label: "Administrateurs", icon: "users" },
        {
          id: "pendingApprovals",
          label: "Approbations en attente",
          icon: "clock",
        },
        { id: "totalBudget", label: "Budget Total", icon: "dollar-sign" },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Vice-Doyens",
        description: "Gérer les vice-doyens et leurs attributions",
        icon: "user-tie",
        link: "admin-gestion-enseignants.html?role=vice-doyen",
      },
      {
        title: "Gestion des Départements",
        description: "Créer, modifier et superviser tous les départements",
        icon: "building",
        link: "admin-gestion-departments.html",
      },
      {
        title: "Rapports Institutionnels",
        description: "Voir les rapports et les statistiques de l'université",
        icon: "chart-line",
        link: "reports.html",
      },
      {
        title: "Configuration Générale",
        description: "Paramètres généraux de l'université",
        icon: "cogs",
        link: "settings.html",
      },
      {
        title: "Gestion des Emplois du Temps",
        description: "Gérer les emplois du temps par section",
        icon: "calendar-alt",
        link: "admin-schedule-management.html",
      },
      {
        title: "Validation Finale",
        description: "Approuver les demandes importantes",
        icon: "check-circle",
        link: "admin-profile-requests.html?priority=high",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-profile-requests.html",
      "admin-gestion-departments.html",
      "admin-schedule-management.html",
      "reports.html",
      "settings.html",
    ],
  },
  "vice-doyen": {
    stats: {
      key: "vice-doyen",
      cards: [
        { id: "departments", label: "Départements", icon: "building" },
        { id: "specialties", label: "Spécialités", icon: "graduation-cap" },
        {
          id: "pendingApprovals",
          label: "Approbations en attente",
          icon: "clock",
        },
        { id: "adminStaff", label: "Personnel Admin", icon: "users-cog" },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Chefs de Département",
        description: "Gérer les chefs de département et leurs attributions",
        icon: "user-cog",
        link: "admin-gestion-enseignants.html?role=chef-de-departement",
      },
      {
        title: "Supervision des Départements",
        description: "Superviser et coordonner les départements",
        icon: "building",
        link: "admin-gestion-departments.html",
      },
      {
        title: "Demandes Administratives",
        description: "Traiter les demandes d'approbation administrative",
        icon: "tasks",
        link: "admin-profile-requests.html",
      },
      {
        title: "Gestion du Personnel",
        description: "Gérer les affectations du personnel administratif",
        icon: "users",
        link: "admin-gestion-enseignants.html",
      },
      {
        title: "Gestion des Emplois du Temps",
        description: "Gérer les emplois du temps par section",
        icon: "calendar-alt",
        link: "admin-schedule-management.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-profile-requests.html",
      "admin-gestion-departments.html",
      "admin-schedule-management.html",
    ],
  },
  "chef-de-departement": {
    stats: {
      key: "chef-departement",
      cards: [
        { id: "teachers", label: "Enseignants", icon: "chalkboard-teacher" },
        { id: "specialties", label: "Spécialités", icon: "graduation-cap" },
        { id: "sections", label: "Sections", icon: "users" },
        {
          id: "departmentBudget",
          label: "Budget Département",
          icon: "calculator",
        },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Spécialités",
        description: "Gérer les spécialités et leurs responsables",
        icon: "graduation-cap",
        link: "admin-gestion-specialites.html",
      },
      {
        title: "Gestion des Enseignants",
        description: "Gérer les enseignants du département",
        icon: "chalkboard-teacher",
        link: "admin-gestion-enseignants.html",
      },
      {
        title: "Supervision des Sections",
        description: "Superviser les sections du département",
        icon: "users",
        link: "admin-gestion-sections.html",
      },
      {
        title: "Planification Académique",
        description: "Planifier les cours et les emplois du temps",
        icon: "calendar",
        link: "academic-planning.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-gestion-sections.html",
      "admin-gestion-specialites.html",
      "admin-schedule-management.html",
      "academic-planning.html",
    ],
  },
  "chef-de-specialite": {
    stats: {
      key: "chef-specialite",
      cards: [
        { id: "sections", label: "Sections", icon: "users" },
        { id: "students", label: "Étudiants", icon: "user-graduate" },
        { id: "groups", label: "Groupes", icon: "layer-group" },
        {
          id: "pendingRequests",
          label: "Demandes en attente",
          icon: "clipboard-list",
        },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Sections",
        description: "Gérer les sections et les groupes de la spécialité",
        icon: "users",
        link: "admin-gestion-sections.html",
      },
      {
        title: "Gestion des Étudiants",
        description: "Voir et modifier les informations des étudiants",
        icon: "user-graduate",
        link: "gestion-etudiants.html",
      },
      {
        title: "Demandes de Changement",
        description: "Traiter les demandes de changement de section",
        icon: "exchange-alt",
        link: "admin-demandes-section.html",
      },
      {
        title: "Emplois du Temps",
        description: "Gérer les emplois du temps des sections",
        icon: "calendar-alt",
        link: "schedule-management.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-sections.html",
      "gestion-etudiants.html",
      "admin-demandes-section.html",
      "admin-schedule-management.html",
      "schedule-management.html",
    ],
  },
  secretaire: {
    stats: {
      key: "secretaire",
      cards: [
        { id: "schedules", label: "Emplois du temps", icon: "calendar" },
        { id: "announcements", label: "Annonces", icon: "bullhorn" },
        {
          id: "pendingRequests",
          label: "Demandes en attente",
          icon: "clipboard-list",
        },
        { id: "documents", label: "Documents traités", icon: "file-alt" },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Emplois du Temps",
        description: "Créer et modifier les emplois du temps",
        icon: "calendar",
        link: "emploi.html",
      },
      {
        title: "Demandes de Profil",
        description: "Traiter les demandes de modification de profil",
        icon: "user-edit",
        link: "admin-profile-requests.html",
      },
      {
        title: "Gestion des Annonces",
        description: "Publier des annonces pour les étudiants et enseignants",
        icon: "bullhorn",
        link: "announcements.html",
      },
      {
        title: "Documents Administratifs",
        description: "Gérer les documents et certificats",
        icon: "file-alt",
        link: "document-management.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "emploi.html",
      "announcements.html",
      "admin-profile-requests.html",
      "admin-schedule-management.html",
      "document-management.html",
    ],
  },
};

// Helper function to get access cards by role
function getAccessCardsByRole(role) {
  const config = roleConfigs[role?.toLowerCase()];
  return config ? config.accessCards : [];
}

// Helper function to get allowed pages by role
function getAllowedPagesByRole(role) {
  const config = roleConfigs[role?.toLowerCase()];
  return config ? config.allowedPages : [];
}

// Helper function to get stats configuration by role
function getStatsConfigByRole(role) {
  const config = roleConfigs[role?.toLowerCase()];
  return config ? config.stats : null;
}

// Helper function to check if a role can access a specific page
function canRoleAccessPage(role, page) {
  const allowedPages = getAllowedPagesByRole(role);
  return allowedPages.includes(page);
}

// Make all functions and variables globally accessible
window.roleConfigs = roleConfigs;
window.getAccessCardsByRole = getAccessCardsByRole;
window.getAllowedPagesByRole = getAllowedPagesByRole;
window.getStatsConfigByRole = getStatsConfigByRole;
window.canRoleAccessPage = canRoleAccessPage;
