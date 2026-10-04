"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { resumeApi } from "@/lib/api";

function CreateResume() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void resumeApi.create({
      schemaVersion: 1,
      title: "Novo currículo",
      personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
      summary: "",
      experience: [], projects: [], education: [], skills: [], certifications: [], languages: [],
    }).then((resume) => router.replace(`/resumes/${resume.id}`))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível criar o currículo."));
  }, [router]);
  return <div className="flex min-h-screen items-center justify-center bg-[#eeece7]">
    <p role={error ? "alert" : undefined} className={error ? "max-w-md px-6 text-center text-red-700" : "font-serif text-stone-500"}>
      {error || "Preparando seu currículo…"}
    </p>
  </div>;
}

export default function CreateResumePage() {
  return <ProtectedRoute><CreateResume /></ProtectedRoute>;
}
