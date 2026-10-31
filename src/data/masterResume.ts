export interface Project {
  id: string;
  title: string;
  subtitle: string;
  links: { live: string; frontend: string; backend: string };
  inputMode?: "list" | "paragraph";
  description?: string;
  bullets: string[];
  technologies?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  duration: string;
  bullets: string[];
}

export interface Publication {
  authors: string;
  title: string;
  venue: string;
  doi: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  url?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  details: string;
  link?: string;
}

export type SectionKey =
  | "profile"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "publications"
  | "certifications"
  | "achievements";

export interface ResumeSectionsVisibility {
  profile: boolean;
  skills: boolean;
  experience: boolean;
  projects: boolean;
  education: boolean;
  publications: boolean;
  certifications: boolean;
  achievements: boolean;
}

export interface ResumeStyles {
  fontFamily: string; // e.g. "font-sans", "font-serif", "font-mono"
  nameSize: string; // e.g. "text-2xl", "text-3xl", "text-4xl"
  nameBold: boolean;

  sectionTitleSize: string; // e.g. "text-xs", "text-sm", "text-base"
  sectionTitleBold: boolean;
  sectionTitleBg: string; // e.g. "bg-gray-200"

  skillsLayout: "tier" | "category";

  certificationsTitle: string;
  achievementsTitle: string;

  // Body text sizes
  summaryTextSize: string;
  skillsTextSize: string;
  experienceTextSize: string;
  projectTextSize: string;
  educationTextSize: string;
  publicationTextSize: string;
  certificationTextSize: string;
  achievementTextSize: string;

  projectTitleBold: boolean;
  educationTitleBold: boolean;
}

export interface MasterResumeData {
  personalInfo: {
    name: string;
    title: string;
    phone: string;
    location: string;
    email: string;
    portfolioUrl: string;
    githubUrl: string;
    linkedinUrl: string;
  };
  profileSummary: string;
  skills: {
    expertise: string[];
    comfortable: string[];
    familiar: string[];
    categories?: { label: string; items: string[] }[];
  };
  experience: ExperienceItem[];
  allProjects: Project[];
  education: {
    degree: string;
    institution: string;
    cgpa: string;
    duration: string;
  };
  publications: Publication[];
  certifications?: CertificationItem[];
  achievements?: AchievementItem[];
  sectionOrder: SectionKey[];
  sections: ResumeSectionsVisibility;
  styles: ResumeStyles;
}

export const masterResume: MasterResumeData = {
  personalInfo: {
    name: "Samiur Rahman Wasi",
    title: "Fullstack Developer",
    phone: "+880-18811-46425",
    location: "4224, Chittagong, Bangladesh",
    email: "samwaseee@gmail.com",
    portfolioUrl: "https://samiur-rahman-wasi.vercel.app/",
    githubUrl: "https://github.com/samwaseee",
    linkedinUrl: "https://www.linkedin.com/in/samiur-rahman-wasi/",
  },
  profileSummary:
    "Dedicated CSE graduate who builds full-stack web apps with Next.js, Node.js and MongoDB/PostgreSQL, including AI-powered features such as pitch generation. Built three deployed projects with role-based auth and analytics dashboards; co-author of two IEEE papers on ML-based security. 250+ problems solved on Codeforces. Seeking a full-stack developer role.",
  skills: {
    expertise: [
      "Next.js",
      "MongoDB",
      "Git",
      "HTML",
      "JavaScript",
      "CSS",
      "C++",
    ],
    comfortable: [
      "Python",
      "Express.js",
      "Node.js",
      "REST API",
      "TypeScript",
      "PostgreSQL",
      "Tailwind CSS",
    ],
    familiar: [
      "MUI",
      "MVP",
      "React Query",
      "Redux",
      "Bootstrap",
      "Antd",
      "Framer Motion",
    ],
    categories: [
      {
        label: "Languages",
        items: ["JavaScript", "TypeScript", "Python", "C++", "Dart (Flutter)"],
      },
      {
        label: "Frontend",
        items: [
          "Next.js",
          "React",
          "Tailwind CSS",
          "React Query",
          "Zustand",
          "shadcn/ui",
          "CSS",
        ],
      },
      {
        label: "Backend & APIs",
        items: [
          "Node.js",
          "Express.js",
          "REST APIs",
          "JWT",
          "NextAuth",
          "Zod",
          "OpenAPI",
          "Stripe",
          "MERN",
        ],
      },
      {
        label: "Databases & Tools",
        items: [
          "MongoDB",
          "PostgreSQL",
          "Firebase",
          "Git",
          "Axios",
          "Mongoose",
          "node-cron",
          "Gemini API",
          "Railway",
        ],
      },
      {
        label: "AI & Machine Learning",
        items: [
          "Machine Learning",
          "Data Analysis",
          "Model Evaluation",
          "AI API Integration",
          "PyTorch",
          "CNNs",
          "Vision Transformers",
          "GNNs",
          "Quantum Neural Networks",
        ],
      },
    ],
  },
  experience: [
    {
      id: "iiuc-des",
      role: "Technical Lead & Event Coordinator",
      company: "IIUC Developers & Entrepreneurs Society",
      location: "Chittagong, Bangladesh",
      duration: "2025 - Present",
      bullets: [
        "Directed technical workshops, development bootcamps, and led organizational logistics for university datathons.",
        "Mentored student teams in full-stack architecture, Git collaboration workflows, and competitive programming practices.",
      ],
    },
  ],
  allProjects: [
    {
      id: "starlight-university",
      title: "Starlight University",
      subtitle: "A School Management System (team project)",
      links: {
        live: "https://starlight-un-edu.vercel.app/",
        frontend:
          "https://github.com/saifullah-10/school-management-system-client",
        backend:
          "https://github.com/saifullah-10/school-management-system-server",
      },
      bullets: [
        "Built attendance tracking with Express/MongoDB endpoints and a Next.js page using TanStack Query.",
        "Developed 6 REST endpoints and 6 pages for courses, enrollment, students, and teachers.",
        "Added Next.js middleware that redirects unauthenticated users to login and preserves the target URL.",
        "Collaborated in a 5-person team using branches and pull requests; deployed on Vercel with a Docker development setup.",
      ]
    },
    {
      id: "nexus-ai",
      title: "Nexus AI",
      subtitle: "AI Freelance Marketplace",
      links: {
        live: "https://nexus-ai-frontend-eosin.vercel.app/",
        frontend: "https://github.com/samwaseee/Nexus-AI_frontend",
        backend: "https://github.com/samwaseee/Nexus-AI_backend",
      },
      bullets: [
        "Built Freelancer, Client, and Admin dashboards with middleware-enforced role-based route access.",
        "Connected NextAuth to a JWT backend and used an Axios interceptor to attach tokens to API requests.",
        "Built an Express/MongoDB API with refresh-token rotation, bcrypt, role guards, and rate limiting.",
        "Added a per-user rate-limited Gemini pitch builder and career coach; documented the API in Swagger.",
      ]
    },
    {
      id: "promptforge",
      title: "PromptForge",
      subtitle: "An AI Prompt Marketplace",
      links: {
        live: "https://promtforge-frontend.vercel.app/",
        frontend: "https://github.com/samwaseee/promtforge-frontend",
        backend: "https://github.com/samwaseee/promtforge-backend",
      },
      bullets: [
        "Built a prompt marketplace with Stripe Checkout, signed webhooks, and a vault for purchased prompts.",
        "Masked prompt text in public API responses so full content is delivered only through paid orders.",
        "Built an admin approval queue for seller prompts with audit logging and weekly cron log cleanup.",
        "Verified Firebase ID tokens server-side, issued JWTs, and enforced admin routes with role middleware.",
      ],
      technologies:
        "Next.js, MERN, Axios, React Hook Form, Framer Motion, Recharts, Material UI, Mongoose, Passport.js, Helmet, bcrypt, firebase-admin, node-cron, Gemini API, Swagger UI, Stripe, Firebase, JWT",
    },
  ],
  education: {
    degree: "Bachelor of Science in Computer Science and Engineering",
    institution: "International Islamic University, Chittagong",
    cgpa: "3.6",
    duration: "2022 - 2026",
  },
  publications: [
    {
      authors: "S. R. Wasi",
      title: "Machine Learning Models for Predictive Maintenance in RMG",
      venue: "IEOM'25",
      doi: "10.46254/BA08.20250158",
    },
    {
      authors: "S. R. Wasi et al.",
      title: "Interpretable Feature-Fused Models for PyPI Malware Detection",
      venue: "IEEE QPAIN'26",
      doi: "10.1109/QPAIN69676.2026.11545547",
    },
    {
      authors: "S. I. Hira, S. R. Wasi et al.",
      title:
        "Behavioral Generative Augmentation for Network Intrusion Detection under Extreme Data Scarcity",
      venue: "IEEE QPAIN'26",
      doi: "10.1109/QPAIN69676.2026.11545987",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Mobile Application Development",
      issuer: "EDGE Bangladesh",
      date: "2024",
    },
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Competitive Programming",
      details: "Solved 250+ problems on Codeforces.",
    },
    {
      id: "ach-2",
      title: "Datathons & Hackathons",
      details:
        "Organized and participated in technical machine learning competitions and datathons at IIUC.",
    },
  ],
  sectionOrder: [
    "profile",
    "skills",
    "experience",
    "projects",
    "education",
    "publications",
    "certifications",
    "achievements",
  ],
  sections: {
    profile: true,
    skills: true,
    experience: true,
    projects: true,
    education: true,
    publications: true,
    certifications: false,
    achievements: false,
  },
  styles: {
    fontFamily: "font-sans",
    nameSize: "text-3xl",
    nameBold: true,
    sectionTitleSize: "text-sm",
    sectionTitleBold: true,
    sectionTitleBg: "bg-gray-200",
    skillsLayout: "category",
    certificationsTitle: "Certifications & Training",
    achievementsTitle: "Competitive Programming & Open Source",
    summaryTextSize: "text-[12px]",
    skillsTextSize: "text-[12px]",
    experienceTextSize: "text-[12px]",
    projectTextSize: "text-[12px]",
    educationTextSize: "text-[12px]",
    publicationTextSize: "text-[12px]",
    certificationTextSize: "text-[12px]",
    achievementTextSize: "text-[12px]",
    projectTitleBold: true,
    educationTitleBold: true,
  },
};
