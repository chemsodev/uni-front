/**
 * Section Statistics Component
 * Provides visualization and display of detailed section statistics
 */

// Initialize charts and statistics components when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Setup event listener for the statistics tab if present
  if (document.getElementById("show-statistics-btn")) {
    document
      .getElementById("show-statistics-btn")
      .addEventListener("click", () => {
        showSectionStatistics();
      });
  }
});

/**
 * Display section statistics dashboard
 */
async function showSectionStatistics() {
  // Show loading message
  const statisticsContainer = document.getElementById("statistics-container");
  if (!statisticsContainer) return;

  // Check if all required dependencies are available
  if (!checkStatisticsDependencies()) {
    handleStatisticsError(
      new Error(
        "Les dépendances requises pour afficher les statistiques sont manquantes."
      ),
      statisticsContainer
    );
    return;
  }

  statisticsContainer.innerHTML =
    '<div class="loading-indicator">Chargement des statistiques...</div>';

  try {
    // Get filters if they exist
    const departmentId =
      document.getElementById("department-filter")?.value !== "all"
        ? document.getElementById("department-filter")?.value
        : null;

    const level =
      document.getElementById("level-filter")?.value !== "all"
        ? document.getElementById("level-filter")?.value
        : null;

    const specialty =
      document.getElementById("specialty-filter")?.value !== "all"
        ? document.getElementById("specialty-filter")?.value
        : null;

    // Fetch statistics from API
    const statistics = await window.sectionAPI.getSectionStatistics(
      departmentId,
      level,
      specialty
    );

    if (!statistics || statistics.length === 0) {
      statisticsContainer.innerHTML =
        '<div class="no-data">Aucune donnée statistique disponible</div>';
      return;
    }

    // Render statistics dashboard
    renderStatisticsDashboard(statisticsContainer, statistics);
  } catch (error) {
    handleStatisticsError(error, statisticsContainer);
  }
}

/**
 * Render the statistics dashboard with charts and metrics
 */
function renderStatisticsDashboard(container, statistics) {
  // Setup the dashboard structure
  container.innerHTML = `
    <div class="statistics-dashboard">
      <div class="statistics-header">
        <h2>Statistiques des Sections</h2>
        <div class="statistics-actions">
          <button id="export-stats-btn" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exporter
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

      <div class="statistics-summary">
        <div class="stat-card">
          <div class="stat-value">${statistics.length}</div>
          <div class="stat-label">Sections totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${calculateTotalStudents(statistics)}</div>
          <div class="stat-label">Étudiants inscrits</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${calculateTotalCapacity(statistics)}</div>
          <div class="stat-label">Capacité totale</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${calculateAverageOccupancy(
            statistics
          )}%</div>
          <div class="stat-label">Taux d'occupation moyen</div>
        </div>
      </div>

      <div class="statistics-charts">
        <div class="chart-container">
          <h3>Répartition par niveau</h3>
          <canvas id="level-distribution-chart"></canvas>
        </div>
        <div class="chart-container">
          <h3>Taux d'occupation</h3>
          <canvas id="occupancy-chart"></canvas>
        </div>
      </div>

      <div class="statistics-table-container">
        <h3>Détail des sections</h3>
        <table class="statistics-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Niveau</th>
              <th>Spécialité</th>
              <th>Département</th>
              <th>Étudiants</th>
              <th>Capacité</th>
              <th>Occupation</th>
              <th>Groupes TD</th>
              <th>Groupes TP</th>
              <th>Délégué</th>
            </tr>
          </thead>
          <tbody id="statistics-table-body">
            ${generateStatisticsTableRows(statistics)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Initialize charts
  initializeLevelDistributionChart(statistics);
  initializeOccupancyChart(statistics);

  // Setup action button event listeners
  document
    .getElementById("export-stats-btn")
    .addEventListener("click", () => exportStatistics(statistics));
  document
    .getElementById("refresh-stats-btn")
    .addEventListener("click", () => showSectionStatistics());
}

/**
 * Calculate total number of students across all sections
 */
function calculateTotalStudents(statistics) {
  return statistics.reduce((total, section) => total + section.studentCount, 0);
}

/**
 * Calculate total capacity across all sections
 */
function calculateTotalCapacity(statistics) {
  return statistics.reduce((total, section) => total + section.capacity, 0);
}

/**
 * Calculate average occupancy rate across all sections
 */
function calculateAverageOccupancy(statistics) {
  if (statistics.length === 0) return 0;

  const sum = statistics.reduce(
    (total, section) => total + section.occupancyRate,
    0
  );
  return Math.round(sum / statistics.length);
}

/**
 * Generate HTML table rows for detailed statistics
 */
function generateStatisticsTableRows(statistics) {
  return statistics
    .map((section) => {
      let occupancyClass = "normal";
      if (section.occupancyRate >= 90) {
        occupancyClass = "high";
      } else if (section.occupancyRate >= 75) {
        occupancyClass = "medium";
      }

      return `
      <tr>
        <td>${section.name}</td>
        <td>${section.level}</td>
        <td>${section.specialty}</td>
        <td>${section.departmentName || "N/A"}</td>
        <td>${section.studentCount}</td>
        <td>${section.capacity}</td>
        <td><span class="occupancy-badge ${occupancyClass}">${
        section.occupancyRate
      }%</span></td>
        <td>${section.groupCount.td}</td>
        <td>${section.groupCount.tp}</td>
        <td>${section.delegateName || "Non assigné"}</td>
      </tr>
    `;
    })
    .join("");
}

/**
 * Initialize chart showing distribution of sections by level
 */
function initializeLevelDistributionChart(statistics) {
  // Group sections by level
  const levelCounts = {};
  statistics.forEach((section) => {
    const level = section.level || "Unknown";
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  const labels = Object.keys(levelCounts);
  const data = Object.values(levelCounts);

  // Create chart using Chart.js (or similar library)
  // For this example, we'll check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.warn(
      'Chart.js is not available. Add <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> to your HTML.'
    );
    document.getElementById("level-distribution-chart").innerHTML =
      '<div class="chart-fallback">Graphique non disponible</div>';
    return;
  }

  const ctx = document
    .getElementById("level-distribution-chart")
    .getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#4361ee",
            "#3a0ca3",
            "#7209b7",
            "#f72585",
            "#4cc9f0",
          ],
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
        title: {
          display: false,
        },
      },
    },
  });
}

/**
 * Initialize chart showing occupancy rates
 */
function initializeOccupancyChart(statistics) {
  // Group sections by occupancy rate ranges
  const occupancyRanges = {
    "0-25%": 0,
    "26-50%": 0,
    "51-75%": 0,
    "76-90%": 0,
    "91-100%": 0,
    ">100%": 0,
  };

  statistics.forEach((section) => {
    const rate = section.occupancyRate;
    if (rate <= 25) occupancyRanges["0-25%"]++;
    else if (rate <= 50) occupancyRanges["26-50%"]++;
    else if (rate <= 75) occupancyRanges["51-75%"]++;
    else if (rate <= 90) occupancyRanges["76-90%"]++;
    else if (rate <= 100) occupancyRanges["91-100%"]++;
    else occupancyRanges[">100%"]++;
  });

  const labels = Object.keys(occupancyRanges);
  const data = Object.values(occupancyRanges);

  // Create chart using Chart.js (or similar library)
  // For this example, we'll check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.warn(
      'Chart.js is not available. Add <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> to your HTML.'
    );
    document.getElementById("occupancy-chart").innerHTML =
      '<div class="chart-fallback">Graphique non disponible</div>';
    return;
  }

  const ctx = document.getElementById("occupancy-chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Nombre de sections",
          data: data,
          backgroundColor: "#4cc9f0",
          borderColor: "#3a86ff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
 * Export statistics to CSV
 */
function exportStatistics(statistics) {
  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";

  // Add headers
  csvContent +=
    "Nom,Niveau,Spécialité,Département,Nombre d'étudiants,Capacité,Taux d'occupation,Groupes TD,Groupes TP,Délégué\n";

  // Add rows
  statistics.forEach((section) => {
    const row = [
      section.name,
      section.level,
      section.specialty,
      section.departmentName || "N/A",
      section.studentCount,
      section.capacity,
      section.occupancyRate + "%",
      section.groupCount.td,
      section.groupCount.tp,
      section.delegateName || "Non assigné",
    ];

    // Escape commas and quotes
    const formattedRow = row.map((cell) => {
      const cellStr = String(cell);
      if (
        cellStr.includes(",") ||
        cellStr.includes('"') ||
        cellStr.includes("\n")
      ) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    });

    csvContent += formattedRow.join(",") + "\n";
  });

  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "statistiques_sections.csv");
  document.body.appendChild(link);

  // Trigger download
  link.click();

  // Clean up
  document.body.removeChild(link);
}

/**
 * Handle errors in statistics loading
 * @param {Error} error The error that occurred
 * @param {HTMLElement} container The container to display error in
 */
function handleStatisticsError(error, container) {
  console.error("Error in section statistics:", error);
  container.innerHTML = `
    <div class="error-message">
      <h3>Erreur lors du chargement des statistiques</h3>
      <p>${error.message}</p>
      <button class="btn btn-primary" onclick="window.sectionStatistics.showSectionStatistics()">
        Réessayer
      </button>
    </div>
  `;
}

/**
 * Check if the required APIs and components are available
 * @returns {boolean} True if all dependencies are available
 */
function checkStatisticsDependencies() {
  const dependencies = {
    "Chart.js": typeof Chart !== "undefined",
    "sectionAPI.getSectionStatistics":
      typeof window.sectionAPI?.getSectionStatistics === "function",
  };

  let allAvailable = true;
  const missing = [];

  for (const [name, available] of Object.entries(dependencies)) {
    if (!available) {
      allAvailable = false;
      missing.push(name);
    }
  }

  if (!allAvailable) {
    console.error(
      `Missing dependencies for section statistics: ${missing.join(", ")}`
    );
  }

  return allAvailable;
}

// Export functions for use in HTML
window.sectionStatistics = {
  showSectionStatistics,
  exportStatistics,
};
