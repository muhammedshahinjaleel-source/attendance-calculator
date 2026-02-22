// Constants
const MIN_CRITERIA = 75;
const COLOR_WARNING = "#d1bf35";
const COLOR_ERROR = "red";
const COLOR_SUCCESS = "green";

// DOM element cache
const elements = {
  displayP: document.getElementById("displayP"),
  displayHN: document.getElementById("displayHN"),
  displayHB: document.getElementById("displayHB"),
};

// Tab switching function
function switchTab(tabName) {
  const tabContents = document.querySelectorAll(".tabContent");
  const tabButtons = document.querySelectorAll(".tabButton");
  
  // Hide all tabs
  tabContents.forEach(tab => tab.classList.remove("active"));
  tabButtons.forEach(btn => btn.classList.remove("active"));
  
  // Show selected tab
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// Image preview for timetable upload
document.addEventListener("DOMContentLoaded", function() {
  const fileInput = document.getElementById("timetableUpload");
  if (fileInput) {
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const imagePreview = document.getElementById("imagePreview");
          imagePreview.innerHTML = `<img src="${event.target.result}" alt="Timetable Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// Static functions
function attendancePercentage(totalHoursTaken, totalHoursAttended) {
  return (totalHoursAttended / totalHoursTaken) * 100;
}

function bunkableHours(totalHours, totalHoursTaken, totalHoursAttended) {
  const hoursNotAttended = totalHoursTaken - totalHoursAttended;
  const totalBunkable = totalHours * 0.25;
  return totalBunkable - hoursNotAttended;
}

function needHours(totalHours, totalHoursTaken, totalHoursAttended) {
  let hoursNeeded = 0;
  let finalPercentage = (totalHoursAttended / totalHoursTaken) * 100;

  while (finalPercentage < MIN_CRITERIA && (totalHoursTaken + hoursNeeded) < totalHours) {
    hoursNeeded++;
    finalPercentage = (100 * (totalHoursAttended + hoursNeeded)) / (totalHoursTaken + hoursNeeded);
  }
  return hoursNeeded;
}

// Dynamic function
function calculate() {
  const selectionValue = document.getElementById("totalVsLeft").value;
  const totalHoursTaken = Number(document.getElementById("totalHoursTaken").value);
  const totalHoursAttended = Number(document.getElementById("totalHoursAttended").value);
  
  let totalHours, hoursLeft;
  
  if (selectionValue === "totalKnown") {
    totalHours = Number(document.getElementById("knownValue").value);
    hoursLeft = totalHours - totalHoursTaken;
  } else if (selectionValue === "leftKnown") {
    hoursLeft = Number(document.getElementById("knownValue").value);
    totalHours = hoursLeft + totalHoursTaken;
  }

  const attendancePercentageResult = attendancePercentage(totalHoursTaken, totalHoursAttended);
  const bunkableHoursResult = bunkableHours(totalHours, totalHoursTaken, totalHoursAttended);

  // Update attendance percentage
  elements.displayP.textContent = attendancePercentageResult.toFixed(2) + " %";

  // Update hours needed
  if (attendancePercentageResult < MIN_CRITERIA) {
    const hoursNeededResult = needHours(totalHours, totalHoursTaken, totalHoursAttended);
    if (hoursNeededResult < hoursLeft) {
      elements.displayHN.textContent = hoursNeededResult;
      elements.displayHN.style.color = COLOR_WARNING;
    } else {
      elements.displayHN.textContent = "You're cooked :( ";
      elements.displayHN.style.color = COLOR_ERROR;
    }
  } else {
    elements.displayHN.textContent = "You're all set! :) ";
    elements.displayHN.style.color = COLOR_SUCCESS;
  }

  // Update bunkable hours
  if (bunkableHoursResult > 0) {
    elements.displayHB.textContent = Math.floor(bunkableHoursResult);
    elements.displayHB.style.color = COLOR_WARNING;
  } else {
    elements.displayHB.textContent = "Don't even think about it :P";
    elements.displayHB.style.color = COLOR_ERROR;
  }
}