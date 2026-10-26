"use client";

import { useState, useRef } from "react";
import { masterResume, MasterResumeData } from "@/src/data/masterResume";
import { ResumeDocument } from "@/src/components/ResumeDocument";
import { Sparkles, Printer, Loader2, Edit3, Wand2, ChevronDown, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "edit">("ai");

  const [resumeData, setResumeData] = useState<MasterResumeData>(masterResume);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${resumeData.personalInfo.name.replace(/\s+/g, '_')}_Resume`;
    window.print();
    document.title = originalTitle;
  };

  const handleTailor = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await res.json();

      setResumeData((prev) => {
        const newData = { ...prev };
        if (data.selectedSkills) {
          newData.skills = {
            ...newData.skills,
            expertise: masterResume.skills.expertise.filter(s => data.selectedSkills.includes(s)),
            comfortable: masterResume.skills.comfortable.filter(s => data.selectedSkills.includes(s)),
            familiar: masterResume.skills.familiar.filter(s => data.selectedSkills.includes(s)),
          };
        }
        if (data.selectedProjectIds) {
          const filtered = masterResume.allProjects.filter((p) => data.selectedProjectIds.includes(p.id));
          newData.allProjects = filtered.length > 0 ? filtered : masterResume.allProjects;
        }
        return newData;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = (idx: number, field: string, val: any) => {
    const newProjects = [...resumeData.allProjects];
    newProjects[idx] = { ...newProjects[idx], [field]: val };
    setResumeData({ ...resumeData, allProjects: newProjects });
  };

  const updateProjectLinksUrl = (idx: number, linkField: 'live' | 'frontend' | 'backend', urlVal: string) => {
    const newProjects = [...resumeData.allProjects];
    newProjects[idx].links = { ...newProjects[idx].links, [linkField]: urlVal };
    setResumeData({ ...resumeData, allProjects: newProjects });
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

  const addSkillCategory = () => {
    const newCategories = [
      ...(resumeData.skills.categories || []),
      { label: "New Category", items: ["Skill 1", "Skill 2"] }
    ];
    setResumeData({
      ...resumeData,
      skills: { ...resumeData.skills, categories: newCategories }
    });
  };

  const deleteSkillCategory = (cIdx: number) => {
    const newCategories = (resumeData.skills.categories || []).filter((_, i) => i !== cIdx);
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

  // Font size step adjuster function for +/- buttons
  const adjustSize = (key: keyof MasterResumeData['styles'], direction: 'inc' | 'dec', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents details accordion from toggling when clicking + / -
    const sizes = ["text-[9px]", "text-[10px]", "text-[11px]", "text-xs", "text-sm", "text-base"];
    const current = resumeData.styles[key] as string;
    let idx = sizes.indexOf(current);
    if (idx === -1) idx = 2; // default fallback

    if (direction === 'inc' && idx < sizes.length - 1) idx++;
    if (direction === 'dec' && idx > 0) idx--;

    setResumeData({
      ...resumeData,
      styles: { ...resumeData.styles, [key]: sizes[idx] }
    });
  };

  // Base classes for inputs to keep things dry
  const inputClass = "p-2 text-xs border border-zinc-700 bg-zinc-900 text-zinc-100 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-zinc-800 flex flex-col xl:flex-row">
        {/* Control Panel - DARK THEME */}
        <div className="w-full xl:w-120 flex flex-col border-r border-zinc-800 bg-zinc-950 h-screen print:hidden">

          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
            <h1 className="text-lg font-bold text-zinc-100">Resume Builder</h1>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-medium py-2 px-3 rounded-md transition">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
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
                  className={`w-full min-h-[300px] font-mono leading-relaxed resize-y ${inputClass}`}
                />
                <button onClick={handleTailor} disabled={loading || !jobDescription.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition border border-blue-500 shadow-lg shadow-blue-900/20">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Tailor Resume
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">

                {/* Universal Font Style Selector */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Universal Font Style</span>
                  <select
                    value={resumeData.styles.fontFamily}
                    onChange={(e) => setResumeData({ ...resumeData, styles: { ...resumeData.styles, fontFamily: e.target.value } })}
                    className="p-1.5 text-xs bg-zinc-950 border border-zinc-700 text-zinc-100 rounded focus:outline-none"
                  >
                    <option value="font-sans">Sans-Serif (Arial/Inter)</option>
                    <option value="font-serif">Serif (Times New Roman)</option>
                    <option value="font-mono">Monospace (Code)</option>
                  </select>
                </div>

                {/* Section Visibility Switches Panel */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">Section Visibility Switches</span>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    {Object.entries(resumeData.sections).map(([key, isVisible]) => (
                      <button
                        key={key}
                        onClick={() => toggleSection(key as keyof MasterResumeData['sections'])}
                        className={`flex items-center justify-between p-2 rounded border transition ${isVisible
                            ? 'bg-blue-950/40 border-blue-600/50 text-blue-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 line-through'
                          }`}
                      >
                        <span className="capitalize">{key}</span>
                        {isVisible ? <Eye size={14} className="text-blue-400" /> : <EyeOff size={14} className="text-zinc-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Info */}
                <details className="group border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between bg-zinc-900 px-4 py-3 font-semibold text-zinc-200 text-xs uppercase tracking-wider hover:bg-zinc-800 transition">
                    <span>Personal & Links</span>
                    <ChevronDown className="h-4 w-4 text-zinc-400 transition-transform group-open:-rotate-180" />
                  </summary>
                  <div className="p-4 grid grid-cols-2 gap-3 bg-zinc-950 border-t border-zinc-800">
                    <input type="text" value={resumeData.personalInfo.name} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, name: e.target.value } })} className={inputClass} placeholder="Name" />
                    <input type="text" value={resumeData.personalInfo.title} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, title: e.target.value } })} className={inputClass} placeholder="Title" />
                    <input type="text" value={resumeData.personalInfo.phone} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, phone: e.target.value } })} className={inputClass} placeholder="Phone" />
                    <input type="text" value={resumeData.personalInfo.email} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, email: e.target.value } })} className={inputClass} placeholder="Email" />
                    <input type="text" value={resumeData.personalInfo.location} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, location: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="Location" />
                    <input type="text" value={resumeData.personalInfo.portfolioUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, portfolioUrl: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="Portfolio URL" />
                    <input type="text" value={resumeData.personalInfo.githubUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, githubUrl: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="GitHub URL" />
                    <input type="text" value={resumeData.personalInfo.linkedinUrl} onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, linkedinUrl: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="LinkedIn URL" />
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

                    {/* Layout Selector Toggle */}
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
                          <input type="text" value={resumeData.skills.expertise.join(", ")} onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, expertise: e.target.value.split(",").map(s => s.trim()) } })} className={`w-full ${inputClass}`} />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Comfortable</span>
                          <input type="text" value={resumeData.skills.comfortable.join(", ")} onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, comfortable: e.target.value.split(",").map(s => s.trim()) } })} className={`w-full ${inputClass}`} />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Familiar</span>
                          <input type="text" value={resumeData.skills.familiar.join(", ")} onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, familiar: e.target.value.split(",").map(s => s.trim()) } })} className={`w-full ${inputClass}`} />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <span className="text-[10px] text-zinc-500 block">Edit category labels and items (comma-separated):</span>
                        {(resumeData.skills.categories || []).map((cat, cIdx) => (
                          <div key={cIdx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-semibold text-zinc-400">Category #{cIdx + 1}</span>
                              <button
                                onClick={() => deleteSkillCategory(cIdx)}
                                className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
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
                                placeholder="Category Name (e.g. Languages)"
                              />
                              <input
                                type="text"
                                value={cat.items.join(", ")}
                                onChange={(e) => {
                                  const newCats = [...(resumeData.skills.categories || [])];
                                  newCats[cIdx].items = e.target.value.split(",").map(s => s.trim());
                                  setResumeData({ ...resumeData, skills: { ...resumeData.skills, categories: newCats } });
                                }}
                                className={`w-full ${inputClass}`}
                                placeholder="Items (comma-separated)..."
                              />
                            </div>
                          </div>
                        ))}

                        {/* Add Category Button */}
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
                      <div key={project.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-zinc-400">Project #{idx + 1}</span>
                          <button
                            onClick={() => deleteProject(idx)}
                            className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 px-2 py-0.5 bg-red-950/40 rounded border border-red-900/40 transition"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={project.title} onChange={(e) => updateProject(idx, "title", e.target.value)} className={`${inputClass} font-bold text-white`} placeholder="Project Title" />
                          <input type="text" value={project.subtitle} onChange={(e) => updateProject(idx, "subtitle", e.target.value)} className={inputClass} placeholder="Subtitle" />
                        </div>

                        {/* Project Link URLs Inputs */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] text-zinc-400 font-bold block">Project Link URLs</span>
                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="text"
                              value={typeof project.links.live === 'string' ? project.links.live : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'live', e.target.value)}
                              className={inputClass}
                              placeholder="Live Site URL (https://...)"
                            />
                            <input
                              type="text"
                              value={typeof project.links.frontend === 'string' ? project.links.frontend : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'frontend', e.target.value)}
                              className={inputClass}
                              placeholder="Frontend Repo URL (https://github.com/...)"
                            />
                            <input
                              type="text"
                              value={typeof project.links.backend === 'string' ? project.links.backend : ''}
                              onChange={(e) => updateProjectLinksUrl(idx, 'backend', e.target.value)}
                              className={inputClass}
                              placeholder="Backend Repo URL (https://github.com/...)"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Bullet Points (One per line)</span>
                          <textarea
                            value={project.bullets.join('\n')}
                            onChange={(e) => updateProject(idx, "bullets", e.target.value.split('\n'))}
                            className={`w-full h-28 whitespace-pre-wrap ${inputClass}`}
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block mb-1">Technologies</span>
                          <input type="text" value={project.technologies || ""} onChange={(e) => updateProject(idx, "technologies", e.target.value)} className={`w-full ${inputClass}`} placeholder="Tech stack..." />
                        </div>
                      </div>
                    ))}

                    {/* Add Project Button */}
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
                  <div className="p-4 grid grid-cols-2 gap-3 border-t border-zinc-800 bg-zinc-950">
                    <input type="text" value={resumeData.education.degree} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, degree: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="Degree" />
                    <input type="text" value={resumeData.education.institution} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, institution: e.target.value } })} className={`${inputClass} col-span-2`} placeholder="Institution" />
                    <input type="text" value={resumeData.education.cgpa} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, cgpa: e.target.value } })} className={inputClass} placeholder="CGPA" />
                    <input type="text" value={resumeData.education.duration} onChange={(e) => setResumeData({ ...resumeData, education: { ...resumeData.education, duration: e.target.value } })} className={inputClass} placeholder="Duration" />
                  </div>
                </details>

                {/* Publications */}
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
                      <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm grid grid-cols-2 gap-2">
                        <input type="text" value={pub.authors} onChange={(e) => updatePublication(idx, "authors", e.target.value)} className={`${inputClass} col-span-2`} placeholder="Authors (e.g. S. R. Wasi et al.)" />
                        <input type="text" value={pub.title} onChange={(e) => updatePublication(idx, "title", e.target.value)} className={`${inputClass} col-span-2 font-semibold text-white`} placeholder="Paper Title" />
                        <input type="text" value={pub.venue} onChange={(e) => updatePublication(idx, "venue", e.target.value)} className={inputClass} placeholder="Venue (e.g. IEOM'25)" />
                        <input type="text" value={pub.doi} onChange={(e) => updatePublication(idx, "doi", e.target.value)} className={inputClass} placeholder="DOI" />
                      </div>
                    ))}
                  </div>
                </details>

                {/* Master Reset */}
                <div className="pt-4 pb-2">
                  <button onClick={() => setResumeData(masterResume)} className="w-full py-3 text-xs text-red-400 font-semibold bg-red-950/30 hover:bg-red-900/50 rounded-lg border border-red-900/50 transition">
                    Reset Everything to Master File
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Live Resume Preview Wrapper */}
        <div className="flex-1 py-10 flex justify-center items-start overflow-y-auto print:p-0 print:block">

          {/* Strict A4 Paper Container */}
          <div
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white overflow-hidden shadow-2xl print:shadow-none print:w-auto print:h-auto print:max-h-none print:min-h-0 relative"
          >
            <ResumeDocument ref={printRef} data={resumeData} />
          </div>

        </div>
      </main>
    </>
  );
}