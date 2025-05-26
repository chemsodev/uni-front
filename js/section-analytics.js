/**
 * Section Analytics Module
 * Provides detailed analytics and visualizations for section data
 */

// Initialize when the document is ready
document.addEventListener("DOMContentLoaded", function () {
  // Check if we're on a page with statistics functionality
  const statisticsContainer = document.getElementById("statistics-container");
  if (statisticsContainer) {
    initializeSectionAnalytics();
  }
});

/**
 * Initialize the section analytics functionality
 */
function initializeSectionAnalytics() {
  // Add event listener for the statistics button if it exists
  const showStatisticsBtn = document.getElementById("show-statistics-btn");
  if (showStatisticsBtn) {
    showStatisticsBtn.addEventListener("click", loadSectionAnalytics);
  }
}

/**
 * Load section analytics data and render the dashboard
 */
async function loadSectionAnalytics() {
  const statisticsContainer = document.getElementById("statistics-container");
  if (!statisticsContainer) return;

  // Show loading state
  statisticsContainer.innerHTML =
    '<div class="loading-indicator">Chargement des statistiques...</div>';

  try {
    // Check if Chart.js is available
    if (typeof Chart === "undefined") {
      throw new Error(
        "Chart.js n'est pas disponible. Les visualisations ne peuvent pas être affichées."
      );
    }

    // Get filter values if available
    const departmentId =
      document.getElementById("department-filter")?.value !== "all"
        ? document.getElementById("department-filter")?.value
        : null;

    // Use the section API if available
    let analyticsData;
    if (window.sectionAPI) {
      // Get section statistics
      const sectionStats = await window.sectionAPI.getSectionStatistics(
        departmentId
      );

      // Get section analytics
      let analytics;
      try {
        const API_URL =
          "https://unicersityback-production-1fbe.up.railway.app/api";
        const token = getAuthToken();

        const response = await fetch(
          `${API_URL}/sections/statistics/analytics${
            departmentId ? `?departmentId=${departmentId}` : ""
          }`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        analytics = await response.json();
      } catch (error) {
        console.warn("Could not load analytics data:", error);
        // Create fallback analytics from section statistics
        analytics = createFallbackAnalytics(sectionStats);
      }

      analyticsData = {
        sections: sectionStats,
        analytics: analytics,
      };
    } else {
      throw new Error("L'API des sections n'est pas disponible");
    }

    // Render the analytics dashboard
    renderSectionAnalyticsDashboard(statisticsContainer, analyticsData);
  } catch (error) {
    console.error("Error loading section analytics:", error);
    statisticsContainer.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <p>Une erreur s'est produite lors du chargement des statistiques:</p>
          <p class="error-details">${error.message || "Erreur inconnue"}</p>
        </div>
        <button class="btn btn-outline" id="retry-statistics-btn">Réessayer</button>
      </div>
    `;

    // Add retry button functionality
    document
      .getElementById("retry-statistics-btn")
      ?.addEventListener("click", loadSectionAnalytics);
  }
}

/**
 * Render the section analytics dashboard
 */
function renderSectionAnalyticsDashboard(container, data) {
  const { sections, analytics } = data;

  // Create the dashboard structure
  container.innerHTML = `
    <div class="statistics-dashboard">
      <div class="statistics-header">
        <h2>Tableau de bord des Sections</h2>
        <div class="statistics-actions">
          <button id="export-stats-csv-btn" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exporter CSV
          </button>
          <button id="export-stats-pdf-btn" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Exporter PDF
          </button>
          <button id="refresh-stats-btn" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
              <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Key metrics cards -->
      <div class="section-analytics-dashboard">
        <div class="section-analytics-card">
          <h3>Nombre total d'étudiants</h3>
          <div class="section-analytics-value">${analytics.totalStudents}</div>
        </div>
        <div class="section-analytics-card">
          <h3>Capacité totale</h3>
          <div class="section-analytics-value">${analytics.totalCapacity}</div>
        </div>
        <div class="section-analytics-card">
          <h3>Taux d'occupation moyen</h3>
          <div class="section-analytics-value">${
            analytics.averageOccupancyRate
          }</div>
        </div>
        <div class="section-analytics-card">
          <h3>Nombre de sections</h3>
          <div class="section-analytics-value">${sections.length}</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="section-analytics-dashboard">
        <div class="section-analytics-card">
          <h3>Distribution par niveau</h3>
          <div class="section-analytics-chart">
            <canvas id="level-distribution-chart"></canvas>
          </div>
        </div>
        <div class="section-analytics-card">
          <h3>Distribution par spécialité</h3>
          <div class="section-analytics-chart">
            <canvas id="specialty-distribution-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="section-analytics-dashboard">
        <div class="section-analytics-card">
          <h3>Taux d'occupation</h3>
          <div class="section-analytics-chart">
            <canvas id="occupancy-distribution-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Section Table -->
      <div class="statistics-table-container">
        <h3>Détails des sections</h3>
        <div class="responsive-table">
          <table class="statistics-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Niveau</th>
                <th>Spécialité</th>
                <th>Département</th>
                <th>Étudiants</th>
                <th>Capacité</th>
                <th>Taux d'occupation</th>
              </tr>
            </thead>
            <tbody id="statistics-table-body">
              ${generateSectionTableRows(sections)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Create charts
  createLevelDistributionChart(analytics.sectionsByLevel);
  createSpecialtyDistributionChart(analytics.sectionsBySpecialty);
  createOccupancyDistributionChart(analytics.sectionsByOccupancy);

  // Add event listeners for action buttons
  document
    .getElementById("refresh-stats-btn")
    ?.addEventListener("click", loadSectionAnalytics);
  document
    .getElementById("export-stats-csv-btn")
    ?.addEventListener("click", () => exportSectionsToCSV(sections));
  document
    .getElementById("export-stats-pdf-btn")
    ?.addEventListener("click", () => exportSectionsToPDF(sections));
}

/**
 * Create a fallback analytics object from section statistics
 */
function createFallbackAnalytics(sections) {
  // Calculate totals
  let totalStudents = 0;
  let totalCapacity = 0;
  const levelCounts = {};
  const specialtyCounts = {};
  const occupancyRanges = {
    "Below 50%": 0,
    "50% - 75%": 0,
    "75% - 90%": 0,
    "90% - 100%": 0,
    "Over 100%": 0,
  };

  sections.forEach((section) => {
    // Add to totals
    totalStudents += section.studentCount || 0;
    totalCapacity += section.capacity || 100;

    // Count by level
    levelCounts[section.level] = (levelCounts[section.level] || 0) + 1;

    // Count by specialty
    specialtyCounts[section.specialty] =
      (specialtyCounts[section.specialty] || 0) + 1;

    // Calculate occupancy rate and categorize
    const occupancyRate = parseInt(section.occupancyRate) || 0;

    if (occupancyRate < 50) {
      occupancyRanges["Below 50%"]++;
    } else if (occupancyRate < 75) {
      occupancyRanges["50% - 75%"]++;
    } else if (occupancyRate < 90) {
      occupancyRanges["75% - 90%"]++;
    } else if (occupancyRate <= 100) {
      occupancyRanges["90% - 100%"]++;
    } else {
      occupancyRanges["Over 100%"]++;
    }
  });

  // Calculate average occupancy
  const avgOccupancy =
    totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return {
    totalStudents,
    totalCapacity,
    averageOccupancyRate: `${avgOccupancy}%`,
    sectionsByLevel: Object.entries(levelCounts).map(([level, count]) => ({
      level,
      count,
    })),
    sectionsBySpecialty: Object.entries(specialtyCounts).map(
      ([specialty, count]) => ({
        specialty,
        count,
      })
    ),
    sectionsByOccupancy: Object.entries(occupancyRanges).map(
      ([range, count]) => ({
        range,
        count,
      })
    ),
  };
}

/**
 * Generate HTML table rows for sections
 */
function generateSectionTableRows(sections) {
  if (!sections || sections.length === 0) {
    return '<tr><td colspan="7">Aucune donnée disponible</td></tr>';
  }

  return sections
    .map((section) => {
      const occupancyRate = parseInt(section.occupancyRate) || 0;
      let occupancyClass = "";

      if (occupancyRate > 90) {
        occupancyClass = "occupancy-high";
      } else if (occupancyRate > 75) {
        occupancyClass = "occupancy-medium";
      } else {
        occupancyClass = "occupancy-low";
      }

      return `
      <tr>
        <td>${section.name}</td>
        <td>${section.level}</td>
        <td>${section.specialty}</td>
        <td>${section.departmentName || "N/A"}</td>
        <td>${section.studentCount || 0}</td>
        <td>${section.capacity || 100}</td>
        <td class="${occupancyClass}">${section.occupancyRate}</td>
      </tr>
    `;
    })
    .join("");
}

/**
 * Create level distribution chart
 */
function createLevelDistributionChart(levelData) {
  const ctx = document.getElementById("level-distribution-chart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: levelData.map((item) => item.level),
      datasets: [
        {
          label: "Nombre de sections",
          data: levelData.map((item) => item.count),
          backgroundColor: "#4f46e5",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

/**
 * Create specialty distribution chart
 */
function createSpecialtyDistributionChart(specialtyData) {
  const ctx = document.getElementById("specialty-distribution-chart");
  if (!ctx) return;

  // If we have too many specialties, limit to top 5 and group others
  let chartData = specialtyData;
  if (specialtyData.length > 5) {
    // Sort by count descending
    const sorted = [...specialtyData].sort((a, b) => b.count - a.count);

    // Take top 5
    const top5 = sorted.slice(0, 5);

    // Group others
    const othersCount = sorted
      .slice(5)
      .reduce((sum, item) => sum + item.count, 0);

    chartData = [...top5, { specialty: "Autres", count: othersCount }];
  }

  // Generate colors
  const colors = [
    "#4f46e5",
    "#10b981",
    "#f97316",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
  ];

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartData.map((item) => item.specialty),
      datasets: [
        {
          data: chartData.map((item) => item.count),
          backgroundColor: chartData.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
        },
      },
    },
  });
}

/**
 * Create occupancy distribution chart
 */
function createOccupancyDistributionChart(occupancyData) {
  const ctx = document.getElementById("occupancy-distribution-chart");
  if (!ctx) return;

  const colors = {
    "Below 50%": "#10b981",
    "50% - 75%": "#84cc16",
    "75% - 90%": "#f97316",
    "90% - 100%": "#f59e0b",
    "Over 100%": "#ef4444",
  };

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: occupancyData.map((item) => item.range),
      datasets: [
        {
          label: "Nombre de sections",
          data: occupancyData.map((item) => item.count),
          backgroundColor: occupancyData.map(
            (item) => colors[item.range] || "#4f46e5"
          ),
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

/**
 * Export sections data to CSV
 */
function exportSectionsToCSV(sections) {
  // Create CSV content
  const headers = [
    "Nom",
    "Niveau",
    "Spécialité",
    "Département",
    "Étudiants",
    "Capacité",
    "Occupation",
  ];

  let csvContent = headers.join(",") + "\n";

  sections.forEach((section) => {
    const row = [
      `"${section.name || ""}"`,
      `"${section.level || ""}"`,
      `"${section.specialty || ""}"`,
      `"${section.departmentName || ""}"`,
      section.studentCount || 0,
      section.capacity || 0,
      `"${section.occupancyRate || "0%"}"`,
    ];

    csvContent += row.join(",") + "\n";
  });

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "sections_statistics.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export sections data to PDF
 * Note: This is a simplified version, in a real app you might use a library like jsPDF
 */
function exportSectionsToPDF(sections) {
  alert("Fonctionnalité d'export PDF en cours de développement");
  console.log("PDF export would include:", sections);
}

/**
 * Helper function to get auth token
 */
function getAuthToken() {
  return (
    localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token")
  );
}
