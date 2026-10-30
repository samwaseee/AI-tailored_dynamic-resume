"use client";

import React, { forwardRef } from "react";
import { MasterResumeData, SectionKey } from "@/src/data/masterResume";
import { Phone, MapPin, Mail, Globe, AppWindow, Server } from "lucide-react";

// --- Custom SVG Icons for GitHub and LinkedIn ---
const GithubIcon = ({ size = 11 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 11 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
// --------------------------------------------------

interface ResumeDocumentProps {
  data: MasterResumeData;
}

export const ResumeDocument = forwardRef<HTMLDivElement, ResumeDocumentProps>(
  ({ data }, ref) => {
    const s = data.styles;
    const sec = data.sections;

    const renderSection = (sectionKey: SectionKey) => {
      switch (sectionKey) {
        case "profile":
          return sec?.profile && data.profileSummary ? (
            <section key="profile" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                Profile
              </h2>
              <p className={`${s.summaryTextSize} text-gray-800 text-justify px-2`}>
                {data.profileSummary}
              </p>
            </section>
          ) : null;

        case "skills":
          return sec?.skills ? (
            <div key="skills" className="mb-2.5">
              <h2 className={`font-bold uppercase tracking-wider mb-1 ${s.sectionTitleSize} ${s.sectionTitleBg} px-2 py-0.5`}>
                Skills
              </h2>
              {(s.skillsLayout || "tier") === "tier" ? (
                <div className={`px-2 flex ${s.skillsTextSize}`}>
                  {/* Left Column: All Tier Titles */}
                  <div className="w-24 shrink-0 font-bold space-y-0.5">
                    {data.skills.expertise && data.skills.expertise.length > 0 && <div>Expertise</div>}
                    {data.skills.comfortable && data.skills.comfortable.length > 0 && <div>Comfortable</div>}
                    {data.skills.familiar && data.skills.familiar.length > 0 && <div>Familiar</div>}
                  </div>

                  {/* Right Column: All Bullet Lists */}
                  <div className="flex-1 text-zinc-700 space-y-0.5">
                    {data.skills.expertise && data.skills.expertise.length > 0 && (
                      <div>: {data.skills.expertise.join(" • ")}</div>
                    )}
                    {data.skills.comfortable && data.skills.comfortable.length > 0 && (
                      <div>: {data.skills.comfortable.join(" • ")}</div>
                    )}
                    {data.skills.familiar && data.skills.familiar.length > 0 && (
                      <div>: {data.skills.familiar.join(" • ")}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`px-2 flex ${s.skillsTextSize}`}>
                  {/* Left Column: All Category Titles */}
                  <div className="w-32 shrink-0 font-bold space-y-0.5">
                    {data.skills.categories?.map((cat, idx) => (
                      <div key={idx}>{cat.label}</div>
                    ))}
                  </div>

                  {/* Right Column: All Category Bullet Lists */}
                  <div className="flex-1 text-zinc-700 space-y-0.5">
                    {data.skills.categories?.map((cat, idx) => (
                      <div key={idx}>: {cat.items.join(", ")}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null;

        case "experience":
          return sec?.experience && data.experience && data.experience.length > 0 ? (
            <section key="experience" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                Work Experience
              </h2>
              <div className={`px-2 space-y-2 ${s.experienceTextSize || "text-[11px]"}`}>
                {data.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[11.5px] text-gray-900">
                        {exp.role} <span className="font-normal text-gray-700">| {exp.company}</span>
                      </span>
                      <span className="text-[10.5px] text-gray-700 font-medium">{exp.duration}</span>
                    </div>
                    <ul className="list-disc list-outside ml-3 text-gray-800 space-y-0.5 leading-relaxed mt-0.5">
                      {exp.bullets.map((b, idx) => (
                        <li key={idx} className="pl-1">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null;

        case "projects":
          return sec?.projects && data.allProjects && data.allProjects.length > 0 ? (
            <section key="projects" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                Projects
              </h2>
              <div className={`px-2 space-y-2.5 ${s.projectTextSize}`}>
                {data.allProjects.map((project) => (
                  <div key={project.id}>
                    {/* Header & Links */}
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-3">
                        <span className={`${s.projectTitleBold ? "font-bold" : "font-normal"} text-gray-900 text-[12px]`}>{project.title}</span>
                        <div className="flex items-center gap-2 text-[10px] font-semibold">
                          <a
                            href={typeof project.links.live === "string" && project.links.live ? project.links.live : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1 ${project.links.live ? 'text-blue-600 hover:underline' : 'text-gray-300 pointer-events-none'}`}
                          >
                            <Globe size={10} strokeWidth={2.5} /> Live site
                          </a>
                          <a
                            href={typeof project.links.frontend === "string" && project.links.frontend ? project.links.frontend : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1 ${project.links.frontend ? 'text-blue-600 hover:underline' : 'text-gray-300 pointer-events-none'}`}
                          >
                            <AppWindow size={10} strokeWidth={2.5} /> Frontend
                          </a>
                          <a
                            href={typeof project.links.backend === "string" && project.links.backend ? project.links.backend : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1 ${project.links.backend ? 'text-blue-600 hover:underline' : 'text-gray-300 pointer-events-none'}`}
                          >
                            <Server size={10} strokeWidth={2.5} /> Backend
                          </a>
                        </div>
                      </div>

                      <span className="text-gray-700 italic text-[10.5px] whitespace-nowrap ml-4">
                        {project.subtitle}
                      </span>
                    </div>

                    {/* Dual Mode Description: Paragraph vs List */}
                    {project.inputMode === "paragraph" ? (
                      <p className="text-gray-800 leading-relaxed mt-0.5 text-justify">
                        {project.description || project.bullets.join(" ")}
                      </p>
                    ) : (
                      <ul className="list-disc list-outside ml-3 text-gray-800 space-y-0.5 leading-relaxed mt-0.5">
                        {project.bullets.map((b, idx) => (
                          <li key={idx} className="pl-1">{b}</li>
                        ))}
                      </ul>
                    )}

                    {project.technologies && (
                      <p className="text-[10px] text-gray-700 mt-1">
                        <span className="font-bold text-gray-900">Technologies: </span>{project.technologies}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null;

        case "education":
          return sec?.education ? (
            <section key="education" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                Education
              </h2>
              <div className={`px-2 flex justify-between items-start ${s.educationTextSize}`}>
                <div>
                  <p className={`${s.educationTitleBold ? "font-bold" : "font-normal"} text-[11.5px] text-gray-900`}>{data.education.degree}</p>
                  <p className="text-gray-800">{data.education.institution}</p>
                  <p className="text-gray-700">CGPA: {data.education.cgpa}</p>
                </div>
                <span className="font-medium text-gray-700">{data.education.duration}</span>
              </div>
            </section>
          ) : null;

        case "publications":
          return sec?.publications && data.publications && data.publications.length > 0 ? (
            <section key="publications" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                Publications
              </h2>
              <ul className={`px-2 list-disc list-outside ml-3 text-gray-800 space-y-0.5 ${s.publicationTextSize}`}>
                {data.publications.map((pub, idx) => {
                  // Normalizes full URLs or raw DOI strings into a valid link href
                  const doiHref = pub.doi.startsWith("http")
                    ? pub.doi
                    : `https://doi.org/${pub.doi.replace(/^doi:\s*/i, "")}`;

                  return (
                    <li key={idx} className="pl-1">
                      {pub.authors}, "{pub.title}," <span className="italic">{pub.venue}</span>. DOI:{" "}
                      <a
                        href={doiHref}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline font-medium"
                      >
                        {pub.doi}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null;

        case "certifications":
          return sec?.certifications && data.certifications && data.certifications.length > 0 ? (
            <section key="certifications" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                {s.certificationsTitle || "Certifications & Training"}
              </h2>
              <div className={`px-2 space-y-0.5 ${s.certificationTextSize || "text-[12px]"}`}>
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-900">{cert.name}</span>
                      <span className="text-gray-700"> — {cert.issuer}</span>
                      {cert.credentialId && (
                        <span className="text-gray-500 text-[10px] ml-1.5">(ID: {cert.credentialId})</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 shrink-0 ml-2">{cert.date}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null;

        case "achievements":
          return sec?.achievements && data.achievements && data.achievements.length > 0 ? (
            <section key="achievements" className="mb-2.5">
              <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1`}>
                {s.achievementsTitle || "Competitive Programming & Open Source"}
              </h2>
              <ul className={`px-2 list-disc list-outside ml-3 text-gray-800 space-y-0.5 ${s.achievementTextSize || "text-[11px]"}`}>
                {data.achievements.map((item) => (
                  <li key={item.id} className="pl-1">
                    <span className="font-bold text-gray-900">{item.title}: </span>
                    <span>{item.details}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null;

        default:
          return null;
      }
    };

    const sectionOrder: SectionKey[] = data.sectionOrder || [
      "profile",
      "skills",
      "experience",
      "projects",
      "education",
      "publications",
      "certifications",
      "achievements",
    ];

    return (
      <div
        ref={ref}
        className={`w-[210mm] h-[297mm] shrink-0 bg-white text-gray-900 p-12 shadow-md print:shadow-none print:w-[210mm] print:h-[297mm] print:p-12 ${s.fontFamily} leading-snug`}
        style={{ boxSizing: "border-box" }}
      >
        {/* Header (Fixed at Top) */}
        <header className="border-b-2 border-gray-800 pb-2 mb-2.5">
          <h1 className={`${s.nameSize} ${s.nameBold ? "font-bold" : "font-normal"} uppercase tracking-wide text-gray-950`}>{data.personalInfo.name}</h1>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{data.personalInfo.title}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-700 mt-1">
            <span className="flex items-center gap-1"><Phone size={11} strokeWidth={2.5} /> {data.personalInfo.phone}</span>
            <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={2.5} /> {data.personalInfo.location}</span>
            <span className="flex items-center gap-1"><Mail size={11} strokeWidth={2.5} /> {data.personalInfo.email}</span>
            <a href={data.personalInfo.portfolioUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><Globe size={11} strokeWidth={2.5} /> Portfolio</a>
            <a href={data.personalInfo.githubUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><GithubIcon size={11} /> Github</a>
            <a href={data.personalInfo.linkedinUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><LinkedinIcon size={11} /> Linkedin</a>
          </div>
        </header>

        {/* Dynamic Section Ordering */}
        {sectionOrder.map((key) => renderSection(key))}
      </div>
    );
  }
);

ResumeDocument.displayName = "ResumeDocument";