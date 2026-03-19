// Timetable Upload Module
// Handles image upload, preview, and Gemini analysis for timetable

import { analyzeTimeTable } from "./geminiService.js";
import { parseTimetableData, formatTime12Hour, getBunkingStrategy } from "./timetableParser.js";

let currentTimetableData = null;
let currentImageBase64 = null;

export function initTimetableUpload() {
  const fileInput = document.getElementById("timetableUpload");
  const dropZone = document.getElementById("dropZone");
  
  if (fileInput) {
    // Handle file selection via file input
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          currentImageBase64 = event.target.result;
          const imagePreview = document.getElementById("imagePreview");
          imagePreview.innerHTML = `<img src="${event.target.result}" alt="Timetable Preview">`;
          
          // Show analyze button
          showAnalyzeButton();
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Make drop zone clickable to open file picker
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", function() {
      fileInput.click();
    });
    
    // Handle drag and drop
    dropZone.addEventListener("dragover", function(e) {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    
    dropZone.addEventListener("dragleave", function() {
      dropZone.classList.remove("drag-over");
    });
    
    dropZone.addEventListener("drop", function(e) {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        // Trigger change event
        const event = new Event("change", { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
  }
}

function showAnalyzeButton() {
  const uploadSection = document.getElementById("uploadSection");
  
  // Check if button already exists
  if (document.getElementById("analyzeButton")) {
    return;
  }
  
  const analyzeButton = document.createElement("button");
  analyzeButton.id = "analyzeButton";
  analyzeButton.className = "analyze-button";
  analyzeButton.textContent = "Analyze with Gemini";
  analyzeButton.onclick = handleAnalyzeClick;
  
  uploadSection.appendChild(analyzeButton);
}

async function handleAnalyzeClick() {
  if (!currentImageBase64) {
    alert("Please upload an image first");
    return;
  }

  // Show loading state
  const button = document.getElementById("analyzeButton");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Analyzing...";

  try {
    // Analyze the timetable using Gemini
    const geminiResponse = await analyzeTimeTable(currentImageBase64);
    
    // Parse and validate the response
    currentTimetableData = parseTimetableData(geminiResponse);
    
    // Display the parsed timetable
    displayTimetableResults(currentTimetableData);
    
  } catch (error) {
    console.error("Error analyzing timetable:", error);
    alert(`Error: ${error.message}`);
  } finally {
    // Restore button state
    button.textContent = originalText;
    button.disabled = false;
  }
}

function displayTimetableResults(timetableData) {
  let resultsSection = document.getElementById("timetableResults");
  
  // Create results section if it doesn't exist
  if (!resultsSection) {
    resultsSection = document.createElement("div");
    resultsSection.id = "timetableResults";
    resultsSection.className = "timetable-results";
    document.getElementById("timetableDiv").appendChild(resultsSection);
  }

  let html = `<div class="results-header"><h3>📅 Extracted Timetable</h3>`;
  
  if (timetableData.semester) {
    html += `<p class="semester-info">Semester: ${timetableData.semester}</p>`;
  }
  
  if (timetableData.totalWeeklyHours) {
    html += `<p class="total-hours">Total Weekly Hours: <strong>${timetableData.totalWeeklyHours}</strong></p>`;
  }
  
  html += `</div>`;

  // Display subjects in a table
  html += `<table class="timetable-table">
    <thead>
      <tr>
        <th>Subject</th>
        <th>Code</th>
        <th>Days</th>
        <th>Time</th>
        <th>Duration (hrs)</th>
        <th>Instructor</th>
        <th>Room</th>
      </tr>
    </thead>
    <tbody>`;

  timetableData.subjects.forEach(subject => {
    const timeDisplay = subject.startTime && subject.endTime 
      ? `${formatTime12Hour(subject.startTime)} - ${formatTime12Hour(subject.endTime)}`
      : "N/A";
    
    html += `<tr>
      <td>${subject.subjectName}</td>
      <td>${subject.subjectCode || "-"}</td>
      <td>${subject.days.join(", ") || "-"}</td>
      <td>${timeDisplay}</td>
      <td>${subject.duration || "-"}</td>
      <td>${subject.instructor || "-"}</td>
      <td>${subject.room || "-"}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  // Add errors if any
  if (timetableData.errors && timetableData.errors.length > 0) {
    html += `<div class="parsing-errors">
      <h4>⚠️ Warnings:</h4>
      <ul>${timetableData.errors.map(err => `<li>${err}</li>`).join("")}</ul>
    </div>`;
  }

  // Add notes if any
  if (timetableData.notes) {
    html += `<div class="timetable-notes"><p><strong>Notes:</strong> ${timetableData.notes}</p></div>`;
  }

  // Add action buttons
  html += `<div class="action-buttons">
    <button class="use-schedule-button" onclick="window.useTimetableSchedule()">Use This Schedule</button>
    <button class="clear-storage-button" onclick="window.clearTimetableResults()">Clear Results</button>
  </div>`;

  resultsSection.innerHTML = html;
}

export function getTimetableData() {
  return currentTimetableData;
}

export function getTimetableHoursBySubject() {
  if (!currentTimetableData) return {};
  
  const hoursBySubject = {};
  currentTimetableData.subjects.forEach(subject => {
    if (hoursBySubject[subject.subjectName]) {
      hoursBySubject[subject.subjectName] += subject.duration;
    } else {
      hoursBySubject[subject.subjectName] = subject.duration;
    }
  });
  
  return hoursBySubject;
}

export function clearTimetableResults() {
  currentTimetableData = null;
  const resultsSection = document.getElementById("timetableResults");
  if (resultsSection) {
    resultsSection.remove();
  }
}
