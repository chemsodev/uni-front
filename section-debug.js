// Section Debug Utility
// This script helps diagnose why section changes might not be working
// Copy and paste this in the browser console on the demandes.html page

async function debugSectionAvailability() {
  console.log("=== Starting Section Availability Debugging ===");

  const authToken =
    sessionStorage.getItem("etudiant_token") ||
    localStorage.getItem("etudiant_token");
  if (!authToken) {
    console.error("No auth token available");
    return;
  }

  // Get current user ID
  let currentUserId;
  try {
    const verifyResponse = await fetch(
      "https://unicersityback-production-1fbe.up.railway.app/api/auth/verify",
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!verifyResponse.ok) {
      console.error("Failed to verify token");
      return;
    }

    const userData = await verifyResponse.json();
    currentUserId = userData.userId;
    console.log("Current user ID:", currentUserId);
  } catch (error) {
    console.error("Error verifying token:", error);
    return;
  }

  // Get student data
  try {
    const studentRes = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${currentUserId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!studentRes.ok) {
      console.error("Failed to fetch student data");
      return;
    }

    const studentData = await studentRes.json();
    console.log("STUDENT DATA:", studentData);

    // Get current section information
    const currentSection = studentData.sections?.[0];
    if (!currentSection) {
      console.error("No section assigned to student");
      return;
    }

    console.log("Current Section:", {
      id: currentSection.id,
      name: currentSection.name,
      specialty: currentSection.specialty,
      level: currentSection.level,
    });

    // Get all sections with the same specialty and level
    const sectionsRes = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/sections?specialty=${currentSection.specialty}&level=${currentSection.level}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (!sectionsRes.ok) {
      console.error("Failed to fetch sections");
      return;
    }

    const allSections = await sectionsRes.json();
    console.log("All Sections for same specialty and level:", allSections);

    // Test section filtering logic
    console.log("=== Testing Section Filtering Logic ===");
    console.log("Current Section ID:", currentSection.id);

    const filteredSections = allSections.filter((section) => {
      const isSameSection = section.id === currentSection.id;
      const hasSectionID = Boolean(section.id);
      const hasSameID = hasSectionID && section.id === currentSection.id;
      const stringIDsEqual = String(section.id) === String(currentSection.id);
      const hasCapacity =
        !section.capacity || section.currentOccupancy < section.capacity;

      console.log(`Section ${section.name} (${section.id}):`, {
        isSameSection,
        hasSectionID,
        hasSameID,
        stringIDsEqual,
        capacity: section.capacity,
        currentOccupancy: section.currentOccupancy,
        hasCapacity,
        available: !stringIDsEqual && hasCapacity,
      });

      return !stringIDsEqual && hasCapacity;
    });

    console.log(
      `Found ${filteredSections.length} available sections for changes`
    );
    console.log("Available sections:", filteredSections);

    // Check if loadAvailableOptions would find any sections
    console.log("=== Simulating loadAvailableOptions for sections ===");
    console.log("Current ID:", currentSection.id);

    // This simulates the logic in loadAvailableOptions
    const validSections = allSections.filter((section) => {
      const sectionIdStr = String(section.id || "");
      const currentIdStr = String(currentSection.id || "");

      console.log(`Comparing IDs for ${section.name}:`, {
        sectionId: section.id,
        currentId: currentSection.id,
        sectionIdStr,
        currentIdStr,
        areEqual: sectionIdStr === currentIdStr,
      });

      if (sectionIdStr === currentIdStr) {
        console.log(
          `Filtered out current section: ${section.name} (ID match: ${sectionIdStr})`
        );
        return false;
      }

      // Filter out full sections
      if (
        section.capacity &&
        section.currentOccupancy &&
        section.currentOccupancy >= section.capacity
      ) {
        console.log(
          `Filtering out full section: ${section.name} (${section.currentOccupancy}/${section.capacity})`
        );
        return false;
      }

      return true;
    });

    console.log(
      `Found ${validSections.length} valid sections after simulation`
    );
    console.log("Valid sections:", validSections);

    console.log("=== Section Availability Debugging Complete ===");
  } catch (error) {
    console.error("Error during section debugging:", error);
  }
}

// Execute the debug function
debugSectionAvailability();
