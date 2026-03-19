// Tab Manager Module
// Handles switching between tabs in the UI

export function switchTab(tabName, event) {
  event.preventDefault();
  
  const tabContents = document.querySelectorAll(".tabContent");
  const tabButtons = document.querySelectorAll(".tabButton");
  
  // Hide all tabs and remove active state from buttons
  tabContents.forEach(tab => tab.classList.remove("active"));
  tabButtons.forEach(btn => btn.classList.remove("active"));
  
  // Show selected tab and mark button as active
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }
  
  // Mark the clicked button as active
  if (event.target && event.target.classList) {
    event.target.classList.add("active");
  }
}
