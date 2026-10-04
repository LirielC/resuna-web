"use client";

import { ExternalLink, FileText, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Certification, Education, Experience, Language, Project, ResumeTemplate } from "@/lib/types";

interface ResumePreviewProps {
  template: ResumeTemplate;
  onTemplateChange: (template: ResumeTemplate) => void;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
  };
  summary: string;
  experiences: Experience[];
  projects: Project[];
  educations: Education[];
  skills: string[];
  certifications: Certification[];
  languages: Language[];
}

function safeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return `https://${trimmed}`;
  return /^(https?:\/\/|mailto:|tel:)/i.test(trimmed) ? trimmed : "#";
}

function displayUrl(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function ResumePreview({
  template,
  onTemplateChange,
  personalInfo,
  summary,
  experiences,
  projects,
  educations,
  skills,
  certifications,
  languages,
}: ResumePreviewProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const compact = template === "compact";
  const modern = template === "modern";

  const sectionClass = modern
    ? "border-l-2 border-orange-500 pl-3"
    : "border-b border-stone-300 pb-1";
  const titleClass = modern
    ? "text-orange-700"
    : "text-stone-900";

  return (
    <div className={fullscreen ? "fixed inset-0 z-[80] overflow-auto bg-[#d8d5ce] p-5" : "space-y-3"}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {t("editor.livePreview")}
        </span>
        <div className="ml-auto flex rounded-lg border border-stone-200 bg-white p-1" aria-label={t("editor.template")}>
          {(["classic", "modern", "compact"] as ResumeTemplate[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onTemplateChange(option)}
              aria-pressed={template === option}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${template === option
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
            >
              {t(`editor.templates.${option}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-lg border border-stone-200 bg-white text-[10px] text-stone-600">
          <button type="button" aria-label="Diminuir zoom" onClick={() => setZoom((value) => Math.max(.7, value - .1))} className="p-2 hover:bg-stone-50"><Minus className="h-3 w-3" /></button>
          <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((value) => Math.min(1.3, value + .1))} className="p-2 hover:bg-stone-50"><Plus className="h-3 w-3" /></button>
          <button type="button" aria-label={fullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"} onClick={() => setFullscreen(!fullscreen)} className="border-l border-stone-200 p-2 hover:bg-stone-50">{fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}</button>
        </div>
      </div>

      <article
        className={`mx-auto min-h-[1123px] w-full max-w-[794px] origin-top border border-stone-200 bg-white text-stone-900 shadow-md transition-transform ${compact ? "p-7" : "p-10"} ${modern ? "font-sans" : "font-serif"}`}
        aria-label={t("editor.livePreview")}
        style={{ transform: `scale(${zoom})`, marginBottom: `${(zoom - 1) * 1123}px` }}
      >
        <header className={`${modern ? "text-left" : "text-center"} ${compact ? "mb-5" : "mb-7"} border-b border-stone-300 pb-5`}>
          <h1 className={`${compact ? "text-xl" : "text-2xl"} font-bold tracking-tight`}>
            {personalInfo.fullName || t("editor.yourName")}
          </h1>
          <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-stone-500 ${modern ? "justify-start" : "justify-center"}`}>
            {[personalInfo.location, personalInfo.email, personalInfo.phone].filter(Boolean).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] ${modern ? "justify-start" : "justify-center"}`}>
            {[personalInfo.linkedin, personalInfo.github, personalInfo.website].filter(Boolean).map((item) => (
              <a key={item} href={safeUrl(item)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-orange-700 hover:underline">
                {displayUrl(item)} <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </header>

        <div className={`${compact ? "space-y-4" : "space-y-6"} text-[10px] leading-relaxed`}>
          {summary && (
            <PreviewSection title={t("editor.profile")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <p>{summary}</p>
            </PreviewSection>
          )}

          {experiences.some((item) => item.title || item.company) && (
            <PreviewSection title={t("editor.experience")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <div className="space-y-4">
                {experiences.filter((item) => item.title || item.company).map((item, index) => (
                  <div key={`${item.company}-${index}`}>
                    <p><strong className="text-[11px]">{item.title || t("editor.jobTitle")}</strong>{item.company && <span className="text-stone-600"> · {item.company}</span>}</p>
                    <p className="text-stone-500">{item.startDate}{item.startDate && (item.current || item.endDate) && " – "}{item.current ? t("editor.present") : item.endDate}{item.location && ` · ${item.location}`}</p>
                    {item.description && <p className="text-stone-600">{item.description}</p>}
                    <BulletList items={item.bullets} />
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {projects.some((item) => item.name) && (
            <PreviewSection title={t("editor.tabs.projects")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <div className="space-y-3">
                {projects.filter((item) => item.name).map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <strong className="text-[11px]">{item.name}</strong>
                    {item.technologies?.length ? <span className="ml-2 text-stone-500">({item.technologies.join(", ")})</span> : null}
                    {item.description && <p className="text-stone-600">{item.description}</p>}
                    <BulletList items={item.bullets} />
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {educations.some((item) => item.degree || item.institution) && (
            <PreviewSection title={t("editor.tabs.education")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <div className="space-y-2">
                {educations.filter((item) => item.degree || item.institution).map((item, index) => (
                  <div key={`${item.institution}-${index}`}>
                    <p><strong>{item.degree}</strong>{item.institution && <span className="text-stone-600"> · {item.institution}</span>}</p>
                    {item.graduationDate && <p className="text-stone-500">{item.graduationDate}</p>}
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {skills.length > 0 && (
            <PreviewSection title={t("editor.tabs.skills")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <p>{skills.join(" · ")}</p>
            </PreviewSection>
          )}

          {certifications.some((item) => item.name) && (
            <PreviewSection title={t("editor.certificates")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <ul className="space-y-1">
                {certifications.filter((item) => item.name).map((item, index) => <li key={`${item.name}-${index}`}>{item.name}{item.issuer && ` · ${item.issuer}`}{item.date && ` · ${item.date}`}</li>)}
              </ul>
            </PreviewSection>
          )}

          {languages.some((item) => item.name) && (
            <PreviewSection title={t("editor.tabs.languages")} className={sectionClass} titleClass={titleClass} compact={compact}>
              <p>{languages.filter((item) => item.name).map((item) => `${item.name} (${item.level})`).join(" · ")}</p>
            </PreviewSection>
          )}
        </div>
      </article>
    </div>
  );
}

function PreviewSection({ children, title, className, titleClass, compact }: { children: React.ReactNode; title: string; className: string; titleClass: string; compact: boolean }) {
  return (
    <section>
      <h2 className={`${className} ${titleClass} mb-2 text-[10px] font-bold uppercase tracking-[0.12em] ${compact ? "text-[9px]" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items?: string[] }) {
  const visible = items?.filter(Boolean) ?? [];
  if (visible.length === 0) return null;
  return <ul className="ml-4 list-disc space-y-0.5 text-stone-600">{visible.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}
