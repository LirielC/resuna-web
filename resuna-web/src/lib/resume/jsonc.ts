import {
  applyEdits,
  findNodeAtLocation,
  format,
  modify,
  parse,
  parseTree,
  printParseErrorCode,
  type FormattingOptions,
  type ParseError,
} from "jsonc-parser";
import type { JsoncDiagnostic, Resume } from "@/lib/types";

export const RESUME_SCHEMA_VERSION = 1;

export function parseJsonc<T>(source: string): T {
  const errors: ParseError[] = [];
  const value = parse(source, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length) throw new Error(`JSONC inválido: ${printParseErrorCode(errors[0].error)}`);
  return value as T;
}

const formatting: FormattingOptions = { insertSpaces: true, tabSize: 2, eol: "\n" };

function documentResume(resume: Resume): Resume {
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, sourceJsonc: _source, ...data } = resume;
  return { ...data, schemaVersion: RESUME_SCHEMA_VERSION } as Resume;
}

export function stringifyResumeJsonc(resume: Resume): string {
  return [
    "// Resuna resume document. Edit freely and import it back into Resuna.",
    `// schemaVersion: ${RESUME_SCHEMA_VERSION}`,
    JSON.stringify(documentResume(resume), null, 2),
    "",
  ].join("\n");
}

export function parseResumeJsonc(source: string): Resume {
  const resume = parseJsonc<Resume>(source);
  if (!resume || typeof resume !== "object" || typeof resume.title !== "string") {
    throw new Error("Invalid Resuna JSONC document");
  }
  if (resume.schemaVersion != null && resume.schemaVersion !== RESUME_SCHEMA_VERSION) {
    throw new Error(`Unsupported resume schema version: ${resume.schemaVersion}`);
  }
  return { ...resume, schemaVersion: RESUME_SCHEMA_VERSION };
}

function position(source: string, offset: number) {
  const before = source.slice(0, offset).split("\n");
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

export function validateResumeJsonc(source: string): { resume: Resume | null; diagnostics: JsoncDiagnostic[] } {
  const syntaxErrors: ParseError[] = [];
  const value = parse(source, syntaxErrors, { allowTrailingComma: true, disallowComments: false }) as Resume | undefined;
  const diagnostics: JsoncDiagnostic[] = syntaxErrors.map((error) => {
    const at = position(source, error.offset);
    return { path: "$", message: `Erro de sintaxe: ${printParseErrorCode(error.error)}`, ...at, severity: "error", offset: error.offset, length: Math.max(1, error.length) };
  });
  if (syntaxErrors.length || !value || typeof value !== "object") return { resume: null, diagnostics };

  const tree = parseTree(source, [], { allowTrailingComma: true, disallowComments: false });
  const add = (path: (string | number)[], message: string) => {
    const node = tree ? findNodeAtLocation(tree, path) : undefined;
    const offset = node?.offset ?? 0;
    const at = position(source, offset);
    diagnostics.push({ path: path.length ? `$.${path.join(".")}` : "$", message, ...at, severity: "error", offset, length: Math.max(1, node?.length ?? 1) });
  };
  if (value.schemaVersion != null && value.schemaVersion !== RESUME_SCHEMA_VERSION) add(["schemaVersion"], `Versão de schema não suportada: ${value.schemaVersion}`);
  if (typeof value.title !== "string" || !value.title.trim()) add(["title"], "O título é obrigatório.");
  if (!value.personalInfo || typeof value.personalInfo !== "object") add(["personalInfo"], "personalInfo é obrigatório.");
  else {
    if (typeof value.personalInfo.fullName !== "string" || !value.personalInfo.fullName.trim()) add(["personalInfo", "fullName"], "O nome completo é obrigatório.");
    if (typeof value.personalInfo.email !== "string" || !value.personalInfo.email.trim()) add(["personalInfo", "email"], "O e-mail é obrigatório.");
    else if (value.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.personalInfo.email)) add(["personalInfo", "email"], "Informe um e-mail válido.");
    for (const key of ["linkedin", "github", "website"] as const) {
      const url = value.personalInfo[key];
      if (url && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) add(["personalInfo", key], `Informe uma URL válida em ${key}.`);
    }
  }
  const limits: Array<[keyof Resume, number]> = [["experience", 20], ["projects", 30], ["education", 10], ["skills", 100], ["certifications", 30], ["languages", 20]];
  for (const [key, limit] of limits) {
    const item = value[key];
    if (item != null && !Array.isArray(item)) add([key], `${String(key)} deve ser uma lista.`);
    else if (Array.isArray(item) && item.length > limit) add([key], `${String(key)} aceita no máximo ${limit} itens.`);
  }
  (Array.isArray(value.languages) ? value.languages : []).forEach((language, index) => {
    if (!language || typeof language !== "object") add(["languages", index], "Cada idioma deve ser um objeto.");
    else if (language.level != null && (typeof language.level !== "string" || language.level.length > 50)) {
      add(["languages", index, "level"], "O nível deve ser um texto de até 50 caracteres.");
    }
  });
  return { resume: diagnostics.length ? null : { ...value, schemaVersion: RESUME_SCHEMA_VERSION }, diagnostics };
}

export function formatResumeJsonc(source: string): string {
  const checked = validateResumeJsonc(source);
  if (!checked.resume) throw new Error(checked.diagnostics[0]?.message || "JSONC inválido");
  return applyEdits(source, format(source, undefined, formatting));
}

export function updateResumeJsonc(source: string, resume: Resume): string {
  const next = documentResume(resume) as unknown as Record<string, unknown>;
  const current = parseJsonc<Record<string, unknown>>(source);
  let output = source;
  for (const [key, value] of Object.entries(next)) {
    if (JSON.stringify(current[key]) !== JSON.stringify(value)) {
      output = applyEdits(output, modify(output, [key], value, { formattingOptions: formatting }));
    }
  }
  return output;
}
