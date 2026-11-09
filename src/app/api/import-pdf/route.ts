import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const stringField = { type: Type.STRING };
const stringArray = { type: Type.ARRAY, items: stringField };

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: stringField,
        title: stringField,
        phone: stringField,
        location: stringField,
        email: stringField,
        portfolioUrl: stringField,
        githubUrl: stringField,
        linkedinUrl: stringField,
      },
      required: ["name", "title", "phone", "location", "email", "portfolioUrl", "githubUrl", "linkedinUrl"],
    },
    profileSummary: stringField,
    skills: {
      type: Type.OBJECT,
      properties: {
        expertise: stringArray,
        comfortable: stringArray,
        familiar: stringArray,
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { label: stringField, items: stringArray },
            required: ["label", "items"],
          },
        },
      },
      required: ["expertise", "comfortable", "familiar", "categories"],
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: stringField,
          company: stringField,
          location: stringField,
          duration: stringField,
          bullets: stringArray,
        },
        required: ["role", "company", "location", "duration", "bullets"],
      },
    },
    allProjects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: stringField,
          subtitle: stringField,
          links: {
            type: Type.OBJECT,
            properties: { live: stringField, frontend: stringField, backend: stringField },
            required: ["live", "frontend", "backend"],
          },
          bullets: stringArray,
          technologies: stringField,
        },
        required: ["title", "subtitle", "links", "bullets", "technologies"],
      },
    },
    education: {
      type: Type.OBJECT,
      properties: {
        degree: stringField,
        institution: stringField,
        cgpa: stringField,
        duration: stringField,
      },
      required: ["degree", "institution", "cgpa", "duration"],
    },
    publications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          authors: stringField,
          title: stringField,
          venue: stringField,
          doi: stringField,
        },
        required: ["authors", "title", "venue", "doi"],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: stringField, issuer: stringField, date: stringField },
        required: ["name", "issuer", "date"],
      },
    },
    achievements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { title: stringField, details: stringField },
        required: ["title", "details"],
      },
    },
  },
  required: [
    "personalInfo",
    "profileSummary",
    "skills",
    "experience",
    "allProjects",
    "education",
    "publications",
    "certifications",
    "achievements",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: unknown, fields: string[]): value is Record<string, string> {
  return isRecord(value) && fields.every((field) => typeof value[field] === "string");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeExtractedData(value: unknown) {
  if (
    !isRecord(value) ||
    !hasStrings(value.personalInfo, [
      "name",
      "title",
      "phone",
      "location",
      "email",
      "portfolioUrl",
      "githubUrl",
      "linkedinUrl",
    ]) ||
    typeof value.profileSummary !== "string" ||
    !isRecord(value.skills) ||
    !isStringArray(value.skills.expertise) ||
    !isStringArray(value.skills.comfortable) ||
    !isStringArray(value.skills.familiar) ||
    !Array.isArray(value.skills.categories) ||
    !value.skills.categories.every(
      (category) =>
        hasStrings(category, ["label"]) &&
        isStringArray(category.items),
    ) ||
    !Array.isArray(value.experience) ||
    !value.experience.every(
      (item) =>
        hasStrings(item, ["role", "company", "location", "duration"]) &&
        isStringArray(item.bullets),
    ) ||
    !Array.isArray(value.allProjects) ||
    !value.allProjects.every(
      (item) =>
        hasStrings(item, ["title", "subtitle", "technologies"]) &&
        isRecord(item.links) &&
        hasStrings(item.links, ["live", "frontend", "backend"]) &&
        isStringArray(item.bullets),
    ) ||
    !hasStrings(value.education, ["degree", "institution", "cgpa", "duration"]) ||
    !Array.isArray(value.publications) ||
    !value.publications.every((item) => hasStrings(item, ["authors", "title", "venue", "doi"])) ||
    !Array.isArray(value.certifications) ||
    !value.certifications.every((item) => hasStrings(item, ["name", "issuer", "date"])) ||
    !Array.isArray(value.achievements) ||
    !value.achievements.every((item) => hasStrings(item, ["title", "details"]))
  ) {
    throw new Error("Gemini returned incomplete resume data.");
  }

  const timestamp = Date.now();
  const normalizeLink = (link: string) => {
    const trimmed = link.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : "";
  };
  return {
    personalInfo: {
      ...value.personalInfo,
      portfolioUrl: normalizeLink(value.personalInfo.portfolioUrl),
      githubUrl: normalizeLink(value.personalInfo.githubUrl),
      linkedinUrl: normalizeLink(value.personalInfo.linkedinUrl),
    },
    profileSummary: value.profileSummary,
    skills: {
      ...value.skills,
      expertise: [],
      comfortable: [],
      familiar: [],
    },
    experience: value.experience.map((item, index) => ({
      ...item,
      id: `exp-${index}-${timestamp}`,
    })),
    allProjects: value.allProjects.map((item, index) => ({
      ...item,
      id: `project-${index}-${timestamp}`,
      links: {
        live: normalizeLink(item.links.live),
        frontend: normalizeLink(item.links.frontend),
        backend: normalizeLink(item.links.backend),
      },
    })),
    education: value.education,
    publications: value.publications.map((item, index) => ({
      ...item,
      id: `pub-${index}-${timestamp}`,
    })),
    certifications: value.certifications.map((item, index) => ({
      ...item,
      id: `cert-${index}-${timestamp}`,
    })),
    achievements: value.achievements.map((item, index) => ({
      ...item,
      id: `ach-${index}-${timestamp}`,
    })),
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "The uploaded file must be a PDF." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "The PDF must be 4 MB or smaller." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is missing.");
      return NextResponse.json(
        { error: "API key configuration missing on server" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.subarray(0, 4).toString("ascii") !== "%PDF") {
      return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 });
    }

    const prompt = `Extract resume information from the attached PDF into the required JSON schema.
Extract only what is written in the resume; do not invent or infer. Use "" or [] when missing. Keep wording as written.
Put ALL skills into categories using the headings written in the resume (use one category labelled 'Skills' if there are no headings). Always return expertise, comfortable and familiar as empty arrays; never rank or tier skills.
Do not include any IDs. For project link fields, keep only values beginning with http:// or https://; use an empty string for other values.`;
    const fileData = fileBuffer.toString("base64");
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash"];
    let responseText = "";
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "application/pdf", data: fileData } },
            ],
          }],
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
        });
        responseText = response.text || "";
        if (responseText) break;
      } catch (error) {
        console.warn(`Model ${modelName} failed during PDF import; trying fallback.`);
        lastError = error;
      }
    }

    if (!responseText) throw lastError || new Error("All model fallback attempts failed.");

    const extracted: unknown = JSON.parse(responseText);
    return NextResponse.json({ data: normalizeExtractedData(extracted) });
  } catch (error) {
    console.error("PDF import error:", error);
    return NextResponse.json(
      { error: "Failed to extract resume data from the PDF." },
      { status: 500 },
    );
  }
}
