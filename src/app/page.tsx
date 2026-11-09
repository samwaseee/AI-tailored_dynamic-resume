"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ExperienceItem,
  masterResume,
  MasterResumeData,
  Project,
  SectionKey,
} from "@/src/data/masterResume";
import { ResumeDocument } from "@/src/components/ResumeDocument";
import {
  applyStyleDefault,
  clearDraft,
  clearStyleDefault,
  loadInitial,
  parseImported,
  saveDraft,
  saveStyleDefault,
} from "@/src/lib/persist";
import {
  Sparkles,
  Printer,
  Loader2,
  Edit3,
  Wand2,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from "lucide-react";

type SkillDrafts = {
  expertise: string;
  comfortable: string;
  familiar: string;
  categories: string[];
};

function syncSkillDrafts(data: MasterResumeData): SkillDrafts {
  return {
    expertise: data.skills.expertise.join(", "),
    comfortable: data.skills.comfortable.join(", "),
    familiar: data.skills.familiar.join(", "),
    categories: (data.skills.categories || []).map((category) => category.items.join(", ")),
  };
}

function moveItem<T>(arr: T[], index: number, direction: "up" | "down"): T[] {
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= arr.length || targetIndex < 0 || targetIndex >= arr.length) {
    return arr;
  }

  const moved = [...arr];
  [moved[index], moved[targetIndex]] = [moved[targetIndex], moved[index]];
  return moved;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "edit">("ai");
  const [skillDrafts, setSkillDrafts] = useState(() => syncSkillDrafts(masterResume));
  const [hydrated, setHydrated] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [tailorError, setTailorError] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const savedNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosaveRef = useRef(false);
  const undoSnapshotRef = useRef<MasterResumeData | null>(null);
  const [canUndoTailor, setCanUndoTailor] = useState(false);
  const [resumeData, setResumeData] = useState<MasterResumeData>(masterResume);
  const resumeDataRef = useRef(resumeData);

  useEffect(() => {
    resumeDataRef.current = resumeData;
  }, [resumeData]);

  const showSavedNotice = useCallback((message = "Saved") => {
    setSavedNotice(message);
    if (savedNoticeTimerRef.current) clearTimeout(savedNoticeTimerRef.current);
    savedNoticeTimerRef.current = setTimeout(() => setSavedNotice(""), 2000);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const initialData = loadInitial();
      setResumeData(initialData);
      setSkillDrafts(syncSkillDrafts(initialData));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      if (saveDraft(resumeData)) showSavedNotice();
      else console.error("Unable to save resume draft to local storage.");
    }, 400);
    return () => clearTimeout(timeout);
  }, [hydrated, resumeData, showSavedNotice]);

  useEffect(() => () => {
    if (savedNoticeTimerRef.current) clearTimeout(savedNoticeTimerRef.current);
  }, []);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${resumeData.personalInfo.name.replace(/\s+/g, '_')}_Resume`;
    window.print();
    document.title = originalTitle;
  };

  const handleTailor = async () => {
    if (!jobDescription.trim()) return;
    setTailorError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      if (!res.ok) {
        throw new Error("Unable to tailor the resume. Please try again.");
      }

      const data = await res.json();
      if (data.error) {
        setTailorError(
          typeof data.error === "string" ? data.error : "Unable to tailor the resume. Please try again.",
        );
        return;
      }

      const selectedSkills = Array.isArray(data.selectedSkills) &&
        data.selectedSkills.length > 0 &&
        data.selectedSkills.every((skill: unknown) => typeof skill === "string")
        ? new Set<string>(data.selectedSkills)
        : null;
      const selectedProjectIds = Array.isArray(data.selectedProjectIds) &&
        data.selectedProjectIds.length > 0 &&
        data.selectedProjectIds.every((id: unknown) => typeof id === "string")
        ? new Set<string>(data.selectedProjectIds)
        : null;
      const masterSkills = new Set([
        ...masterResume.skills.expertise,
        ...masterResume.skills.comfortable,
        ...masterResume.skills.familiar,
        ...(masterResume.skills.categories || []).flatMap((category) => category.items),
      ]);
      const keepSkill = (skill: string) =>
        !masterSkills.has(skill) || selectedSkills?.has(skill);
      const currentSkills = resumeDataRef.current.skills;
      const tailoredSkills = selectedSkills
        ? {
            ...currentSkills,
            expertise: currentSkills.expertise.filter(keepSkill),
            comfortable: currentSkills.comfortable.filter(keepSkill),
            familiar: currentSkills.familiar.filter(keepSkill),
            categories: currentSkills.categories?.map((category) => ({
              ...category,
              items: category.items.filter(keepSkill),
            })),
          }
        : null;

      if (tailoredSkills || selectedProjectIds) {
        undoSnapshotRef.current = structuredClone(resumeDataRef.current);
        setCanUndoTailor(true);
      }

      if (tailoredSkills) {
        setSkillDrafts({
          expertise: tailoredSkills.expertise.join(", "),
          comfortable: tailoredSkills.comfortable.join(", "),
          familiar: tailoredSkills.familiar.join(", "),
          categories: (tailoredSkills.categories || []).map((category) => category.items.join(", ")),
        });
      }

      setResumeData((prev) => {
        const newData = { ...prev };
        if (tailoredSkills) newData.skills = tailoredSkills;
        if (selectedProjectIds) {
          const masterProjectIds = new Set(masterResume.allProjects.map((project) => project.id));
          newData.allProjects = prev.allProjects.map((project) => ({
            ...project,
            hidden: masterProjectIds.has(project.id)
              ? !selectedProjectIds.has(project.id)
              : project.hidden,
          }));
        }
        return newData;
      });
    } catch (err) {
      console.error(err);
      setTailorError(
        err instanceof Error ? err.message : "Unable to tailor the resume. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const defaultOrder: SectionKey[] = [
      "profile",
      "skills",
      "experience",
      "projects",
      "education",
      "publications",
      "certifications",
      "achievements",
    ];

    setResumeData((prev) => ({
      ...prev,
      sectionOrder: moveItem(prev.sectionOrder || defaultOrder, index, direction),
    }));
  };

  const moveSkillCategory = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        categories: moveItem(prev.skills.categories || [], index, direction),
      },
    }));
    setSkillDrafts((prev) => ({
      ...prev,
      categories: moveItem(prev.categories, index, direction),
    }));
  };

  const moveExperience = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      experience: moveItem(prev.experience || [], index, direction),
    }));
  };

  const moveProject = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      allProjects: moveItem(prev.allProjects, index, direction),
    }));
  };

  const movePublication = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      publications: moveItem(prev.publications, index, direction),
    }));
  };

  const moveCertification = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      certifications: moveItem(prev.certifications || [], index, direction),
    }));
  };

  const moveAchievement = (index: number, direction: "up" | "down") => {
    setResumeData((prev) => ({
      ...prev,
      achievements: moveItem(prev.achievements || [], index, direction),
    }));
  };

  const handleSaveStyle = () => {
    if (saveStyleDefault(resumeData)) showSavedNotice("Style saved");
    else window.alert("Unable to save the style in this browser.");
  };

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showSavedNotice("Exported");
    } catch {
      window.alert("Unable to export the resume.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const importedData = parseImported(await file.text());
      undoSnapshotRef.current = null;
      setCanUndoTailor(false);
      setResumeData(importedData);
      setSkillDrafts(syncSkillDrafts(importedData));
      showSavedNotice("Imported");
    } catch (error) {
      console.error("Failed to import resume:", error);
      window.alert("Unable to import this file. Please select a valid resume JSON backup.");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Reset resume content to the master resume? Your saved style will be kept.")) return;
    if (!clearDraft()) window.alert("Unable to clear the saved resume draft.");
    undoSnapshotRef.current = null;
    setCanUndoTailor(false);
    const resetData = applyStyleDefault(masterResume);
    skipNextAutosaveRef.current = true;
    setResumeData(resetData);
    setSkillDrafts(syncSkillDrafts(resetData));
    showSavedNotice("Reset");
  };

  const handleUndoTailor = () => {
    const previousData = undoSnapshotRef.current;
    if (!previousData) return;

    undoSnapshotRef.current = null;
    setCanUndoTailor(false);
    setResumeData(previousData);
    setSkillDrafts(syncSkillDrafts(previousData));
  };

  const handleClearStyle = () => {
    if (clearStyleDefault()) showSavedNotice("Saved style cleared");
    else window.alert("Unable to clear the saved style.");
  };

  const updateProject = <K extends keyof Project>(idx: number, field: K, val: Project[K]) => {
    setResumeData((prev) => ({
      ...prev,
      allProjects: prev.allProjects.map((project, index) =>
        index === idx ? { ...project, [field]: val } : project,
      ),
    }));
  };

  const updateProjectLinksUrl = (idx: number, linkField: 'live' | 'frontend' | 'backend', urlVal: string) => {
    setResumeData((prev) => ({
      ...prev,
      allProjects: prev.allProjects.map((project, index) =>
        index === idx
          ? { ...project, links: { ...project.links, [linkField]: urlVal } }
          : project,
      ),
    }));
  };

  const addProject = () => {
    const newProj = {
      id: `project-${Date.now()}`,
      title: "New Project Title",
      subtitle: "Project Subtitle / Tech Stack Overview",
      links: { live: "", frontend: "", backend: "" },
      bullets: ["Describe a key achievement or feature implemented."],
      technologies: "Next.js, Tailwind CSS, TypeScript",
    };
    setResumeData({
      ...resumeData,
      allProjects: [...resumeData.allProjects, newProj],
    });
  };

  const deleteProject = (idx: number) => {
    const newProjects = resumeData.allProjects.filter((_, i) => i !== idx);
    setResumeData({
      ...resumeData,
      allProjects: newProjects,
    });
  };

  const updateExperience = <K extends keyof ExperienceItem>(
    idx: number,
    field: K,
    val: ExperienceItem[K],
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: (prev.experience || []).map((item, index) =>
        index === idx ? { ...item, [field]: val } : item,
      ),
    }));
  };

  const addExperience = () => {
    const newExpItem = {
      id: `exp-${Date.now()}`,
      role: "Job Title",
      company: "Company Name",
      location: "Location",
      duration: "Year - Year",
      bullets: ["Describe key responsibility or achievement."],
    };
    setResumeData({
      ...resumeData,
      experience: [...(resumeData.experience || []), newExpItem],
    });
  };

  const deleteExperience = (idx: number) => {
    const newExp = (resumeData.experience || []).filter((_, i) => i !== idx);
    setResumeData({
      ...resumeData,
      experience: newExp,
    });
  };

  const addPublication = () => {
    setResumeData((prev) => ({
      ...prev,
      publications: [
        ...(prev.publications || []),
        {
          id: `pub-${Date.now()}`,
          authors: "",
          title: "",
          venue: "",
          doi: "",
        },
      ],
    }));
  };

  const deletePublication = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      publications: prev.publications.filter((_, idx) => idx !== index),
    }));
  };

  const updateCertification = (idx: number, field: string, val: string) => {
    const newCerts = [...(resumeData.certifications || [])];
    newCerts[idx] = { ...newCerts[idx], [field]: val };
    setResumeData({ ...resumeData, certifications: newCerts });
  };

  const addCertification = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      name: "New Certification",
      issuer: "Issuing Organization",
      date: "2024",
    };
    setResumeData({
      ...resumeData,
      certifications: [...(resumeData.certifications || []), newCert],
    });
  };

  const deleteCertification = (idx: number) => {
    const newCerts = (resumeData.certifications || []).filter((_, i) => i !== idx);
    setResumeData({ ...resumeData, certifications: newCerts });
  };

  const updateAchievement = (idx: number, field: string, val: string) => {
    const newAch = [...(resumeData.achievements || [])];
    newAch[idx] = { ...newAch[idx], [field]: val };
    setResumeData({ ...resumeData, achievements: newAch });
  };

  const addAchievement = () => {
    const newAch = {
      id: `ach-${Date.now()}`,
      title: "Achievement Title / Platform",
      details: "Describe competition rank, rating, or open-source contribution details.",
    };
    setResumeData({
      ...resumeData,
      achievements: [...(resumeData.achievements || []), newAch],
    });
  };

  const deleteAchievement = (idx: number) => {
    const newAch = (resumeData.achievements || []).filter((_, i) => i !== idx);
    setResumeData({ ...resumeData, achievements: newAch });
  };

  const addSkillCategory = () => {
    const newCategories = [
      ...(resumeData.skills.categories || []),
      { label: "New Category", items: ["Skill 1", "Skill 2"] }
    ];
    setSkillDrafts((prev) => ({
      ...prev,
      categories: [...prev.categories, "Skill 1, Skill 2"],
    }));
    setResumeData({
      ...resumeData,
      skills: { ...resumeData.skills, categories: newCategories }
    });
  };

  const deleteSkillCategory = (cIdx: number) => {
    const newCategories = (resumeData.skills.categories || []).filter((_, i) => i !== cIdx);
    setSkillDrafts((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== cIdx),
    }));
    setResumeData({
      ...resumeData,
      skills: { ...resumeData.skills, categories: newCategories }
    });
  };

  const updatePublication = (idx: number, field: string, val: string) => {
    const newPubs = [...resumeData.publications];
    newPubs[idx] = { ...newPubs[idx], [field]: val };
    setResumeData({ ...resumeData, publications: newPubs });
  };

  const toggleSection = (sectionKey: keyof MasterResumeData['sections']) => {
    setResumeData({
      ...resumeData,
      sections: {
        ...resumeData.sections,
        [sectionKey]: !resumeData.sections[sectionKey]
      }
    });
  };

  const adjustSize = (key: keyof MasterResumeData['styles'], direction: 'inc' | 'dec', e: React.MouseEvent) => {
    e.stopPropagation();
    // Strict pixel sizes array matching your 12px default
    const sizes = ["text-[9px]", "text-[10px]", "text-[11px]", "text-[12px]", "text-[13px]", "text-[14px]", "text-[16px]"];
    const current = resumeData.styles[key] as string;
    let idx = sizes.indexOf(current);
    
    // If not found in the array, default to index 3 ("text-[12px]") to match your initial state
    if (idx === -1) idx = 3;

    if (direction === 'inc' && idx < sizes.length - 1) idx++;
    if (direction === 'dec' && idx > 0) idx--;

    setResumeData({
      ...resumeData,
      styles: { ...resumeData.styles, [key]: sizes[idx] }
    });
  };

  const inputClass = "p-2 text-xs border border-zinc-700 bg-zinc-900 text-zinc-100 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { 
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-zinc-800 flex flex-col xl:flex-row">
        {/* Control Panel */}
        <div className="w-full xl:w-125 shrink-0 flex flex-col border-b xl:border-b-0 xl:border-r border-zinc-800 bg-zinc-950 h-[80dvh] max-h-[850px] xl:h-screen xl:max-h-none xl:sticky xl:top-0 overflow-hidden print:hidden">

          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
            <h1 className="text-lg font-bold text-zinc-100">Resume Builder</h1>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-medium py-2 px-3 rounded-md transition">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-950">
            <button onClick={handleSaveStyle} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800">
              Save style
            </button>
            <button onClick={handleExport} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800">
              Export
            </button>
            <button onClick={() => importInputRef.current?.click()} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800">
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
              aria-label="Import resume JSON"
            />
            <button onClick={handleReset} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800">
              Reset
            </button>
            <button onClick={handleClearStyle} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800">
              Clear saved style
            </button>
            {savedNotice && <span role="status" className="text-[11px] text-emerald-400">{savedNotice}</span>}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 text-xs font-medium bg-zinc-950">
            <button onClick={() => setActiveTab("ai")} className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition ${activeTab === "ai" ? "text-blue-400 border-b-2 border-blue-500 bg-zinc-900/50" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}>
              <Wand2 className="w-3.5 h-3.5" /> AI Tailor
            </button>
            <button onClick={() => setActiveTab("edit")} className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition ${activeTab === "edit" ? "text-blue-400 border-b-2 border-blue-500 bg-zinc-900/50" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"}`}>
              <Edit3 className="w-3.5 h-3.5" /> Content Edit
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-zinc-950">
            {activeTab === "ai" ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-zinc-400">Paste the job description. The AI will cross-reference your master file to select the best skills and projects.</p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste Job Description..."
                  className={`w-full min-h-75 font-mono leading-relaxed resize-y ${inputClass}`}
                />
                <button
                  onClick={handleTailor}
                  disabled={!hydrated || loading || !jobDescription.trim()}
                  suppressHydrationWarning
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition border border-blue-500 shadow-lg shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Tailor Resume
                </button>
                {tailorError && (
                  <p role="alert" className="text-xs text-red-400">
                    {tailorError}
                  </p>
                )}
                <button
                  onClick={handleUndoTailor}
                  disabled={!canUndoTailor}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  Undo tailor
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">

                {/* Universal Font Style Selector */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Universal Font Style</span>
                  <select
                    value={resumeData.styles.fontFamily}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        styles: { ...resumeData.styles, fontFamily: e.target.value },
                      })
                    }
                    className="p-1.5 text-xs bg-zinc-950 border border-zinc-700 text-zinc-100 rounded focus:outline-none cursor-pointer"
                  >
                    <option value="font-sans">Inter (Modern Sans)</option>
                    <option value="font-serif">Lora (Editorial Serif)</option>
                    <option value="font-merriweather">Merriweather (Classic Serif)</option>
                    <option value="font-roboto">Roboto (Clean Sans)</option>
                    <option value="font-mono">Geist Mono (Code / Monospace)</option>
                  </select>
                </div>

                {/* Dynamic Section Layout & Ordering Panel */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
                    Section Layout & Order
                  </span>
                  <div className="space-y-1.5 pt-1 text-xs">
                    {(resumeData.sectionOrder || [
                      "profile",
                      "skills",
                      "experience",
                      "projects",
                      "education",
                      "publications",
                      "certifications",
                      "achievements",
                    ]).map((key, index) => {
                      const isVisible = resumeData.sections[key];
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-2 rounded border transition ${isVisible
                            ? "bg-blue-950/40 border-blue-600/50 text-blue-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500 line-through"
                            }`}
                        >
                          <button
                            onClick={() => toggleSection(key)}
                            className="flex items-center gap-1.5 capitalize font-medium hover:text-white"
                          >
                            {isVisible ? <Eye size={14} className="text-blue-400" /> : <EyeOff size={14} className="text-zinc-600" />}
                            {key}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={index === 0}
                              onClick={() => moveSection(index, "up")}
                              className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                              title="Move Up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              disabled={index === (resumeData.sectionOrder?.length || 8) - 1}
                              onClick={() => moveSection(index, "down")}
                              className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300"
                              title="Move Down"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Personal Info */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span>Personal & Links</span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 border-t border-zinc-800">
                    <input type="text" value={resumeData.personalInfo.name} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, name: e.target.value } })} className={inputClass} placeholder="Name" />
                    <input type="text" value={resumeData.personalInfo.title} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, title: e.target.value } })} className={inputClass} placeholder="Title" />
                    <input type="text" value={resumeData.personalInfo.phone} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, phone: e.target.value } })} className={inputClass} placeholder="Phone" />
                    <input type="text" value={resumeData.personalInfo.email} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, email: e.target.value } })} className={inputClass} placeholder="Email" />
                    <input type="text" value={resumeData.personalInfo.location} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, location: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="Location" />
                    <input type="text" value={resumeData.personalInfo.portfolioUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, portfolioUrl: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="Portfolio URL" />
                    <input type="text" value={resumeData.personalInfo.githubUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, githubUrl: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="GitHub URL" />
                    <input type="text" value={resumeData.personalInfo.linkedinUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, linkedinUrl: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="LinkedIn URL" />
                  </div>
                </details>

                {/* Profile Summary */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Profile Summary
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('summaryTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('summaryTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <textarea value={resumeData.profileSummary} onChange={(e) => setResumeData({ ...resumeData, profileSummary: e.target.value })} className={`w-full h-32 ${inputClass}`} />
                  </div>
                </details>

                {/* Skills */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Skills
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('skillsTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('skillsTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Display Format</span>
                      <select
                        value={resumeData.styles.skillsLayout || "tier"}
                        onChange={(e) => setResumeData({
                          ...resumeData,
                          styles: { ...resumeData.styles, skillsLayout: e.target.value as "tier" | "category" }
                        })}
                        className="p-1 text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-100 rounded focus:outline-none"
                      >
                        <option value="tier">Tiered (Expertise / Comfortable / Familiar)</option>
                        <option value="category">Categorized (Languages, Web Tech, etc.)</option>
                      </select>
                    </div>

                    {(resumeData.styles.skillsLayout || "tier") === "tier" ? (
                      <>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Expertise</span>
                          <input
                            type="text"
                            value={skillDrafts.expertise}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSkillDrafts((prev) => ({ ...prev, expertise: value }));
                              setResumeData((prev) => ({
                                ...prev,
                                skills: { ...prev.skills, expertise: value.split(",").map((skill) => skill.trim()).filter(Boolean) },
                              }));
                            }}
                            className={`w-full ${inputClass}`}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Comfortable</span>
                          <input
                            type="text"
                            value={skillDrafts.comfortable}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSkillDrafts((prev) => ({ ...prev, comfortable: value }));
                              setResumeData((prev) => ({
                                ...prev,
                                skills: { ...prev.skills, comfortable: value.split(",").map((skill) => skill.trim()).filter(Boolean) },
                              }));
                            }}
                            className={`w-full ${inputClass}`}
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Familiar</span>
                          <input
                            type="text"
                            value={skillDrafts.familiar}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSkillDrafts((prev) => ({ ...prev, familiar: value }));
                              setResumeData((prev) => ({
                                ...prev,
                                skills: { ...prev.skills, familiar: value.split(",").map((skill) => skill.trim()).filter(Boolean) },
                              }));
                            }}
                            className={`w-full ${inputClass}`}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <span className="text-[10px] text-zinc-500 block">Edit category labels and items (comma-separated):</span>
                        {(resumeData.skills.categories || []).map((cat, cIdx) => (
                          <div key={cIdx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-semibold text-zinc-400">Category #{cIdx + 1}</span>
                              <div className="flex items-center gap-1">
                                <button disabled={cIdx === 0} onClick={() => moveSkillCategory(cIdx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move category up">
                                  <ArrowUp size={13} />
                                </button>
                                <button disabled={cIdx === (resumeData.skills.categories?.length || 0) - 1} onClick={() => moveSkillCategory(cIdx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move category down">
                                  <ArrowDown size={13} />
                                </button>
                                <button
                                  onClick={() => deleteSkillCategory(cIdx)}
                                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={cat.label}
                                onChange={(e) => {
                                  const newCats = [...(resumeData.skills.categories || [])];
                                  newCats[cIdx].label = e.target.value;
                                  setResumeData({ ...resumeData, skills: { ...resumeData.skills, categories: newCats } });
                                }}
                                className={`w-full font-bold ${inputClass}`}
                                placeholder="Category Name"
                              />
                              <input
                                type="text"
                                value={skillDrafts.categories[cIdx] ?? cat.items.join(", ")}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSkillDrafts((prev) => ({
                                    ...prev,
                                    categories: prev.categories.map((items, index) => index === cIdx ? value : items),
                                  }));
                                  setResumeData((prev) => ({
                                    ...prev,
                                    skills: {
                                      ...prev.skills,
                                      categories: (prev.skills.categories || []).map((category, index) => (
                                        index === cIdx
                                          ? { ...category, items: value.split(",").map((skill) => skill.trim()).filter(Boolean) }
                                          : category
                                      )),
                                    },
                                  }));
                                }}
                                className={`w-full ${inputClass}`}
                                placeholder="Items (comma-separated)..."
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={addSkillCategory}
                          className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add New Category
                        </button>
                      </div>
                    )}
                  </div>
                </details>

                {/* Work Experience */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Work Experience
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('experienceTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('experienceTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-6 border-t border-zinc-800 bg-zinc-950">
                    {(resumeData.experience || []).map((exp, idx) => (
                      <div key={exp.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-zinc-400">Experience #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button disabled={idx === 0} onClick={() => moveExperience(idx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move experience up">
                              <ArrowUp size={13} />
                            </button>
                            <button disabled={idx === (resumeData.experience || []).length - 1} onClick={() => moveExperience(idx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move experience down">
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => deleteExperience(idx)}
                              className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={exp.role} onChange={(e) => updateExperience(idx, "role", e.target.value)} className={`${inputClass} font-bold text-white`} placeholder="Role Title" />
                          <input type="text" value={exp.company} onChange={(e) => updateExperience(idx, "company", e.target.value)} className={inputClass} placeholder="Company / Organization" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={exp.location} onChange={(e) => updateExperience(idx, "location", e.target.value)} className={inputClass} placeholder="Location" />
                          <input type="text" value={exp.duration} onChange={(e) => updateExperience(idx, "duration", e.target.value)} className={inputClass} placeholder="Duration (e.g. 2025 - Present)" />
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Bullet Points (One per line)</span>
                          <textarea
                            value={exp.bullets.join('\n')}
                            onChange={(e) => updateExperience(idx, "bullets", e.target.value.split('\n'))}
                            className={`w-full h-24 whitespace-pre-wrap ${inputClass}`}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addExperience}
                      className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Experience
                    </button>
                  </div>
                </details>

                {/* Projects */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Projects
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('projectTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('projectTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-6 border-t border-zinc-800 bg-zinc-950">
                    {resumeData.allProjects.map((project, idx) => (
                      <div key={project.id} className={`p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-3 ${project.hidden ? "opacity-50" : ""}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-zinc-400">Project #{idx + 1}</span>

                            {/* Input Mode Toggle Switch */}
                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5 text-[10px]">
                              <button
                                onClick={() => updateProject(idx, "inputMode", "list")}
                                className={`px-2 py-0.5 rounded transition ${(project.inputMode || "list") === "list"
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                              >
                                List
                              </button>
                              <button
                                onClick={() => updateProject(idx, "inputMode", "paragraph")}
                                className={`px-2 py-0.5 rounded transition ${project.inputMode === "paragraph"
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "text-zinc-400 hover:text-zinc-200"
                                  }`}
                              >
                                Paragraph
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateProject(idx, "hidden", !project.hidden)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                              title={project.hidden ? "Show project" : "Hide project"}
                              aria-label={project.hidden ? "Show project" : "Hide project"}
                            >
                              {project.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              {project.hidden ? "Show" : "Hide"}
                            </button>
                            <button disabled={idx === 0} onClick={() => moveProject(idx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move project up">
                              <ArrowUp size={13} />
                            </button>
                            <button disabled={idx === resumeData.allProjects.length - 1} onClick={() => moveProject(idx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move project down">
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => deleteProject(idx)}
                              className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={project.title} onChange={(e) => updateProject(idx, "title", e.target.value)} className={`${inputClass} font-bold text-white`} placeholder="Project Title" />
                          <input type="text" value={project.subtitle} onChange={(e) => updateProject(idx, "subtitle", e.target.value)} className={inputClass} placeholder="Subtitle" />
                        </div>

                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">Project Link URLs</span>
                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="text"
                              value={typeof project.links.live === 'string' ? project.links.live : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'live', e.target.value)}
                              className={inputClass}
                              placeholder="Live Site URL"
                            />
                            <input
                              type="text"
                              value={typeof project.links.frontend === 'string' ? project.links.frontend : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'frontend', e.target.value)}
                              className={inputClass}
                              placeholder="Frontend Repo URL"
                            />
                            <input
                              type="text"
                              value={typeof project.links.backend === 'string' ? project.links.backend : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'backend', e.target.value)}
                              className={inputClass}
                              placeholder="Backend Repo URL"
                            />
                          </div>
                        </div>

                        {/* Dynamic Description Input Box */}
                        {project.inputMode === "paragraph" ? (
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold block mb-1">Paragraph Description</span>
                            <textarea
                              value={project.description ?? project.bullets.join(" ")}
                              onChange={(e) => updateProject(idx, "description", e.target.value)}
                              className={`w-full h-28 ${inputClass}`}
                              placeholder="Enter detailed project paragraph..."
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-zinc-400 font-bold block mb-1">Bullet Points (One per line)</span>
                            <textarea
                              value={project.bullets.join('\n')}
                              onChange={(e) => updateProject(idx, "bullets", e.target.value.split('\n'))}
                              className={`w-full h-28 whitespace-pre-wrap ${inputClass}`}
                              placeholder="Enter bullet points..."
                            />
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Technologies</span>
                          <input type="text" value={project.technologies || ""} onChange={(e) => updateProject(idx, "technologies", e.target.value)} className={`w-full ${inputClass}`} placeholder="Tech stack..." />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addProject}
                      className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Project
                    </button>
                  </div>
                </details>

                {/* Education */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Education
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('educationTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('educationTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-800 bg-zinc-950">
                    <input type="text" value={resumeData.education.degree} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, degree: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="Degree" />
                    <input type="text" value={resumeData.education.institution} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, institution: e.target.value } })} className={`${inputClass} col-span-1 sm:col-span-2`} placeholder="Institution" />
                    <input type="text" value={resumeData.education.cgpa} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, cgpa: e.target.value } })} className={inputClass} placeholder="CGPA" />
                    <input type="text" value={resumeData.education.duration} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, duration: e.target.value } })} className={inputClass} placeholder="Duration" />
                  </div>
                </details>

                {/* Publications Section */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Publications
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('publicationTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('publicationTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-4 border-t border-zinc-800 bg-zinc-950">
                    {resumeData.publications.map((pub, idx) => (
                      <div key={pub.id ?? idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-3">
                        {/* Entry Header & Delete */}
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-zinc-400">Publication #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button disabled={idx === 0} onClick={() => movePublication(idx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move publication up">
                              <ArrowUp size={13} />
                            </button>
                            <button disabled={idx === resumeData.publications.length - 1} onClick={() => movePublication(idx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move publication down">
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => deletePublication(idx)}
                              className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Authors Field */}
                        <div>
                          <label className="text-[10px] text-zinc-400 font-bold block mb-1">Authors</label>
                          <input
                            type="text"
                            value={pub.authors}
                            onChange={(e) => updatePublication(idx, "authors", e.target.value)}
                            className={`w-full ${inputClass}`}
                            placeholder="e.g., S. R. Wasi, M. Mustari"
                          />
                        </div>

                        {/* Paper Title Field */}
                        <div>
                          <label className="text-[10px] text-zinc-400 font-bold block mb-1">Paper Title</label>
                          <input
                            type="text"
                            value={pub.title}
                            onChange={(e) => updatePublication(idx, "title", e.target.value)}
                            className={`w-full ${inputClass} font-semibold text-white`}
                            placeholder="e.g., Temporal-Decay Adaptive Federated Ensemble"
                          />
                        </div>

                        {/* Venue & DOI / URL Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold block mb-1">Conference / Journal Venue</label>
                            <input
                              type="text"
                              value={pub.venue}
                              onChange={(e) => updatePublication(idx, "venue", e.target.value)}
                              className={inputClass}
                              placeholder="e.g., IEEE QPAIN 2026"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold block mb-1">DOI / Direct Link</label>
                            <input
                              type="text"
                              value={pub.doi}
                              onChange={(e) => updatePublication(idx, "doi", e.target.value)}
                              className={inputClass}
                              placeholder="10.1109/... or https://doi.org/..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Entry Button */}
                    <button
                      onClick={addPublication}
                      className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Publication
                    </button>
                  </div>
                </details>

                {/* Certifications */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Certifications
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('certificationTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('certificationTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Section Title</span>
                      <select
                        value={resumeData.styles.certificationsTitle || "Certifications & Training"}
                        onChange={(e) => setResumeData({
                          ...resumeData,
                          styles: { ...resumeData.styles, certificationsTitle: e.target.value }
                        })}
                        className="p-1 text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-100 rounded focus:outline-none"
                      >
                        <option value="Certifications & Training">Certifications & Training</option>
                        <option value="Certifications & Licenses">Certifications & Licenses</option>
                        <option value="Certifications">Certifications</option>
                        <option value="Professional Training">Professional Training</option>
                      </select>
                    </div>

                    {(resumeData.certifications || []).map((cert, idx) => (
                      <div key={cert.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-zinc-400">Item #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button disabled={idx === 0} onClick={() => moveCertification(idx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move certification up">
                              <ArrowUp size={13} />
                            </button>
                            <button disabled={idx === (resumeData.certifications || []).length - 1} onClick={() => moveCertification(idx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move certification down">
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => deleteCertification(idx)}
                              className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        <input type="text" value={cert.name} onChange={(e) => updateCertification(idx, "name", e.target.value)} className={`w-full ${inputClass} font-bold text-white`} placeholder="Certification Name" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={cert.issuer} onChange={(e) => updateCertification(idx, "issuer", e.target.value)} className={inputClass} placeholder="Issuer" />
                          <input type="text" value={cert.date} onChange={(e) => updateCertification(idx, "date", e.target.value)} className={inputClass} placeholder="Date" />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addCertification}
                      className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Certification
                    </button>
                  </div>
                </details>

                {/* Achievements */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span className="flex items-center gap-2">
                      Achievements & Open Source
                      <span className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <button onClick={(e) => adjustSize('achievementTextSize', 'dec', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">-</button>
                        <span className="px-1 text-[9px] text-zinc-400">Size</span>
                        <button onClick={(e) => adjustSize('achievementTextSize', 'inc', e)} className="px-1.5 py-0.5 hover:bg-zinc-700 text-zinc-300 text-[10px]">+</button>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 space-y-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Section Title</span>
                      <select
                        value={resumeData.styles.achievementsTitle || "Competitive Programming & Open Source"}
                        onChange={(e) => setResumeData({
                          ...resumeData,
                          styles: { ...resumeData.styles, achievementsTitle: e.target.value }
                        })}
                        className="p-1 text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-100 rounded focus:outline-none"
                      >
                        <option value="Competitive Programming & Open Source">Competitive Programming & Open Source</option>
                        <option value="Competitions & Achievements">Competitions & Achievements</option>
                        <option value="Honors & Achievements">Honors & Achievements</option>
                        <option value="Open Source Contributions">Open Source Contributions</option>
                      </select>
                    </div>

                    {(resumeData.achievements || []).map((item, idx) => (
                      <div key={item.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-zinc-400">Item #{idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <button disabled={idx === 0} onClick={() => moveAchievement(idx, "up")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Up" aria-label="Move achievement up">
                              <ArrowUp size={13} />
                            </button>
                            <button disabled={idx === (resumeData.achievements || []).length - 1} onClick={() => moveAchievement(idx, "down")} className="p-1 hover:bg-zinc-800 disabled:opacity-30 rounded text-zinc-300" title="Move Down" aria-label="Move achievement down">
                              <ArrowDown size={13} />
                            </button>
                            <button
                              onClick={() => deleteAchievement(idx)}
                              className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        <input type="text" value={item.title} onChange={(e) => updateAchievement(idx, "title", e.target.value)} className={`w-full ${inputClass} font-bold text-white`} placeholder="Title" />
                        <textarea value={item.details} onChange={(e) => updateAchievement(idx, "details", e.target.value)} className={`w-full h-16 ${inputClass}`} placeholder="Details" />
                      </div>
                    ))}

                    <button
                      onClick={addAchievement}
                      className="w-full py-2.5 text-xs text-blue-400 font-semibold bg-blue-950/30 hover:bg-blue-900/50 rounded-lg border border-blue-900/50 flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Achievement
                    </button>
                  </div>
                </details>

              </div>
            )}
          </div>
        </div>

        {/* Live A4 Preview Panel */}
        <div className="flex-1 min-w-0 bg-zinc-800 flex items-start justify-start 2xl:justify-center p-3 sm:p-6 xl:p-12 overflow-auto">
          <ResumeDocument ref={printRef} data={resumeData} />
        </div>
      </main>
    </>
  );
}