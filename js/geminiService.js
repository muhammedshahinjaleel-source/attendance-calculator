// Gemini Service Module
// Handles communication with Google Gemini API for timetable analysis

const GEMINI_API_KEY = "AIzaSyBL7HNgV3akl4Vzk6Sk4rVudRtisWzZbP8";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert at analyzing academic timetables and schedules. 
When given an image of a timetable, extract ALL the following information in a structured JSON format:

{
  "subjects": [
    {
      "subjectName": "Subject Name",
      "subjectCode": "Code if visible",
      "instructor": "Instructor name if visible",
      "days": ["MON", "WED", "FRI"],
      "startTime": "09:00",
      "endTime": "10:30",
      "duration": 1.5,
      "room": "Room number if visible"
    }
  ],
  "totalWeeklyHours": 25,
  "semester": "Spring 2026",
  "holidays": ["2026-03-15", "2026-04-10"],
  "notes": "Any additional information"
}

Rules:
- Extract exact times from the timetable
- Calculate duration in hours (e.g., 1.5 for 90 minutes)
- Days should be uppercase 3-letter codes: MON, TUE, WED, THU, FRI, SAT, SUN
- If information is not visible, set to null or omit the field
- Be accurate and extract all classes/lectures visible
- Ensure times are in 24-hour format if possible, otherwise note the format
- totalWeeklyHours should be the sum of all class durations per week

Return ONLY the JSON object, no additional text.`;

export async function analyzeTimeTable(imageBase64) {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: SYSTEM_PROMPT
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] // Remove the data:image/jpeg;base64, prefix
            }
          },
          {
            text: "Please analyze this timetable and extract all information in the specified JSON format."
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 400) {
        throw new Error("Invalid API key or request format");
      } else if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`API Error: ${errorData.error?.message || "Unknown error"}`);
      }
    }

    const result = await response.json();
    
    // Extract the text content from the response
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
      const textContent = result.candidates[0].content.parts[0].text;
      
      // Parse JSON response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse timetable data from response");
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData;
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse timetable data: " + error.message);
    }
    throw error;
  }
}

export function setGeminiApiKey(apiKey) {
  // This allows the user to set the API key dynamically
  return apiKey;
}
