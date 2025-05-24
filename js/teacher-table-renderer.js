/**
 * Enhanced renderTable function for the teacher management page
 * Renders the teachers table with better styling and action buttons
 */
function renderTable() {
  if (!teachersTableBody) return;
  teachersTableBody.innerHTML = "";

  if (filteredTeachers.length === 0) {
    teachersTableBody.innerHTML =
      '<tr><td colspan="6" class="no-data">Aucun enseignant ne correspond aux filtres.</td></tr>';
    updatePagination();
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  paginatedTeachers.forEach((teacher) => {
    // Get initials for avatar
    const firstInitial = teacher.firstName ? teacher.firstName.charAt(0) : "";
    const lastInitial = teacher.lastName ? teacher.lastName.charAt(0) : "";
    const initials = (firstInitial + lastInitial).toUpperCase();

    // Format creation date
    const creationDate = teacher.createdAt
      ? new Date(teacher.createdAt).toLocaleDateString("fr-FR")
      : "N/A";

    // Format email to handle long addresses
    const email = teacher.email || "N/A";
    // Determine section count badge
    const sectionCount = teacher.sectionCount || 0;
    const sectionBadgeClass =
      sectionCount > 0 ? "section-count-badge" : "section-count-badge empty";
    const sectionBadge =
      sectionCount > 0
        ? `<span class="${sectionBadgeClass}" title="${sectionCount} section(s) assignée(s)">${sectionCount}</span>`
        : `<span class="${sectionBadgeClass}" title="Aucune section assignée">0</span>`;
    // Set avatar class based on specialty
    let specialtyClass = "";
    if (teacher.specialty) {
      // Normalize the specialty name - remove accents, convert to lowercase
      specialtyClass = teacher.specialty
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ""); // Remove spaces

      // Handle specific specialty mappings if needed
      const specialtyMappings = {
        mathematiques: "mathematiques",
        maths: "mathematiques",
        info: "informatique",
        "computer science": "informatique",
      };

      if (specialtyMappings[specialtyClass]) {
        specialtyClass = specialtyMappings[specialtyClass];
      }
    }

    // Create the row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="teacher-info">
          <div class="teacher-avatar ${specialtyClass}">${initials}</div>
          <div class="teacher-details">
            <span class="teacher-name">${teacher.firstName || ""} ${
      teacher.lastName || "N/A"
    }</span>
            <span class="teacher-email">${email}</span>
          </div>
        </div>
      </td>      <td>${teacher.matricule || "Non défini"}</td>
      <td><span class="specialty-badge">${
        teacher.specialty || "Non spécifié"
      }</span> ${sectionBadge}</td>
      <td>${teacher.phone || "Non spécifié"}</td>
      <td>${creationDate}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-info btn-sm" data-id="${
            teacher.id
          }" title="Modifier cet enseignant">Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="openConfirmDeleteModal('${
            teacher.id
          }')" title="Supprimer cet enseignant">Supprimer</button>
        </div>
      </td>
    `;
    teachersTableBody.appendChild(row);
  });
  updatePagination();
}
