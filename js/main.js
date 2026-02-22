// Main Module
// Orchestrates module initialization and exposes functions to global scope for HTML handlers

import { switchTab } from "./tabManager.js";
import { calculate } from "./calculator.js";
import { initTimetableUpload, getTimetableData, getTimetableHoursBySubject, clearTimetableResults } from "./timetableUpload.js";

// Expose functions to window for inline HTML onclick handlers
window.switchTab = switchTab;
window.calculate = calculate;
window.getTimetableData = getTimetableData;
window.getTimetableHoursBySubject = getTimetableHoursBySubject;
window.useTimetableSchedule = useTimetableSchedule;
window.clearTimetableResults = clearTimetableResults;

// Function to use timetable schedule in the calculator
function useTimetableSchedule() {
  const timetableData = getTimetableData();
  if (!timetableData) {
    alert("No timetable data available. Please analyze a timetable first.");
    return;
  }

  // Pre-populate the total hours taken with the timetable's weekly hours
  const totalHoursWeekly = timetableData.totalWeeklyHours;
  
  if (totalHoursWeekly) {
    // Assuming 16-week semester
    const semesterHours = totalHoursWeekly * 16;
    
    document.getElementById("totalHoursTaken").value = semesterHours;
    
    // Switch to the attendance tab
    const attendanceTab = document.getElementById("attendance");
    const timetableTab = document.getElementById("timetable");
    const attendanceBtn = document.querySelector(".tabButton[onclick*=\"'attendance'\"]");
    
    if (attendanceTab && timetableTab && attendanceBtn) {
      timetableTab.classList.remove("active");
      attendanceTab.classList.add("active");
      
      document.querySelectorAll(".tabButton").forEach(btn => btn.classList.remove("active"));
      attendanceBtn.classList.add("active");
      
      // Focus on the hours attended input
      setTimeout(() => document.getElementById("totalHoursAttended").focus(), 100);
      alert(`Total hours for the semester set to ${semesterHours} (${totalHoursWeekly} hours/week × 16 weeks).\nNow enter your total hours attended.`);
    }
  }
}

// Initialize modules when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  initTimetableUpload();
});
