"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Certification, Education, Experience, Language, Project } from "@/lib/types";
import type { EditorSection, ResumeEditor } from "@/hooks/useResumeEditor";

type FieldProps = { label?: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string };

function Field({ label, value, onChange, placeholder, type = "text" }: FieldProps) {
  return <label className="block space-y-2"><span className="block text-xs font-bold uppercase tracking-widest text-stone-500">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="input-editorial" /></label>;
}

function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block space-y-2"><span className="block text-xs font-bold uppercase tracking-widest text-stone-500">{label}</span><textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={5} className="w-full rounded-xl border border-stone-300 bg-white p-4 text-sm text-stone-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" /></label>;
}

function Card({ title, onRemove, children }: { title: string; onRemove?: () => void; children: ReactNode }) {
  return <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold text-stone-900">{title}</h3>{onRemove && <button type="button" onClick={onRemove} aria-label="Excluir" className="text-stone-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>{children}</div>;
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-4 font-medium text-stone-500 hover:border-orange-400 hover:bg-orange-50/20 hover:text-orange-600"><Plus className="h-5 w-5" />{children}</button>;
}

export function EditorForm({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  const section = editor.activeSection as EditorSection;
  const intros: Record<EditorSection, string> = { basics: "basicsIntro", experience: "experienceIntro", projects: "projectsIntro", education: "educationIntro", skills: "skillsIntro", certifications: "certificates", languages: "tabs.languages" };
  return <div className="space-y-6"><p className="text-lg italic leading-relaxed text-stone-500">{t(`editor.${intros[section]}`)}</p>{section === "basics" && <Basics editor={editor} />}{section === "experience" && <Experiences editor={editor} />}{section === "projects" && <Projects editor={editor} />}{section === "education" && <EducationList editor={editor} />}{section === "skills" && <Skills editor={editor} />}{section === "certifications" && <Certifications editor={editor} />}{section === "languages" && <Languages editor={editor} />}</div>;
}

function Basics({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation(); const info = editor.personalInfo;
  const update = (key: keyof typeof info) => (value: string) => editor.setPersonalInfo({ ...info, [key]: value });
  return <Card title={t("editor.personalInfo")}><div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label={t("editor.fullName")} value={info.fullName} onChange={update("fullName")} placeholder={t("editor.fullNamePlaceholder")} /><Field label={t("editor.emailAddress")} value={info.email} onChange={update("email")} type="email" /></div><div className="grid gap-5 sm:grid-cols-2"><Field label={t("editor.phoneNumber")} value={info.phone} onChange={update("phone")} placeholder={t("editor.phonePlaceholder")} /><Field label={t("editor.currentLocation")} value={info.location} onChange={update("location")} placeholder={t("editor.locationPlaceholder")} /></div><div className="grid gap-5 sm:grid-cols-2"><Field label="LinkedIn" value={info.linkedin} onChange={update("linkedin")} /><Field label="GitHub" value={info.github} onChange={update("github")} /></div><Field label="Website" value={info.website} onChange={update("website")} /><Area label={t("editor.professionalSummary")} value={editor.summary} onChange={editor.setSummary} placeholder={t("editor.summaryPlaceholder")} /></div></Card>;
}

function Experiences({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="space-y-5">{editor.experiences.map((item: Experience, index) => <Card key={index} title={`${t("editor.role")} ${index + 1}`} onRemove={() => editor.actions.removeExperience(index)}><div className="space-y-5"><Field label={t("editor.jobTitle")} value={item.title} onChange={(value) => editor.actions.updateExperience(index, { ...item, title: value })} /><Field label={t("editor.companyOrg")} value={item.company} onChange={(value) => editor.actions.updateExperience(index, { ...item, company: value })} /><Field label={t("editor.location")} value={item.location || ""} onChange={(value) => editor.actions.updateExperience(index, { ...item, location: value })} /><div className="grid gap-5 sm:grid-cols-2"><MonthPicker label={t("editor.started")} value={item.startDate || ""} onChange={(value) => editor.actions.updateExperience(index, { ...item, startDate: value })} /><MonthPicker label={t("editor.ended")} value={item.endDate || ""} onChange={(value) => editor.actions.updateExperience(index, { ...item, endDate: value })} disabled={item.current} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.current || false} onChange={(event) => editor.actions.updateExperience(index, { ...item, current: event.target.checked })} />{t("editor.iCurrentlyWorkHere")}</label><Area label={t("editor.keyAchievements")} value={(item.bullets || []).join("\n")} onChange={(value) => editor.actions.updateExperience(index, { ...item, bullets: value.split("\n") })} placeholder={t("editor.achievementsPlaceholder")} /></div></Card>)}<AddButton onClick={editor.actions.addExperience}>{t("editor.addAnotherRole")}</AddButton></div>;
}

function Projects({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="space-y-5">{editor.projects.map((item: Project, index) => <Card key={index} title={`${t("editor.project")} ${index + 1}`} onRemove={() => editor.actions.removeProject(index)}><div className="space-y-5"><Field label={t("editor.projectName")} value={item.name} onChange={(value) => editor.actions.updateProject(index, { ...item, name: value })} /><Field label={t("editor.techStack")} value={editor.techInputs[index] || ""} onChange={(value) => editor.actions.updateTechInput(index, value)} placeholder={t("editor.techStackPlaceholder")} /><Field label={t("editor.projectLink")} value={item.url || ""} onChange={(value) => editor.actions.updateProject(index, { ...item, url: value })} placeholder="https://..." /><Area label={t("editor.descriptionImpact")} value={(item.bullets || []).join("\n")} onChange={(value) => editor.actions.updateProject(index, { ...item, bullets: value.split("\n") })} /></div></Card>)}<AddButton onClick={editor.actions.addProject}>{t("editor.addProject")}</AddButton></div>;
}

function EducationList({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="space-y-5">{editor.educations.map((item: Education, index) => <Card key={index} title={`${t("editor.fullEducation")} ${index + 1}`} onRemove={() => editor.actions.removeEducation(index)}><div className="space-y-5"><Field label={t("editor.degreeCertificate")} value={item.degree} onChange={(value) => editor.actions.updateEducation(index, { ...item, degree: value })} /><Field label={t("editor.institution")} value={item.institution} onChange={(value) => editor.actions.updateEducation(index, { ...item, institution: value })} /><Field label={t("editor.location")} value={item.location || ""} onChange={(value) => editor.actions.updateEducation(index, { ...item, location: value })} /><MonthPicker label={t("editor.graduation")} value={item.graduationDate || ""} onChange={(value) => editor.actions.updateEducation(index, { ...item, graduationDate: value })} /><Field label={t("editor.gpaHonors")} value={item.gpa || ""} onChange={(value) => editor.actions.updateEducation(index, { ...item, gpa: value })} /></div></Card>)}<AddButton onClick={editor.actions.addEducation}>{t("editor.addEducation")}</AddButton></div>;
}

function Skills({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <Card title={t("editor.skillsExpertise")}><div className="flex items-end gap-3"><div className="flex-1"><Field value={editor.newSkill} onChange={editor.setNewSkill} placeholder={t("editor.addSkillPlaceholder")} /></div><Button type="button" variant="secondary" onClick={editor.actions.addSkill}>{t("common.add")}</Button></div><div className="mt-5 flex min-h-24 flex-wrap gap-2 rounded-xl border border-stone-100 bg-stone-50 p-4">{editor.skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-sm">{skill}<button type="button" onClick={() => editor.actions.removeSkill(skill)} aria-label={`Excluir ${skill}`}>×</button></span>)}</div></Card>;
}

function Certifications({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="space-y-5">{editor.certifications.map((item: Certification, index) => <Card key={index} title={`${t("editor.certificates")} ${index + 1}`} onRemove={() => editor.actions.removeCertification(index)}><div className="space-y-5"><Field label={t("editor.certificationName")} value={item.name} onChange={(value) => editor.actions.updateCertification(index, { ...item, name: value })} /><Field label={t("editor.issuer")} value={item.issuer || ""} onChange={(value) => editor.actions.updateCertification(index, { ...item, issuer: value })} /><MonthPicker label={t("editor.date")} value={item.date || ""} onChange={(value) => editor.actions.updateCertification(index, { ...item, date: value })} /></div></Card>)}<AddButton onClick={editor.actions.addCertification}>{t("editor.addCertificate")}</AddButton></div>;
}

function Languages({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="space-y-5">{editor.languages.map((item: Language, index) => <Card key={index} title={`${t("editor.tabs.languages")} ${index + 1}`} onRemove={() => editor.actions.removeLanguage(index)}><div className="grid gap-5 sm:grid-cols-2"><Field label={t("editor.tabs.languages")} value={item.name} onChange={(value) => editor.actions.updateLanguage(index, { ...item, name: value })} /><label className="block space-y-2"><span className="block text-xs font-bold uppercase tracking-widest text-stone-500">Nível</span><select value={item.level} onChange={(event) => editor.actions.updateLanguage(index, { ...item, level: event.target.value as Language["level"] })} className="input-editorial">{["native", "fluent", "advanced", "intermediate", "basic"].map((level) => <option key={level} value={level}>{level}</option>)}</select></label></div></Card>)}<AddButton onClick={editor.actions.addLanguage}>{t("editor.addLanguage")}</AddButton></div>;
}
