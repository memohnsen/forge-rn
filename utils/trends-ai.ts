type TrendsPromptInput = {
  checkIns: unknown[];
  sessionReports: unknown[];
  compReports: unknown[];
  ouraSleepData: unknown[];
  whoopData: unknown[];
};

const stringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const buildTrendsPrompt = ({
  checkIns,
  sessionReports,
  compReports,
  ouraSleepData,
  whoopData,
}: TrendsPromptInput) => {
  return `Task: You are a sports data analyst specializing in Olympic Weightlifting and Powerlifting. You specialize in finding trends in large amounts of data. The following is the data we have on the athlete, I need you to analyze the data and find possible trends and return a response that will instruct the athlete on your findings. You are receiving data for an athlete's pre-lift check-ins, post-lift check-ins, and meet reflections. You should begin your process by matching the data and ordering by date to get a clear trend across the individual.

Data Type: Daily check-in data performed prior to their lifting session. The overall score is a function of the physical and mental scores which are functions of the other 1-5 scale scores. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc. The only time this isn't the case is for soreness, 1 is none, 5 is extreme.

Data: ${stringify(checkIns)}

Data Type: Post-session reflection data after each lifting session. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc. The only time this isn't the case is for how hard was the session, 1 is easy, 5 is very hard.

Data: ${stringify(sessionReports)}

Data Type: Post-competition reflection data. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc.

Data: ${stringify(compReports)}

Data Type: Oura Ring wearable device data.

Data: ${stringify(ouraSleepData)}

Data Type: WHOOP wearable device data. Recovery score (0-100%), sleep duration (hours), sleep performance (0-100%), strain score (0-21), HRV (milliseconds), resting heart rate (bpm).

Data: ${stringify(whoopData)}
            
Response Format:
- No emojis
- Do not include any greetings, get straight to the data
- 250 words or less
- No more than 4 sentences per section
- Write as plain text, with each section of data formatted with an asterik to mark it as a bullet point
- Do not include any recommendations or draw conclusions, only comment on trends
`;
};
