/**
 * Test script to verify the section responsables display
 * (Button removed as per client request)
 */

// Test initialization without adding the UI button
document.addEventListener("DOMContentLoaded", function () {
  // Button removed as requested
});

// Test function to display section responsables
function testSectionResponsablesDisplay() {
  console.log("Testing section responsables display...");

  // Sample test data that matches the provided structure
  const testData = [
    {
      id: "ad296c29-a5c3-41e7-8e5e-3da1356d404d",
      sectionId: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
      enseignantId: 3707,
      role: "section",
      assignedAt: "2025-05-24T16:01:13.846Z",
      section: {
        id: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
        name: "A",
        capacity: null,
        specialty: "ACAD",
        level: "L3",
        code: "ACA-L-A",
      },
      enseignant: {
        id: 3707,
        firstName: "CHEMS",
        lastName: "BOURABIA",
        email: "chemso@gmail.com",
        createdAt: "2025-05-24T14:08:11.872Z",
        updatedAt: "2025-05-24T14:36:44.863Z",
        adminRole: "enseignant",
        matricule: "ens123",
      },
    },
    {
      id: "a5c8aec3-03a5-4f0f-bdd0-cdc4e4774dde",
      sectionId: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
      enseignantId: 3674,
      role: "filiere",
      assignedAt: "2025-05-24T19:17:31.435Z",
      section: {
        id: "5706258a-a6ee-4cf4-b1bd-ae6a4ab0674d",
        name: "A",
        capacity: null,
        specialty: "ACAD",
        level: "L3",
        code: "ACA-L-A",
      },
      enseignant: {
        id: 3674,
        firstName: "Youcef",
        lastName: "HADJALI",
        email: "youcef.hadjali@univ.dz",
        createdAt: "2025-05-16T23:47:04.515Z",
        updatedAt: "2025-05-16T23:47:04.515Z",
        adminRole: "enseignant",
        matricule: "ENS008",
      },
    },
  ];
  // Create a test container if not already in the page (modified to be less visible)
  let testContainer = document.getElementById("test-responsables-container");

  if (!testContainer) {
    testContainer = document.createElement("div");
    testContainer.id = "test-responsables-container";
    testContainer.className = "teachers-info";
    testContainer.style.margin = "20px";
    testContainer.style.padding = "15px";
    testContainer.style.border = "1px solid #ddd";
    testContainer.style.borderRadius = "8px";
    testContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    testContainer.style.backgroundColor = "#fff";
    testContainer.style.display = "none"; // Hide the container

    const testTitle = document.createElement("h3");
    testTitle.textContent = "Données de test"; // Changed title
    testTitle.style.marginBottom = "15px";
    testContainer.appendChild(testTitle);

    const testDisplayArea = document.createElement("div");
    testDisplayArea.id = "teachers-test-section";
    testContainer.appendChild(testDisplayArea);

    // Insert the container at the top of the content area
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer) {
      contentContainer.insertBefore(testContainer, contentContainer.firstChild);
    } else {
      document.body.appendChild(testContainer);
    }
  }

  const displayArea = document.getElementById("teachers-test-section");

  // Process and display the test data
  if (displayArea) {
    // Mock the fetch function to return our test data
    const originalFetch = window.fetch;
    window.fetch = function (url) {
      if (url.includes("/responsables")) {
        console.log("Intercepted fetch for responsables, returning test data");
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(testData),
        });
      }
      return originalFetch.apply(this, arguments);
    };

    // Call the loadSectionTeachers function from section-responsables.js
    displayArea.innerHTML =
      '<div class="loading-teachers">Chargement des responsables...</div>';
    loadSectionTeachers("test-section"); // Restore the original fetch after a delay
    setTimeout(() => {
      window.fetch = originalFetch;

      // No notification shown
      console.log("Test data processing complete");
    }, 1000);
  }
}
