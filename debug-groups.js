// This is a debugging script to help identify the group availability issue
// Copy and paste this into your browser console when on the demandes.html page

// Function to debug group availability
async function debugGroupAvailability() {
  console.log("=== Starting Group Availability Debugging ===");

  // Collect current user's group IDs from the page
  const currentSectionId =
    document.getElementById("current-section")?.dataset?.id;
  const currentTdGroupId = document.getElementById("current-td")?.dataset?.id;
  const currentTpGroupId = document.getElementById("current-tp")?.dataset?.id;

  console.log("Current assignments from DOM:", {
    sectionId: currentSectionId,
    tdGroupId: currentTdGroupId,
    tpGroupId: currentTpGroupId,
  });

  // Fetch student data
  const studentData = await fetchStudentData();
  console.log("Student data from API:", {
    sectionId: studentData.sections?.[0]?.id,
    tdGroupId: studentData.tdGroupe?.id,
    tpGroupId: studentData.tpGroupe?.id,
  });

  // Now fetch groups for this section
  const sectionId = studentData.sections?.[0]?.id;
  if (!sectionId) {
    console.error("No section ID found");
    return;
  }

  try {
    const response = await fetch(
      `https://unicersityback-production-1fbe.up.railway.app/api/sections/${sectionId}/groupes`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const groups = await response.json();
    console.log("All groups:", groups);

    // Check TP groups
    const tpGroups = groups.filter((g) => g.type === "tp");
    console.log("TP Groups:", tpGroups);

    // Check the filtering logic for TP groups
    console.log("TP Group filtering check:");
    tpGroups.forEach((group) => {
      const isCorrectType = group.type === "tp";
      const isNotCurrentGroup = group.id !== currentTpGroupId;
      const hasCapacity =
        !group.capacity || group.currentOccupancy < group.capacity;

      const available = isCorrectType && isNotCurrentGroup && hasCapacity;

      console.log(`TP Group ${group.name} (${group.id}):`, {
        isCorrectType,
        isNotCurrentGroup,
        currentTpGroupId,
        hasCapacity: `${group.currentOccupancy}/${group.capacity}`,
        available,
      });
    });

    // Check TD groups
    const tdGroups = groups.filter((g) => g.type === "td");
    console.log("TD Groups:", tdGroups);

    // Check the filtering logic for TD groups
    console.log("TD Group filtering check:");
    tdGroups.forEach((group) => {
      const isCorrectType = group.type === "td";
      const isNotCurrentGroup = group.id !== currentTdGroupId;
      const hasCapacity =
        !group.capacity || group.currentOccupancy < group.capacity;

      const available = isCorrectType && isNotCurrentGroup && hasCapacity;

      console.log(`TD Group ${group.name} (${group.id}):`, {
        isCorrectType,
        isNotCurrentGroup,
        currentTdGroupId,
        hasCapacity: `${group.currentOccupancy}/${group.capacity}`,
        available,
      });
    });

    // Test a direct ID equality issue
    tpGroups.forEach((group) => {
      console.log(`Testing ID equality for TP Group ${group.name}:`, {
        group_id: group.id,
        group_id_type: typeof group.id,
        current_id: currentTpGroupId,
        current_id_type: typeof currentTpGroupId,
        strict_equal: group.id === currentTpGroupId,
        loose_equal: group.id == currentTpGroupId,
        toString_equal: group.id?.toString() === currentTpGroupId?.toString(),
      });
    });

    console.log("=== Group Availability Debugging Complete ===");
  } catch (error) {
    console.error("Error debugging groups:", error);
  }
}

// Helper function to get student data
async function fetchStudentData() {
  const userId = currentUser?.id;
  if (!userId) {
    throw new Error("No user ID available");
  }

  const res = await fetch(
    `https://unicersityback-production-1fbe.up.railway.app/api/etudiants/${userId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch student data");
  }

  return await res.json();
}

// Run the debug function
debugGroupAvailability();
