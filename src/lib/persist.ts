import {
  AchievementItem,
  CertificationItem,
  ExperienceItem,
  masterResume,
  MasterResumeData,
  Project,
  Publication,
  SectionKey,
} from "@/src/data/masterResume";

const DRAFT_KEY = "resume:draft:v1";
const STYLE_DEFAULT_KEY = "resume:style-default:v1";
const IMPORT_BASE_KEY = "resume:import-base:v1";

type ResumeStyleDefault = Pick<MasterResumeData, "styles" | "sections" | "sectionOrder">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readStorage(key: string): unknown {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function clearStorage(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function validStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validObjectArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function hasStringFields<T extends string>(
  value: Record<string, unknown>,
  fields: T[],
): value is Record<string, unknown> & Record<T, string> {
  return fields.every((field) => typeof value[field] === "string");
}

function isExperienceArray(value: unknown): value is ExperienceItem[] {
  return validObjectArray(value) && value.every(
    (item) =>
      hasStringFields(item, ["id", "role", "company", "location", "duration"]) &&
      validStringArray(item.bullets),
  );
}

function isProjectArray(value: unknown): value is Project[] {
  return validObjectArray(value) && value.every(
    (item) =>
      hasStringFields(item, ["id", "title", "subtitle"]) &&
      (item.hidden === undefined || typeof item.hidden === "boolean") &&
      isRecord(item.links) &&
      hasStringFields(item.links, ["live", "frontend", "backend"]) &&
      validStringArray(item.bullets),
  );
}

function isPublicationArray(value: unknown): value is Publication[] {
  return validObjectArray(value) && value.every(
    (item) =>
      hasStringFields(item, ["authors", "title", "venue", "doi"]) &&
      (item.id === undefined || typeof item.id === "string"),
  );
}

function isCertificationArray(value: unknown): value is CertificationItem[] {
  return validObjectArray(value) && value.every(
    (item) => hasStringFields(item, ["id", "name", "issuer", "date"]),
  );
}

function isAchievementArray(value: unknown): value is AchievementItem[] {
  return validObjectArray(value) && value.every(
    (item) => hasStringFields(item, ["id", "title", "details"]),
  );
}

const sectionKeys: SectionKey[] = [
  "profile",
  "skills",
  "experience",
  "projects",
  "education",
  "publications",
  "certifications",
  "achievements",
];

function isSectionOrder(value: unknown): value is SectionKey[] {
  return Array.isArray(value) && value.every(
    (key): key is SectionKey => sectionKeys.includes(key as SectionKey),
  );
}

export function withDefaults(saved: unknown): MasterResumeData {
  const data = isRecord(saved) ? saved : {};
  const personalInfo = isRecord(data.personalInfo) ? data.personalInfo : {};
  const skills = isRecord(data.skills) ? data.skills : {};
  const categories = Array.isArray(skills.categories)
    ? skills.categories.filter(
        (category): category is { label: string; items: string[] } =>
          isRecord(category) &&
          typeof category.label === "string" &&
          validStringArray(category.items),
      )
    : masterResume.skills.categories;
  const education = isRecord(data.education) ? data.education : {};

  return {
    ...masterResume,
    ...data,
    personalInfo: { ...masterResume.personalInfo, ...personalInfo },
    skills: {
      ...masterResume.skills,
      ...skills,
      expertise: validStringArray(skills.expertise) ? skills.expertise : masterResume.skills.expertise,
      comfortable: validStringArray(skills.comfortable) ? skills.comfortable : masterResume.skills.comfortable,
      familiar: validStringArray(skills.familiar) ? skills.familiar : masterResume.skills.familiar,
      categories,
    },
    experience: isExperienceArray(data.experience)
      ? data.experience
      : masterResume.experience,
    allProjects: isProjectArray(data.allProjects)
      ? data.allProjects
      : masterResume.allProjects,
    education: { ...masterResume.education, ...education },
    publications: isPublicationArray(data.publications)
      ? data.publications
      : masterResume.publications,
    certifications: isCertificationArray(data.certifications)
      ? data.certifications
      : masterResume.certifications,
    achievements: isAchievementArray(data.achievements)
      ? data.achievements
      : masterResume.achievements,
    sectionOrder: isSectionOrder(data.sectionOrder)
      ? data.sectionOrder
      : masterResume.sectionOrder,
    sections: {
      ...masterResume.sections,
      ...(isRecord(data.sections)
        ? Object.fromEntries(
            Object.entries(data.sections).filter(
              ([key, value]) => sectionKeys.includes(key as SectionKey) && typeof value === "boolean",
            ),
          )
        : {}),
    },
    styles: {
      ...masterResume.styles,
      ...(isRecord(data.styles) ? data.styles : {}),
    },
  };
}

export function parseImportedData(value: unknown): MasterResumeData {
  if (
    !isRecord(value) ||
    !isRecord(value.personalInfo) ||
    !hasStringFields(value.personalInfo, [
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
    !validStringArray(value.skills.expertise) ||
    !validStringArray(value.skills.comfortable) ||
    !validStringArray(value.skills.familiar) ||
    !Array.isArray(value.skills.categories) ||
    !value.skills.categories.every(
      (category) =>
        isRecord(category) &&
        typeof category.label === "string" &&
        validStringArray(category.items),
    ) ||
    !isExperienceArray(value.experience) ||
    !isProjectArray(value.allProjects) ||
    !isRecord(value.education) ||
    !hasStringFields(value.education, ["degree", "institution", "cgpa", "duration"]) ||
    !isPublicationArray(value.publications) ||
    !isCertificationArray(value.certifications) ||
    !isAchievementArray(value.achievements)
  ) {
    throw new Error("The imported resume data is incomplete or invalid.");
  }

  return withDefaults(value);
}

export function saveDraft(data: MasterResumeData): boolean {
  return writeStorage(DRAFT_KEY, data);
}

export function clearDraft(): boolean {
  return clearStorage(DRAFT_KEY);
}

export function saveImportBase(data: MasterResumeData): boolean {
  return writeStorage(IMPORT_BASE_KEY, data);
}

export function clearImportBase(): boolean {
  return clearStorage(IMPORT_BASE_KEY);
}

export function getImportBase(): MasterResumeData | null {
  const value = readStorage(IMPORT_BASE_KEY);
  if (!isRecord(value)) return null;

  try {
    return parseImportedData(value);
  } catch (error) {
    console.error("Unable to read the saved PDF import base:", error);
    return null;
  }
}

export function saveStyleDefault(data: MasterResumeData): boolean {
  const styleDefault: ResumeStyleDefault = {
    styles: data.styles,
    sections: data.sections,
    sectionOrder: data.sectionOrder,
  };
  return writeStorage(STYLE_DEFAULT_KEY, styleDefault);
}

export function getStyleDefault(): ResumeStyleDefault | null {
  const value = readStorage(STYLE_DEFAULT_KEY);
  if (!isRecord(value)) return null;

  return {
    styles: {
      ...masterResume.styles,
      ...(isRecord(value.styles) ? value.styles : {}),
    },
    sections: {
      ...masterResume.sections,
      ...(isRecord(value.sections) ? value.sections : {}),
    },
    sectionOrder: isSectionOrder(value.sectionOrder)
      ? value.sectionOrder
      : masterResume.sectionOrder,
  };
}

export function clearStyleDefault(): boolean {
  return clearStorage(STYLE_DEFAULT_KEY);
}

export function applyStyleDefault(
  base: MasterResumeData,
  options: { keepSections?: boolean } = {},
): MasterResumeData {
  const styleDefault = getStyleDefault();
  if (!styleDefault) return withDefaults(base);

  return {
    ...withDefaults(base),
    styles: styleDefault.styles,
    sections: options.keepSections ? base.sections : styleDefault.sections,
    sectionOrder: styleDefault.sectionOrder,
  };
}

export function parseImported(json: string): MasterResumeData {
  const parsed: unknown = JSON.parse(json);
  if (!isRecord(parsed)) {
    throw new Error("The imported file must contain a resume object.");
  }
  if (
    ("personalInfo" in parsed && !isRecord(parsed.personalInfo)) ||
    ("skills" in parsed && !isRecord(parsed.skills)) ||
    ("styles" in parsed && !isRecord(parsed.styles)) ||
    ("sections" in parsed && !isRecord(parsed.sections)) ||
    ("education" in parsed && !isRecord(parsed.education)) ||
    ("skills" in parsed &&
      (!isRecord(parsed.skills) ||
        (parsed.skills.expertise !== undefined && !validStringArray(parsed.skills.expertise)) ||
        (parsed.skills.comfortable !== undefined && !validStringArray(parsed.skills.comfortable)) ||
        (parsed.skills.familiar !== undefined && !validStringArray(parsed.skills.familiar)) ||
        (parsed.skills.categories !== undefined &&
          (!Array.isArray(parsed.skills.categories) ||
            !parsed.skills.categories.every(
              (category) =>
                isRecord(category) &&
                typeof category.label === "string" &&
                validStringArray(category.items),
            ))))) ||
    ("experience" in parsed && !isExperienceArray(parsed.experience)) ||
    ("allProjects" in parsed && !isProjectArray(parsed.allProjects)) ||
    ("publications" in parsed && !isPublicationArray(parsed.publications)) ||
    ("certifications" in parsed && !isCertificationArray(parsed.certifications)) ||
    ("achievements" in parsed && !isAchievementArray(parsed.achievements)) ||
    ("sectionOrder" in parsed && !isSectionOrder(parsed.sectionOrder))
  ) {
    throw new Error("The imported resume contains invalid data.");
  }
  return withDefaults(parsed);
}

export function loadInitial(): MasterResumeData {
  const draft = readStorage(DRAFT_KEY);
  if (isRecord(draft)) return withDefaults(draft);

  const importBase = getImportBase();
  if (importBase) return applyStyleDefault(importBase, { keepSections: true });

  return applyStyleDefault(masterResume);
}
