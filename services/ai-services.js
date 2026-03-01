require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function summarizeMedicalReport(reportText) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user", 
        content: `Summarize this medical report in 3 bullet points and give risk level (Low/Medium/High):\n\n${reportText}`
      }]
    });
    return completion.choices[0].message.content;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Test with sample
(async () => {
  const sampleReport = "Patient John Doe, age 45, BP 160/95, HR 85, chest pain since 2 hours, ECG abnormal.";
  const summary = await summarizeMedicalReport(sampleReport);
  console.log("AI Medical Summary:");
  console.log(summary);
})();
