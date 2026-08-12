import type { PersonalInfo, Resume } from "@/lib/types";

export const emptyPersonalInfo: PersonalInfo = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
};

export function getResumeDraft(resume: Resume): {
  title: string;
  personalInfo: Required<PersonalInfo>;
  summary: string;
  experiences: NonNullable<Resume["experience"]>;
  projects: NonNullable<Resume["projects"]>;
  educations: NonNullable<Resume["education"]>;
  skills: string[];
  certifications: NonNullable<Resume["certifications"]>;
  languages: NonNullable<Resume["languages"]>;
} {
  return {
    title: resume.title || "",
    personalInfo: { ...emptyPersonalInfo, ...(resume.personalInfo || {}) } as Required<PersonalInfo>,
    summary: resume.summary || "",
    experiences: resume.experience || [],
    projects: resume.projects || [],
    educations: resume.education || [],
    skills: resume.skills || [],
    certifications: resume.certifications || [],
    languages: resume.languages || [],
  };
}
