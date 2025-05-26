/**
 * Admin API Tester
 * A utility to help diagnose API connectivity issues and verify endpoints are working
 */

// Create a global API tester object
window.adminAPITester = {
  apiBaseURL: "https://unicersityback-production-1fbe.up.railway.app/api", // Default API URL

  // Results of the last test run
  lastTestResults: {
    timestamp: null,
    success: false,
    failures: [],
    successes: [],
    summary: "",
  },

  /**
   * Test an API endpoint
   * @param {string} endpoint - API endpoint path
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {Object} [body] - Request body (if applicable)
   * @param {string} [description] - Description of what this endpoint does
   * @returns {Promise<Object>} - Test result
   */
  async testEndpoint(endpoint, method = "GET", body = null, description = "") {
    try {
      console.log(`Testing endpoint: ${method} ${endpoint}`);

      // Get auth token
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      if (!token) {
        return {
          endpoint,
          method,
          success: false,
          error: "No authentication token found",
        };
      }

      // Build request config
      const config = {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      // Add body if provided
      if (
        body &&
        (method === "POST" || method === "PUT" || method === "PATCH")
      ) {
        config.body = JSON.stringify(body);
      }

      // Make the request
      const response = await fetch(`${this.apiBaseURL}/${endpoint}`, config);

      // Process the response
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // Response might not be JSON
      }

      return {
        endpoint,
        method,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        description: description,
      };
    } catch (error) {
      return {
        endpoint,
        method,
        success: false,
        error: error.message,
        description: description,
      };
    }
  },

  /**
   * Run a comprehensive API test suite
   * @returns {Promise<Object>} - Test results summary
   */
  async runAPISuiteTests() {
    console.log("Running API test suite...");

    const results = {
      timestamp: new Date().toISOString(),
      success: true,
      failures: [],
      successes: [],
      summary: "",
    };

    // Define endpoints to test - these should cover all CRUD operations
    const endpoints = [
      {
        endpoint: "enseignants",
        method: "GET",
        description: "Get all teachers",
      },
      { endpoint: "sections", method: "GET", description: "Get all sections" },
      { endpoint: "etudiants", method: "GET", description: "Get all students" },
      {
        endpoint: "change-requests",
        method: "GET",
        description: "Get section change requests",
      },
      {
        endpoint: "profile-requests",
        method: "GET",
        description: "Get profile change requests",
      },
      {
        endpoint: "departments",
        method: "GET",
        description: "Get all departments",
      },
      {
        endpoint: "admin/notifications",
        method: "GET",
        description: "Get admin notifications",
      },
    ];

    // Run all tests
    for (const endpointInfo of endpoints) {
      const result = await this.testEndpoint(
        endpointInfo.endpoint,
        endpointInfo.method,
        null,
        endpointInfo.description
      );

      if (result.success) {
        results.successes.push(result);
      } else {
        results.failures.push(result);
        results.success = false;
      }
    }

    // Generate summary
    results.summary = `API Test Results (${new Date().toLocaleString()})\n`;
    results.summary += `Success: ${results.success ? "PASS" : "FAIL"}\n`;
    results.summary += `Total endpoints tested: ${endpoints.length}\n`;
    results.summary += `Successful: ${results.successes.length}\n`;
    results.summary += `Failed: ${results.failures.length}\n\n`;

    if (results.failures.length > 0) {
      results.summary += "FAILURES:\n";
      results.failures.forEach((failure, index) => {
        results.summary += `${index + 1}. ${failure.method} ${
          failure.endpoint
        } - ${failure.description || "No description"}\n`;
        results.summary += `   Error: ${
          failure.error || failure.statusText || "Unknown error"
        }\n`;
      });
    }

    console.log(results.summary);
    this.lastTestResults = results;
    return results;
  },

  /**
   * Display API test results in the UI
   * @param {string} [containerId] - ID of the container element to render results in
   */
  displayResults(containerId = "api-test-results") {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found`);
      return;
    }

    const results = this.lastTestResults;
    if (!results.timestamp) {
      container.innerHTML = "<p>No tests have been run yet</p>";
      return;
    }

    // Generate HTML
    let html = `
      <div class="test-results ${results.success ? "success" : "failure"}">
        <h3>API Test Results</h3>
        <p class="timestamp">Run at: ${new Date(
          results.timestamp
        ).toLocaleString()}</p>
        <p class="summary-status">Status: <strong>${
          results.success ? "PASS" : "FAIL"
        }</strong></p>
        <p>Total endpoints tested: ${
          results.successes.length + results.failures.length
        }</p>
        <p>Successful: ${results.successes.length}</p>
        <p>Failed: ${results.failures.length}</p>
    `;

    // Show failures if any
    if (results.failures.length > 0) {
      html += `
        <h4>Failed Endpoints</h4>
        <ul class="failures-list">
      `;

      results.failures.forEach((failure) => {
        html += `
          <li>
            <div class="endpoint">${failure.method} ${failure.endpoint}</div>
            <div class="description">${
              failure.description || "No description"
            }</div>
            <div class="error">${
              failure.error || failure.statusText || "Unknown error"
            }</div>
          </li>
        `;
      });

      html += "</ul>";
    }

    // Show success details
    if (results.successes.length > 0) {
      html += `
        <h4>Successful Endpoints</h4>
        <ul class="successes-list">
      `;

      results.successes.forEach((success) => {
        html += `
          <li>
            <div class="endpoint">${success.method} ${success.endpoint}</div>
            <div class="description">${
              success.description || "No description"
            }</div>
          </li>
        `;
      });

      html += "</ul>";
    }

    html += `
      <button onclick="window.adminAPITester.runAPISuiteTests().then(() => window.adminAPITester.displayResults())">
        Run Tests Again
      </button>
    </div>`;

    // Add some basic styles
    html += `
    <style>
      .test-results {
        font-family: Arial, sans-serif;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }
      .test-results.success {
        background-color: #e6ffed;
        border: 1px solid #34d058;
      }
      .test-results.failure {
        background-color: #ffeef0;
        border: 1px solid #d73a49;
      }
      .failures-list, .successes-list {
        list-style: none;
        padding: 0;
      }
      .failures-list li, .successes-list li {
        padding: 10px;
        margin-bottom: 8px;
        border-radius: 4px;
      }
      .failures-list li {
        background-color: #fff1f0;
        border-left: 4px solid #d73a49;
      }
      .successes-list li {
        background-color: #f6ffee;
        border-left: 4px solid #28a745;
      }
      .endpoint {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .description {
        color: #586069;
        margin-bottom: 5px;
      }
      .error {
        color: #d73a49;
        font-family: monospace;
        margin-top: 5px;
        padding: 5px;
        background-color: #fff5f5;
        border-radius: 3px;
      }
      .test-results button {
        padding: 8px 16px;
        background-color: #0366d6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      }
      .test-results button:hover {
        background-color: #035cc1;
      }
    </style>
    `;

    container.innerHTML = html;
  },
};

console.log(
  "Admin API Tester initialized - Use window.adminAPITester to run tests"
);
