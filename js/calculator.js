// Calculator Module
// Handles all attendance and bunking calculations

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

// Calculate attendance percentage
export function attendancePercentage(totalHoursTaken, totalHoursAttended) {
  return (totalHoursAttended / totalHoursTaken) * 100;
}

// Calculate bunkable hours (hours you can skip without dropping below 75%)
export function bunkableHours(totalHours, totalHoursTaken, totalHoursAttended) {
  const hoursNotAttended = totalHoursTaken - totalHoursAttended;
  const totalBunkable = totalHours * 0.25;
  return totalBunkable - hoursNotAttended;
}

// Calculate hours needed to reach 75% attendance
export function needHours(totalHours, totalHoursTaken, totalHoursAttended) {
  let hoursNeeded = 0;
  let finalPercentage = (totalHoursAttended / totalHoursTaken) * 100;

  while (finalPercentage < MIN_CRITERIA && (totalHoursTaken + hoursNeeded) < totalHours) {
    hoursNeeded++;
    finalPercentage = (100 * (totalHoursAttended + hoursNeeded)) / (totalHoursTaken + hoursNeeded);
  }
  return hoursNeeded;
}

// Main calculation function - orchestrates all calculations
export function calculate() {
  const selectionValue = document.getElementById("totalVsLeft").value;
  const totalHoursTaken = Number(document.getElementById("totalHoursTaken").value);
  const totalHoursAttended = Number(document.getElementById("totalHoursAttended").value);
  
  // Input validation
  if (!totalHoursTaken || isNaN(totalHoursTaken) || isNaN(totalHoursAttended)) {
    alert("Please enter valid numbers for total hours taken/attended.");
    return;
  }
  
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
