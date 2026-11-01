This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Dynamic Resume

A polished, AI-assisted resume builder built with Next.js that helps a candidate turn a master portfolio profile into a tailored, print-ready resume for different job descriptions.

This project combines:

- a structured master resume data model
- a client-side editor for content, layout, and formatting
- an AI-powered tailoring endpoint that matches skills and project highlights to a posted job description
- a clean single-page A4 resume layout designed for printing or sharing

At its core, the app is a "resume customization studio": you keep one canonical profile, then quickly refine it for each application without rebuilding the entire document from scratch.

## Why this project exists

Job applications often require the same candidate profile to be reshaped for different roles. A developer may need to emphasize backend systems, AI integrations, product work, or research/ML experience depending on the company and job description.

This project solves that by combining:

- a reusable master profile in TypeScript
- manual visual editing controls
- automated ATS-style skill and project selection using Google Gemini
- a final resume rendered in a compact, recruiter-friendly layout

Instead of maintaining multiple separate resumes, the app keeps an authoritative "master resume" and produces targeted variants with a few actions.

## Project overview

The app is a Next.js 16 application using the App Router. The main experience is a two-panel interface:

- left panel: editable resume controls and AI tailoring tools
- right panel: live resume preview / print layout

The resume is designed for single-page A4 output and is organized into sections such as profile summary, skills, experience, projects, education, publications, certifications, and achievements.

## Key features

### 1. AI-powered resume tailoring

The app includes a job-description-based tailoring flow:

- the user pastes a job description in the AI Tailor tab
- the backend route sends the description plus the candidate's skills and project metadata to Gemini
- the model returns a small JSON payload with:
  - selectedSkills
  - selectedProjectIds
- the frontend updates the resume to emphasize the most relevant skills and project cards for that position

This makes the resume more relevant to ATS filters and role-specific searches without manually rewriting everything.

### 2. Manual resume editing

The edit panel supports:

- changing personal info: name, title, phone, email, links
- editing the profile summary
- adjusting skill grouping and text size
- toggling section visibility
- reordering sections with up/down controls
- customizing font family and text scaling
- adding/removing projects, experiences, certifications, and achievements
- editing project links and descriptions
- rearranging skills categories and project entries

This is ideal when you want to make final adjustments that the AI cannot perfectly infer.

### 3. Section-based layout control

The resume data model includes a section ordering array and per-section visibility settings. This allows the builder to hide or show:

- profile
- skills
- experience
- projects
- education
- publications
- certifications
- achievements

Users can also reorder these sections to create a different narrative flow or remove sections that are irrelevant for a target job.

### 4. Print-ready resume output

The `ResumeDocument` component renders a compact, professional single-sheet resume. The main page includes print CSS rules to:

- set page size to A4 portrait
- hide editing panels during print
- ensure the document prints cleanly without the control interface

This makes it easy to print a candidate's resume directly from the browser.

### 5. Structured profile data model

The project stores resume content in one strongly typed structure:

- `MasterResumeData`
- `Project`
- `ExperienceItem`
- `Publication`
- `CertificationItem`
- `AchievementItem`
- `ResumeStyles`
- `ResumeSectionsVisibility`

This keeps content consistent and makes the resume builder easier to extend.

### 6. Candidate-specific portfolio data

The project is built around a specific developer profile, including:

- full-stack web development experience
- AI tool integration
- experience in Next.js, Node.js, MongoDB/PostgreSQL, and modern frontend stacks
- multiple side projects and AI products
- publications, education, and competitive-programming achievements

This means the app is highly personal and currently serves as a portfolio/resume generator for the repository owner rather than a generic form-based resume SaaS.

## Tech stack

This project uses the following stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Google Gemini API (`@google/genai`)
- Lucide React for icons
- CSS-driven print layout

### Core libraries

- `next` - application framework and App Router
- `react` / `react-dom` - UI rendering
- `@google/genai` - Google Gemini AI SDK for resume tailoring
- `lucide-react` - icon system
- `clsx` and `tailwind-merge` - utility composition patterns
- `react-to-print` - included for print-centric workflows

## Repository structure

```text
dynamic-resume/
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tailor/
│   │   │       └── route.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ResumeDocument.tsx
│   └── data/
│       └── masterResume.ts
└── tsconfig.tsbuildinfo
```

## Important files and what they do

### `src/data/masterResume.ts`

This is the system's source of truth for the resume.

It contains:

- personal contact information
- profile summary
- skills grouped by expertise, comfort, familiarity, and categories
- work experience
- project list
- education and publications
- certifications and achievements
- section order and visibility configuration
- printing/styles metadata for layout and typography

Because the data is typed and centralized, the app can be easily adapted to a different candidate without rewriting the UI.

### `src/app/page.tsx`

This is the main interactive builder page. It includes:

- state management for the live resume data
- AI Tailor tab with job description input
- Content Edit tab with all editable sections
- utility functions for adding, deleting, and updating resume blocks
- section ordering and toggling logic
- print trigger logic
- styling for the editor/dashboard interface

This file is effectively the control panel for the entire resume builder.

### `src/components/ResumeDocument.tsx`

This is the resume renderer. It takes `data: MasterResumeData` and renders a styled document with multiple resume sections.

It handles:

- header block with name and contact info
- profile summary section
- skill rendering in tiered or category modes
- experience cards with bullets
- project blocks with external links and technologies
- education, publications, certifications, and achievements
- custom typography sizes and section styling

The component is designed to match the print layout and keep the document compact and readable.

### `src/app/api/tailor/route.ts`

This API route is the AI integration point.

It does the following:

- loads `GEMINI_API_KEY` from environment variables
- checks for a supplied `jobDescription`
- collects all candidate skills from the master profile
- asks Gemini to evaluate the job description and select the most relevant skills and projects
- returns a strict JSON response containing `selectedSkills` and `selectedProjectIds`
- falls back across multiple Gemini models if one is unavailable or overloaded

This is the server-side intelligence that tailors the document to a given role.

### `src/app/layout.tsx`

This file wires in Google font families and applies metadata for the app shell.

It loads:

- Geist Sans and Geist Mono
- Inter
- Lora
- Merriweather
- Roboto

This gives the app multiple typographic options for both the editor and the final resume.

## Data model highlights

The resume schema is intentionally rich and supports customization.

### Project structure

Each project includes:

- `id`
- `title`
- `subtitle`
- `links` (`live`, `frontend`, `backend`)
- `inputMode` (`"list" | "paragraph"`)
- `description`
- `bullets`
- `technologies`

This allows a project to be rendered either as bullet points or a paragraph depending on the content style.

### Skills structure

Skills are organized as:

- `expertise`
- `comfortable`
- `familiar`
- `categories[]` with label + items

This supports both a simplified tiered view and a more category-driven layout.

### Resume styling structure

The `styles` object supports:

- font family selection
- heading size and boldness
- section title background styling
- skill layout mode
- per-section text sizes
- project and education title emphasis

This provides a broad range of visual tuning without complicated styling files.

## AI tailoring workflow

The practical flow of the app is:

1. The user defines a master resume in `masterResume.ts`.
2. The user pastes a job description into the AI Tailor panel.
3. The server route bundles all available skills and project metadata.
4. Gemini selects the most relevant subset of skills and the best-matching projects.
5. The frontend receives the structured JSON and filters the visible data.
6. The resume preview updates to reflect the tailored version.
7. The user can make additional manual adjustments and print the result.

This gives a fast blend of AI personalization and human control.

## Environment setup

This project uses environment-based configuration for AI features.

### Required environment variable

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Without this key, the resume-tailoring route will fail with a server error because the AI model cannot be initialized.

## Installation and running locally

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
```

### Start production server

```bash
npm run start
```

## Typical usage

### Build or update the master resume

Edit `src/data/masterResume.ts` to update:

- your name and title
- contact details
- education
- experience
- skills
- projects
- publications
- certifications

### Tailor for a job posting

1. Open the app in the browser.
2. Switch to the "AI Tailor" tab.
3. Paste a job description.
4. Click "Tailor Resume".
5. Review the selected skills and project highlights.
6. Adjust the resume manually if needed.
7. Print it to PDF or paper.

### Fine-tune custom output

Use the Content Edit panel to:

- hide irrelevant sections
- re-sequence sections
- change the font
- adjust text sizing
- add or remove lists and cards
- update project links

## Current project status

This is a personal, purpose-built resume builder that is designed to work for one candidate profile while remaining reusable in structure.

It is not a full user-authenticated SaaS system or multi-user database-backed application; instead, it focuses on one strong use case: generating a highly personalized, recruiter-friendly resume quickly.

## Future improvement ideas

The project is already functional, but there are several natural next steps:

- add resume templates for different styles (classic, modern, minimal, technical)
- add PDF export via a dedicated export library
- add drag-and-drop reordering of resume blocks
- add data persistence with local storage or a database
- add multi-candidate support and profile switching
- add a preview panel for dark mode or print style variations
- create a route to generate multiple resumes from saved job applications
- add user authentication and saved job-specific variants

## Developer notes

This app is a useful example of combining:

- typed domain data models
- modern React state management patterns
- App Router server actions/API routes
- AI-assisted content selection
- polished print-first UI design

It is especially suitable as a portfolio project for demonstrating full-stack UI work, AI integration, and design-oriented frontend engineering.

## Summary

Dynamic Resume is a lightweight but capable AI-assisted resume PLatform that turns a structured candidate profile into a polished, role-targeted, print-ready document. It blends the flexibility of a custom builder with the efficiency of Gemini-powered relevance matching, giving users the best of both automation and manual control.

Whether you are applying for a frontend role, a backend role, an AI-heavy product role, or a research-oriented engineering position, the project is designed to help a developer present the strongest version of their experience in a single, coherent document.

