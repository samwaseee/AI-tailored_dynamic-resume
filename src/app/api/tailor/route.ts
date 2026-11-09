import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

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
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { jobDescription, skills, projects } = body as {
      jobDescription?: unknown;
      skills?: unknown;
      projects?: unknown;
    };

    if (
      typeof jobDescription !== "string" ||
      !jobDescription.trim() ||
      typeof skills !== "object" ||
      skills === null ||
      Array.isArray(skills) ||
      !Array.isArray(projects)
    ) {
      return NextResponse.json(
        { error: "Job description, skills, and projects are required" },
        { status: 400 }
      );
    }

    const skillData = skills as {
      expertise?: unknown;
      comfortable?: unknown;
      familiar?: unknown;
      categories?: unknown;
    };
    const isStringArray = (value: unknown): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === "string");
    const categories = Array.isArray(skillData.categories)
      ? skillData.categories.filter(
          (category): category is { items: string[] } =>
            typeof category === "object" &&
            category !== null &&
            !Array.isArray(category) &&
            isStringArray((category as { items?: unknown }).items),
        )
      : [];
    const projectsForTailoring = projects.filter(
      (project): project is { id: string; title: string; technologies: string } =>
        typeof project === "object" &&
        project !== null &&
        !Array.isArray(project) &&
        typeof (project as { id?: unknown }).id === "string" &&
        typeof (project as { title?: unknown }).title === "string" &&
        typeof (project as { technologies?: unknown }).technologies === "string",
    );
    if (
      !isStringArray(skillData.expertise) ||
      !isStringArray(skillData.comfortable) ||
      !isStringArray(skillData.familiar) ||
      projectsForTailoring.length !== projects.length
    ) {
      return NextResponse.json({ error: "Invalid skills or project data" }, { status: 400 });
    }

    const allAvailableSkills = Array.from(
      new Set([
        ...skillData.expertise,
        ...skillData.comfortable,
        ...skillData.familiar,
        ...categories.flatMap((category) => category.items),
      ])
    );

    const prompt = `
You are an expert ATS resume optimizer.
Given a job description and the candidate's current resume, select the most relevant technical skills and top 2-3 projects that best match the job requirements.

Candidate Current Skills:
${JSON.stringify(allAvailableSkills)}

Candidate Available Projects (IDs and Tech stacks):
${JSON.stringify(projectsForTailoring)}

Target Job Description:
${jobDescription}

Return a strictly formatted JSON object with:
1. "selectedSkills": An ordered array of relevant technical skills from the provided list.
2. "selectedProjectIds": An array of project IDs in order of relevance (maximum 3).
`;

    // Fallback model list if the primary model hits 503 high demand
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash"];
    let responseText = "";
    let lastError: unknown = null;

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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Model ${modelName} failed or unavailable (${message}). Trying fallback...`);
        lastError = error;
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