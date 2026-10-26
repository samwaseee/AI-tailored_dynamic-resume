import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { masterResume } from "../../../data/masterResume";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is missing.");
      return NextResponse.json(
        { error: "API key configuration missing on server" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { jobDescription } = await req.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Combine all available skills into a single list
    const categorySkills = masterResume.skills.categories
      ? masterResume.skills.categories.flatMap((cat) => cat.items)
      : [];

    const allAvailableSkills = Array.from(
      new Set([
        ...masterResume.skills.expertise,
        ...masterResume.skills.comfortable,
        ...masterResume.skills.familiar,
        ...categorySkills,
      ])
    );

    const prompt = `
You are an expert ATS resume optimizer.
Given a job description and a candidate's master profile, select the most relevant technical skills and top 2-3 projects that best match the job requirements.

Candidate Master Skills:
${JSON.stringify(allAvailableSkills)}

Candidate Available Projects (IDs and Tech stacks):
${JSON.stringify(
  masterResume.allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    technologies: p.technologies,
  }))
)}

Target Job Description:
${jobDescription}

Return a strictly formatted JSON object with:
1. "selectedSkills": An ordered array of relevant technical skills from the master list.
2. "selectedProjectIds": An array of project IDs in order of relevance (maximum 3).
`;

    // Fallback model list if the primary model hits 503 high demand
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash"];
    let responseText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                selectedSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                selectedProjectIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["selectedSkills", "selectedProjectIds"],
            },
          },
        });

        responseText = response.text || "";
        if (responseText) break; // Successfully obtained response
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or unavailable (${err?.status || err?.message}). Trying fallback...`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All model fallback attempts failed.");
    }

    const parsed = JSON.parse(responseText || "{}");
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Tailoring error:", error);
    return NextResponse.json(
      { error: "Failed to process job description" },
      { status: 500 }
    );
  }
}