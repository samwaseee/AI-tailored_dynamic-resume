"use client";

import React, { forwardRef } from "react";
import { MasterResumeData } from "@/src/data/masterResume";
import { Phone, MapPin, Mail, Globe } from "lucide-react";
import { AppWindow, Server } from "lucide-react";

// --- Custom SVG Icons to replace the missing Lucide brand icons ---
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
// ----------------------------------------------------------------

interface ResumeDocumentProps {
  data: MasterResumeData;
}

export const ResumeDocument = forwardRef<HTMLDivElement, ResumeDocumentProps>(
  ({ data }, ref) => {
    const s = data.styles;

    return (
      <div
        ref={ref}
        className={`w-[210mm] h-[297mm] overflow-hidden bg-white text-gray-900 p-15 shadow-md print:shadow-none print:w-[210mm] print:h-[297mm] ${s.fontFamily} leading-snug`}
        style={{ boxSizing: "border-box" }}
      >
        {/* Header */}
        <header className="border-b-2 border-gray-800 pb-2 mb-3">
          <h1 className={`${s.nameSize} ${s.nameBold ? "font-bold" : "font-normal"} uppercase tracking-wide text-gray-950`}>{data.personalInfo.name}</h1>
          <p className="text-sm font-semibold text-gray-700 mt-1">{data.personalInfo.title}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-700 mt-1.5">
            <span className="flex items-center gap-1"><Phone size={11} strokeWidth={2.5} /> {data.personalInfo.phone}</span>
            <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={2.5} /> {data.personalInfo.location}</span>
            <span className="flex items-center gap-1"><Mail size={11} strokeWidth={2.5} /> {data.personalInfo.email}</span>
            <a href={data.personalInfo.portfolioUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><Globe size={11} strokeWidth={2.5} /> Portfolio</a>
            <a href={data.personalInfo.githubUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><GithubIcon size={11} /> Github</a>
            <a href={data.personalInfo.linkedinUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline cursor-pointer text-gray-900"><LinkedinIcon size={11} /> Linkedin</a>
          </div>
        </header>

        {/* Profile */}
        <section className="mb-3">
          <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1.5`}>
            Profile
          </h2>
          <p className={`${s.summaryTextSize} text-gray-800 text-justify px-2`}>
            {data.profileSummary}
          </p>
        </section>

        {/* Skills */}
        <section className="mb-5">
          <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-2`}>
            Skills
          </h2>
          <div className={`px-2 space-y-1.5 ${s.skillsTextSize}`}>

            {data.skills.expertise.length > 0 && (
              <div className="grid grid-cols-[85px_repeat(7,1fr)] items-start gap-y-1">
                <span className="font-bold text-gray-900">Expertise</span>
                {data.skills.expertise.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 font-medium text-gray-700 whitespace-nowrap">
                    <span className="text-[12px] leading-none text-gray-400">•</span> {skill}
                  </span>
                ))}
              </div>
            )}

            {data.skills.comfortable.length > 0 && (
              <div className="grid grid-cols-[85px_repeat(7,1fr)] items-start gap-y-1">
                <span className="font-bold text-gray-900">Comfortable</span>
                {data.skills.comfortable.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 font-medium text-gray-700 whitespace-nowrap">
                    <span className="text-[12px] leading-none text-gray-400">•</span> {skill}
                  </span>
                ))}
              </div>
            )}

            {data.skills.familiar.length > 0 && (
              <div className="grid grid-cols-[85px_repeat(7,1fr)] items-start gap-y-1">
                <span className="font-bold text-gray-900">Familiar</span>
                {data.skills.familiar.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 font-medium text-gray-700 whitespace-nowrap">
                    <span className="text-[12px] leading-none text-gray-400">•</span> {skill}
                  </span>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Projects */}
        <section className="mb-5">
          <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-2`}>
            Projects
          </h2>
          <div className={`px-2 space-y-4 ${s.projectTextSize}`}>
            {data.allProjects.map((project) => (
              <div key={project.id}>

                {/* Top Row: Title & Icons on the left, Subtitle on the right */}
                <div className="flex justify-between items-center mb-1">

                  {/* Left Group: Title + Link Icons */}
                  <div className="flex items-center gap-3">
                    <span className={`${s.projectTitleBold ? "font-bold" : "font-normal"} text-gray-900 text-[13px]`}>{project.title}</span>

                    <div className="flex items-center gap-2.5 text-[10px] font-semibold">
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

                  {/* Right Group: Subtitle */}
                  <span className="text-gray-700 italic text-[11px] whitespace-nowrap ml-4">
                    {project.subtitle}
                  </span>

                </div>

                <ul className="list-disc list-outside ml-3 text-gray-800 space-y-1 leading-relaxed mt-1">
                  {project.bullets.map((b, idx) => (
                    <li key={idx} className="pl-1">{b}</li>
                  ))}
                </ul>
                {project.technologies && (
                  <p className="text-[10px] text-gray-700 mt-1.5">
                    <span className="font-bold text-gray-900">Technologies: </span>{project.technologies}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="mb-3">
          <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1.5`}>
            Education
          </h2>
          <div className={`px-2 flex justify-between items-start ${s.educationTextSize}`}>
            <div>
              <p className={`${s.educationTitleBold ? "font-bold" : "font-normal"} text-[12px] text-gray-900`}>{data.education.degree}</p>
              <p className="text-gray-800">{data.education.institution}</p>
              <p className="text-gray-700">CGPA: {data.education.cgpa}</p>
            </div>
            <span className="font-medium text-gray-700">{data.education.duration}</span>
          </div>
        </section>

        {/* Publications */}
        <section>
          <h2 className={`${s.sectionTitleSize} ${s.sectionTitleBold ? "font-bold" : "font-normal"} uppercase tracking-wider text-gray-900 ${s.sectionTitleBg} px-2 py-0.5 mb-1.5`}>
            Publications
          </h2>
          <ul className={`px-2 list-disc list-outside ml-3 text-gray-800 space-y-1 ${s.publicationTextSize}`}>
            {data.publications.map((pub, idx) => (
              <li key={idx} className="pl-1">
                {pub.authors}, "{pub.title}," <span className="italic">{pub.venue}</span>. DOI: {pub.doi}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }
);

ResumeDocument.displayName = "ResumeDocument";