// Timetable Parser Module
// Parses and validates extracted timetable data

export function parseTimetableData(geminiResponse) {
  const timetable = {
    subjects: [],
    totalWeeklyHours: 0,
    semester: null,
    holidays: [],
    notes: null,
    errors: []
  };

  // Validate and process subjects
  if (geminiResponse.subjects && Array.isArray(geminiResponse.subjects)) {
    timetable.subjects = geminiResponse.subjects.map((subject, index) => {
      const processed = {
        id: `subject-${index}`,
        subjectName: subject.subjectName || "Unknown",
        subjectCode: subject.subjectCode || null,
        instructor: subject.instructor || null,
        days: subject.days || [],
        startTime: subject.startTime || null,
        endTime: subject.endTime || null,
        duration: subject.duration || calculateDuration(subject.startTime, subject.endTime),
        room: subject.room || null
      };
      
      // Validate time format
      if (!isValidTimeFormat(processed.startTime) || !isValidTimeFormat(processed.endTime)) {
        timetable.errors.push(`Subject ${index + 1} has invalid time format`);
      }
      
      return processed;
    });
  }

  // Process total weekly hours
  if (geminiResponse.totalWeeklyHours) {
    timetable.totalWeeklyHours = geminiResponse.totalWeeklyHours;
  } else {
    // Calculate from subjects if not provided
    timetable.totalWeeklyHours = calculateTotalHours(timetable.subjects);
  }

  timetable.semester = geminiResponse.semester || null;
  timetable.holidays = geminiResponse.holidays || [];
  timetable.notes = geminiResponse.notes || null;

  return timetable;
}

// Helper function to validate time format (HH:MM)
function isValidTimeFormat(time) {
  if (!time) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// Helper function to calculate duration between two times
export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  
  return (endTotalMin - startTotalMin) / 60;
}

// Helper function to calculate total weekly hours
export function calculateTotalHours(subjects) {
  if (!subjects || subjects.length === 0) return 0;
  
  let totalHours = 0;
  subjects.forEach(subject => {
    if (subject.duration) {
      totalHours += subject.duration;
    }
  });
  
  return totalHours;
}

// Format time as HH:MM AM/PM format
export function formatTime12Hour(time24) {
  if (!time24 || !isValidTimeFormat(time24)) return time24;
  
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Get bunking strategy based on current attendance
export function getBunkingStrategy(timetable, currentAttendancePercent, totalHoursAttended, totalHoursTaken) {
  const strategy = {
    canBunkHours: 0,
    bunkableClasses: [],
    recommendations: []
  };

  const MIN_ATTENDANCE = 75;
  
  // Calculate how many hours can be bunked while maintaining 75%
  const totalPossibleHours = totalHoursTaken + (timetable.totalWeeklyHours * 16); // Assuming 16-week semester
  const hoursAllowedToMiss = (totalPossibleHours * 0.25) - (totalHoursTaken - totalHoursAttended);
  
  strategy.canBunkHours = Math.max(0, hoursAllowedToMiss);

  // Identify which classes can be bunked based on hours available
  if (currentAttendancePercent >= MIN_ATTENDANCE && strategy.canBunkHours > 0) {
    strategy.bunkableClasses = timetable.subjects.filter(subject => 
      subject.duration <= strategy.canBunkHours
    ).map(subject => ({
      ...subject,
      riskLevel: calculateRiskLevel(currentAttendancePercent, subject.duration, totalHoursTaken)
    }));

    strategy.recommendations = [
      `You're at ${currentAttendancePercent.toFixed(2)}% attendance`,
      `You can safely bunk up to ${Math.floor(strategy.canBunkHours)} more hours`,
      `Consider bunking shorter classes first to minimize risk`,
      `Monitor your attendance after each bunk to ensure you stay above 75%`
    ];
  } else if (currentAttendancePercent < MIN_ATTENDANCE) {
    strategy.recommendations = [
      `You're at ${currentAttendancePercent.toFixed(2)}% attendance - BELOW 75%!`,
      `DO NOT BUNK any classes`,
      `You need to attend more classes to get back to 75%`
    ];
  } else {
    strategy.recommendations = [
      `You've used all your available bunking hours`,
      `Attending all remaining classes is essential`
    ];
  }

  return strategy;
}

// Calculate risk level for bunking a specific class
function calculateRiskLevel(attendancePercent, classDuration, totalHoursTaken) {
  const riskPercent = (classDuration / totalHoursTaken) * 100;
  
  if (riskPercent > 5) return "HIGH";
  if (riskPercent > 2) return "MEDIUM";
  return "LOW";
}
