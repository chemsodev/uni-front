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
    type: "primary" | "success" | "warning" | "danger" | "info",
  };
}

// Export specific role configs with their allowed pages
export const roleConfigs = {
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
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-profile-requests.html",
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
        title: "Gestion des Départements",
        description: "Gérer les départements et leur structure",
        icon: "building",
        link: "departments.html",
      },
      {
        title: "Approbations en attente",
        description: "Traiter les demandes d'approbation",
        icon: "tasks",
        link: "admin-profile-requests.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-profile-requests.html",
      "departments.html",
    ],
  },
  "chef-de-departement": {
    stats: {
      key: "chef-departement",
      cards: [
        { id: "teachers", label: "Enseignants", icon: "chalkboard-teacher" },
        { id: "specialties", label: "Spécialités", icon: "graduation-cap" },
        { id: "sections", label: "Sections", icon: "users" },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Spécialités",
        description: "Gérer les spécialités et leurs responsables",
        icon: "graduation-cap",
        link: "specialites.html",
      },
      {
        title: "Gestion des Enseignants",
        description: "Gérer les enseignants du département",
        icon: "chalkboard-teacher",
        link: "admin-gestion-enseignants.html",
      },
      {
        title: "Gestion des Sections",
        description: "Voir et modifier les sections du département",
        icon: "users",
        link: "admin-gestion-sections.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-enseignants.html",
      "admin-gestion-sections.html",
      "specialites.html",
    ],
  },
  "chef-de-specialite": {
    stats: {
      key: "chef-specialite",
      cards: [
        { id: "sections", label: "Sections", icon: "users" },
        { id: "students", label: "Étudiants", icon: "user-graduate" },
        { id: "groups", label: "Groupes", icon: "layer-group" },
      ],
    },
    accessCards: [
      {
        title: "Gestion des Sections",
        description: "Gérer les sections et les groupes",
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
        title: "Demandes de Changement de Section",
        description: "Traiter les demandes de changement",
        icon: "exchange-alt",
        link: "admin-demandes-section.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "admin-gestion-sections.html",
      "gestion-etudiants.html",
      "admin-demandes-section.html",
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
        title: "Gestion des Annonces",
        description: "Publier des annonces pour les étudiants et enseignants",
        icon: "bullhorn",
        link: "announcements.html",
      },
      {
        title: "Demandes Administratives",
        description: "Traiter les demandes administratives",
        icon: "clipboard-list",
        link: "admin-profile-requests.html",
      },
    ],
    allowedPages: [
      "admin-dashboard.html",
      "emploi.html",
      "announcements.html",
      "admin-profile-requests.html",
    ],
  },
};
*/
