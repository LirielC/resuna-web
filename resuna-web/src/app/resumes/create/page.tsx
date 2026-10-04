"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { resumeApi } from "@/lib/api";

function CreateResume() {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void resumeApi.create({
      schemaVersion: 1,
      title: "Novo currículo",
      personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
      summary: "",
      experience: [], projects: [], education: [], skills: [], certifications: [], languages: [],
    }).then((resume) => router.replace(`/resumes/${resume.id}`));
  }, [router]);
  return <div className="flex min-h-screen items-center justify-center bg-[#eeece7]"><p className="font-serif text-stone-500">Preparando seu currículo…</p></div>;
}

export default function CreateResumePage() {
  return <ProtectedRoute><CreateResume /></ProtectedRoute>;
}
