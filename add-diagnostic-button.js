// Script to add a technical diagnostic button
document.addEventListener("DOMContentLoaded", function () {
  // Create an advanced diagnostic button for technical debuging
  const advancedDiagBtn = document.createElement("button");
  advancedDiagBtn.textContent = "Diagnostic Technique";
  advancedDiagBtn.id = "tech-diagnostic-btn";
  advancedDiagBtn.style.marginLeft = "10px";
  advancedDiagBtn.style.backgroundColor = "#6c757d";
  advancedDiagBtn.style.color = "white";
  advancedDiagBtn.style.border = "none";
  advancedDiagBtn.style.padding = "8px 16px";
  advancedDiagBtn.style.borderRadius = "4px";
  advancedDiagBtn.style.cursor = "pointer";

  advancedDiagBtn.addEventListener("click", function () {
    console.log("Running technical diagnostics...");
    // Run the debugging script directly
    const script = document.createElement("script");
    script.src = "debug-groups.js";
    document.head.appendChild(script);
  });

  // Add the button next to the existing diagnostic button
  setTimeout(() => {
    const headerActions = document.querySelector(".header-actions");
    if (headerActions) {
      headerActions.appendChild(advancedDiagBtn);
      console.log("Technical diagnostic button added to the page");
    } else {
      console.error("Could not find .header-actions element");
    }
  }, 500);
});
