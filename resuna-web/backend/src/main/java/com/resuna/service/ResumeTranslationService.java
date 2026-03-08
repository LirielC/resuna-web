package com.resuna.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resuna.model.Resume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for translating resumes using AI (Portuguese to English only).
 */
@Service
public class ResumeTranslationService {

    /**
     * Brazilian state codes → full state name (used for location normalization).
     * Format on a translated resume: "City, Brazil" (US convention: City, Country).
     */
    /** Portuguese month name patterns (regex) → English month names. */
    private static final String[][] PT_MONTHS = {
        {"janeiro",        "January"},
        {"fevereiro",      "February"},
        {"mar[cç]o",       "March"},
        {"abril",          "April"},
        {"maio",           "May"},
        {"junho",          "June"},
        {"julho",          "July"},
        {"agosto",         "August"},
        {"setembro",       "September"},
        {"outubro",        "October"},
        {"novembro",       "November"},
        {"dezembro",       "December"},
    };

    /** Common language names in Portuguese → English. */
    private static final Map<String, String> PT_LANGUAGE_NAMES_TO_EN = Map.ofEntries(
        Map.entry("ingles", "English"),
        Map.entry("portugues", "Portuguese"),
        Map.entry("espanhol", "Spanish"),
        Map.entry("frances", "French"),
        Map.entry("alemao", "German"),
        Map.entry("italiano", "Italian"),
        Map.entry("japones", "Japanese"),
        Map.entry("chines", "Chinese"),
        Map.entry("mandarin", "Mandarin"),
        Map.entry("coreano", "Korean"),
        Map.entry("russo", "Russian"),
        Map.entry("arabe", "Arabic"),
        Map.entry("holandes", "Dutch"),
        Map.entry("sueco", "Swedish"),
        Map.entry("noruegues", "Norwegian"),
        Map.entry("dinamarques", "Danish"),
        Map.entry("finlandes", "Finnish"),
        Map.entry("polones", "Polish"),
        Map.entry("turco", "Turkish"),
        Map.entry("hebraico", "Hebrew"),
        Map.entry("hindi", "Hindi"),
        Map.entry("bengali", "Bengali"),
        Map.entry("grego", "Greek"),
        Map.entry("ucraniano", "Ukrainian"),
        Map.entry("romeno", "Romanian"),
        Map.entry("hungaro", "Hungarian"),
        Map.entry("tcheco", "Czech"),
        Map.entry("croata", "Croatian"),
        Map.entry("bulgaro", "Bulgarian"),
        Map.entry("indonesio", "Indonesian"),
        Map.entry("malaio", "Malay"),
        Map.entry("filipino", "Filipino"),
        Map.entry("tagalo", "Filipino"),
        Map.entry("suaili", "Swahili"),
        Map.entry("afrikaans", "Afrikaans"),
        Map.entry("libras", "Brazilian Sign Language (LIBRAS)")
    );

    /** Portuguese skill category names → English equivalents. */
    private static final Map<String, String> PT_CATEGORY_TO_EN = Map.ofEntries(
        Map.entry("linguagens", "Languages"),
        Map.entry("linguagem", "Languages"),
        Map.entry("linguagens de programação", "Programming Languages"),
        Map.entry("linguagem de programação", "Programming Language"),
        Map.entry("frameworks", "Frameworks"),
        Map.entry("framework", "Frameworks"),
        Map.entry("banco de dados", "Databases"),
        Map.entry("bancos de dados", "Databases"),
        Map.entry("nuvem", "Cloud"),
        Map.entry("devops", "DevOps"),
        Map.entry("ferramentas", "Tools"),
        Map.entry("ferramenta", "Tools"),
        Map.entry("metodologias", "Methodologies"),
        Map.entry("metodologia", "Methodologies"),
        Map.entry("competências", "Skills"),
        Map.entry("competencia", "Skills"),
        Map.entry("habilidades", "Skills"),
        Map.entry("tecnologias", "Technologies"),
        Map.entry("tecnologia", "Technologies"),
        Map.entry("soft skills", "Soft Skills"),
        Map.entry("outras habilidades", "Other Skills"),
        Map.entry("outros", "Other"),
        Map.entry("segurança", "Security"),
        Map.entry("front-end", "Front-End"),
        Map.entry("frontend", "Front-End"),
        Map.entry("back-end", "Back-End"),
        Map.entry("backend", "Back-End"),
        Map.entry("mobile", "Mobile"),
        Map.entry("testes", "Testing"),
        Map.entry("teste", "Testing"),
        Map.entry("infraestrutura", "Infrastructure"),
        Map.entry("plataformas", "Platforms"),
        Map.entry("sistemas operacionais", "Operating Systems"),
        Map.entry("arquitetura", "Architecture"),
        Map.entry("mensageria", "Messaging"),
        Map.entry("monitoramento", "Monitoring"),
        Map.entry("versionamento", "Version Control"),
        Map.entry("controle de versão", "Version Control"),
        Map.entry("controle de versao", "Version Control"),
        Map.entry("ciência de dados", "Data Science"),
        Map.entry("análise de dados", "Data Analysis")
    );

    /** Common Portuguese tech terms found inside skill items. */
    private static final Map<String, String> PT_TECH_TERMS_TO_EN = Map.ofEntries(
        Map.entry("ágil", "Agile"),
        Map.entry("agil", "Agile"),
        Map.entry("ágeis", "Agile"),
        Map.entry("ageis", "Agile"),
        Map.entry("metodologia ágil", "Agile Methodology"),
        Map.entry("metodologias ágeis", "Agile Methodologies"),
        Map.entry("metodologias ageis", "Agile Methodologies"),
        Map.entry("desenvolvimento ágil", "Agile Development"),
        Map.entry("orientação a objetos", "Object-Oriented Programming"),
        Map.entry("orientacao a objetos", "Object-Oriented Programming"),
        Map.entry("programação orientada a objetos", "Object-Oriented Programming"),
        Map.entry("gestão de projetos", "Project Management"),
        Map.entry("gerenciamento de projetos", "Project Management"),
        Map.entry("microsserviços", "Microservices"),
        Map.entry("microsservicos", "Microservices"),
        Map.entry("computação em nuvem", "Cloud Computing"),
        Map.entry("inteligência artificial", "Artificial Intelligence"),
        Map.entry("aprendizado de máquina", "Machine Learning"),
        Map.entry("aprendizado de maquina", "Machine Learning"),
        Map.entry("processamento de linguagem natural", "Natural Language Processing"),
        Map.entry("análise de dados", "Data Analysis"),
        Map.entry("ciência de dados", "Data Science"),
        Map.entry("banco de dados relacional", "Relational Database"),
        Map.entry("banco de dados", "Database"),
        Map.entry("segurança da informação", "Information Security"),
        Map.entry("desenvolvimento web", "Web Development"),
        Map.entry("desenvolvimento mobile", "Mobile Development"),
        Map.entry("integração contínua", "Continuous Integration"),
        Map.entry("entrega contínua", "Continuous Delivery"),
        Map.entry("testes unitários", "Unit Testing"),
        Map.entry("testes de integração", "Integration Testing"),
        Map.entry("testes automatizados", "Automated Testing"),
        Map.entry("arquitetura de software", "Software Architecture"),
        Map.entry("arquitetura de microsserviços", "Microservices Architecture"),
        Map.entry("controle de versão", "Version Control"),
        Map.entry("programação funcional", "Functional Programming"),
        Map.entry("programação reativa", "Reactive Programming")
    );

    /**
     * Ordered list of PT-BR academic terms to replace in degree/course strings.
     * Applied as case-insensitive Unicode substring replacements (longest first to avoid partial matches).
     */
    private static final String[][] DEGREE_REPLACEMENTS = {
        // Degree type + "em/in" connector (longest first)
        {"Bacharelado em", "Bachelor's in"},
        {"Licenciatura em", "Teaching Degree in"},
        {"Tecnólogo em", "Technology Degree in"},
        {"Tecnologia em", "Technology Degree in"},
        {"Mestrado em", "Master's in"},
        {"Doutorado em", "Doctorate in"},
        {"Especialização em", "Specialization in"},
        {"Especializacao em", "Specialization in"},
        {"Pós-Graduação em", "Post-Graduate in"},
        {"Pós-graduação em", "Post-Graduate in"},
        {"Pos-Graduacao em", "Post-Graduate in"},
        {"Curso Técnico em", "Technical Degree in"},
        {"Técnico em", "Technical Degree in"},
        {"Tecnico em", "Technical Degree in"},
        // Degree types standalone
        {"Bacharelado", "Bachelor's Degree"},
        {"Licenciatura", "Teaching Degree"},
        {"Tecnólogo", "Technology Degree"},
        {"Tecnologo", "Technology Degree"},
        {"Tecnologia", "Technology"},
        {"Mestrado", "Master's Degree"},
        {"Doutorado", "Doctorate"},
        {"Especialização", "Specialization"},
        {"Especializacao", "Specialization"},
        {"Pós-Graduação", "Post-Graduate"},
        {"Pós-graduação", "Post-Graduate"},
        {"Pos-Graduacao", "Post-Graduate"},
        {"Técnico", "Technical"},
        {"Tecnico", "Technical"},
        // Fields of study (longest/most specific first)
        {"Ciência da Computação", "Computer Science"},
        {"Ciencia da Computacao", "Computer Science"},
        {"Ciências da Computação", "Computer Science"},
        {"Sistemas de Informação", "Information Systems"},
        {"Sistemas de Informacao", "Information Systems"},
        {"Engenharia de Software", "Software Engineering"},
        {"Engenharia da Computação", "Computer Engineering"},
        {"Engenharia da Computacao", "Computer Engineering"},
        {"Engenharia de Computação", "Computer Engineering"},
        {"Engenharia de Computacao", "Computer Engineering"},
        {"Análise e Desenvolvimento de Sistemas", "Systems Analysis and Development"},
        {"Analise e Desenvolvimento de Sistemas", "Systems Analysis and Development"},
        {"Análise de Sistemas", "Systems Analysis"},
        {"Analise de Sistemas", "Systems Analysis"},
        {"Desenvolvimento de Software", "Software Development"},
        {"Inteligência Artificial", "Artificial Intelligence"},
        {"Inteligencia Artificial", "Artificial Intelligence"},
        {"Ciência de Dados", "Data Science"},
        {"Ciencia de Dados", "Data Science"},
        {"Ciências de Dados", "Data Science"},
        {"Segurança da Informação", "Information Security"},
        {"Seguranca da Informacao", "Information Security"},
        {"Redes de Computadores", "Computer Networks"},
        {"Engenharia Civil", "Civil Engineering"},
        {"Engenharia Elétrica", "Electrical Engineering"},
        {"Engenharia Eletrica", "Electrical Engineering"},
        {"Engenharia Mecânica", "Mechanical Engineering"},
        {"Engenharia Mecanica", "Mechanical Engineering"},
        {"Engenharia Química", "Chemical Engineering"},
        {"Engenharia Quimica", "Chemical Engineering"},
        {"Engenharia de Produção", "Production Engineering"},
        {"Engenharia de Producao", "Production Engineering"},
        {"Administração", "Business Administration"},
        {"Administracao", "Business Administration"},
        {"Matemática", "Mathematics"},
        {"Matematica", "Mathematics"},
        {"Física", "Physics"},
        {"Fisica", "Physics"},
        {"Química", "Chemistry"},
        {"Quimica", "Chemistry"},
        {"Biologia", "Biology"},
        {"Economia", "Economics"},
        {"Direito", "Law"},
        {"Medicina", "Medicine"},
        {"Enfermagem", "Nursing"},
        {"Psicologia", "Psychology"},
        {"Arquitetura e Urbanismo", "Architecture and Urban Planning"},
        {"Arquitetura", "Architecture"},
        {"Design Gráfico", "Graphic Design"},
        {"Design Grafico", "Graphic Design"},
        {"Comunicação Social", "Social Communication"},
        {"Comunicacao Social", "Social Communication"},
        {"Jornalismo", "Journalism"},
        {"Publicidade e Propaganda", "Advertising and Propaganda"},
        {"Publicidade", "Advertising"},
        {"Ciências Contábeis", "Accounting Sciences"},
        {"Ciencias Contabeis", "Accounting Sciences"},
        {"Contabilidade", "Accounting"},
        {"Farmácia", "Pharmacy"},
        {"Farmacia", "Pharmacy"},
        {"Odontologia", "Dentistry"},
        {"Nutrição", "Nutrition"},
        {"Nutricao", "Nutrition"},
        {"Educação Física", "Physical Education"},
        {"Educacao Fisica", "Physical Education"},
        {"Pedagogia", "Pedagogy"},
        {"Turismo", "Tourism"},
        {"Relações Internacionais", "International Relations"},
        {"Relacoes Internacionais", "International Relations"},
        {"Gastronomia", "Gastronomy"},
    };

    /**
     * Institution name prefix translations.
     * Ordered longest/most-specific first to avoid partial matches.
     * Format: {"Portuguese prefix (case-insensitive)", "English replacement"}
     * The remainder of the institution name is appended after the replacement.
     */
    private static final String[][] INSTITUTION_PREFIX_MAP = {
        // PUC variants
        {"Pontifícia Universidade Católica de", "Pontifical Catholic University of"},
        {"Pontifícia Universidade Católica do", "Pontifical Catholic University of"},
        {"Pontifícia Universidade Católica da", "Pontifical Catholic University of"},
        {"Pontifícia Universidade Católica", "Pontifical Catholic University"},
        // Federal rural
        {"Universidade Federal Rural de", "Federal Rural University of"},
        {"Universidade Federal Rural do", "Federal Rural University of"},
        {"Universidade Federal Rural da", "Federal Rural University of"},
        // Federal
        {"Universidade Federal de", "Federal University of"},
        {"Universidade Federal do", "Federal University of"},
        {"Universidade Federal da", "Federal University of"},
        // Estadual
        {"Universidade Estadual de", "State University of"},
        {"Universidade Estadual do", "State University of"},
        {"Universidade Estadual da", "State University of"},
        // "do Estado de/do/da" — must come before plain "do/da/de"
        {"Universidade do Estado de", "State University of"},
        {"Universidade do Estado do", "State University of"},
        {"Universidade do Estado da", "State University of"},
        // Municipal
        {"Universidade Municipal de", "Municipal University of"},
        {"Universidade Municipal do", "Municipal University of"},
        {"Universidade Municipal da", "Municipal University of"},
        // Generic Universidade de/do/da — must come AFTER all specific variants above
        {"Universidade de", "University of"},
        {"Universidade do", "University of"},
        {"Universidade da", "University of"},
        // IFET (full name) — must come before short "Instituto Federal"
        {"Instituto Federal de Educação, Ciência e Tecnologia de", "Federal Institute of Education, Science and Technology of"},
        {"Instituto Federal de Educação, Ciência e Tecnologia do", "Federal Institute of Education, Science and Technology of"},
        {"Instituto Federal de Educação, Ciência e Tecnologia da", "Federal Institute of Education, Science and Technology of"},
        {"Instituto Federal de Educação, Ciência e Tecnologia", "Federal Institute of Education, Science and Technology"},
        // Short Instituto Federal
        {"Instituto Federal de", "Federal Institute of"},
        {"Instituto Federal do", "Federal Institute of"},
        {"Instituto Federal da", "Federal Institute of"},
        {"Instituto Federal", "Federal Institute"},
        // Generic Instituto
        {"Instituto de", "Institute of"},
        {"Instituto do", "Institute of"},
        {"Instituto da", "Institute of"},
        // CEFET
        {"Centro Federal de Educação Tecnológica de", "Federal Center of Technological Education of"},
        {"Centro Federal de Educação Tecnológica do", "Federal Center of Technological Education of"},
        {"Centro Federal de Educação Tecnológica da", "Federal Center of Technological Education of"},
        // Centro Universitário
        {"Centro Universitário de", "University Center of"},
        {"Centro Universitário do", "University Center of"},
        {"Centro Universitário da", "University Center of"},
        // Escola Superior
        {"Escola Superior de", "Graduate School of"},
        {"Escola Superior do", "Graduate School of"},
        {"Escola Superior da", "Graduate School of"},
        // Faculdade de/do/da (field of study) — "Faculdade ProperName" handled by regex below
        {"Faculdade de", "School of"},
        {"Faculdade do", "School of"},
        {"Faculdade da", "School of"},
    };

    // Prepositions that indicate a field/place name follows (vs. a proper name)
    private static final Pattern PT_PREPOSITION =
        Pattern.compile("(?i)^(de|do|da|dos|das)\\b.*");

    private static final Map<String, String> BR_STATES = Map.ofEntries(
        Map.entry("AC", "Acre"),
        Map.entry("AL", "Alagoas"),
        Map.entry("AP", "Amapá"),
        Map.entry("AM", "Amazonas"),
        Map.entry("BA", "Bahia"),
        Map.entry("CE", "Ceará"),
        Map.entry("DF", "Distrito Federal"),
        Map.entry("ES", "Espírito Santo"),
        Map.entry("GO", "Goiás"),
        Map.entry("MA", "Maranhão"),
        Map.entry("MT", "Mato Grosso"),
        Map.entry("MS", "Mato Grosso do Sul"),
        Map.entry("MG", "Minas Gerais"),
        Map.entry("PA", "Pará"),
        Map.entry("PB", "Paraíba"),
        Map.entry("PR", "Paraná"),
        Map.entry("PE", "Pernambuco"),
        Map.entry("PI", "Piauí"),
        Map.entry("RJ", "Rio de Janeiro"),
        Map.entry("RN", "Rio Grande do Norte"),
        Map.entry("RS", "Rio Grande do Sul"),
        Map.entry("RO", "Rondônia"),
        Map.entry("RR", "Roraima"),
        Map.entry("SC", "Santa Catarina"),
        Map.entry("SP", "São Paulo"),
        Map.entry("SE", "Sergipe"),
        Map.entry("TO", "Tocantins")
    );

    private static final Logger logger = LoggerFactory.getLogger(ResumeTranslationService.class);
    private final OpenRouterService openRouterService;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    @Lazy
    private GeminiService geminiService;

    public ResumeTranslationService(OpenRouterService openRouterService, ObjectMapper objectMapper) {
        this.openRouterService = openRouterService;
        this.objectMapper = objectMapper;
    }

    /**
     * Translate resume from Portuguese to English using AI.
     * Returns the full Resume object with all fields translated.
     */
    public Resume translateToEnglish(Resume resume) throws IOException {
        String prompt = buildTranslationPrompt(resume);
        String aiResponse;

        if (geminiService != null && geminiService.isAvailable()) {
            try {
                logger.info("Using Gemini for resume translation (JSON mode)");
                aiResponse = geminiService.generateJson(prompt);
            } catch (IOException e) {
                logger.warn("Gemini failed for translation, falling back to OpenRouter: {}", e.getMessage());
                aiResponse = openRouterService.generateJson(prompt);
            }
        } else {
            aiResponse = openRouterService.generateJson(prompt);
        }

        Resume translated = parseTranslatedResume(aiResponse, resume);

        // Second pass: translate bullets + project descriptions as a flat list.
        // This is far more reliable than embedding long text inside a complex JSON object.
        try {
            translateBulletsAndDescriptions(translated, resume);
        } catch (Exception e) {
            logger.warn("Bullet translation second pass failed, using first-pass result: {}", e.getMessage());
        }

        // Post-process: replace Portuguese month names in all date fields
        translateDatesInResume(translated);

        return translated;
    }

    /**
     * Second-pass: translates experience bullets, project descriptions and project bullets
     * as a flat numbered list — much harder for the AI to truncate than an embedded JSON blob.
     */
    @SuppressWarnings("unchecked")
    private void translateBulletsAndDescriptions(Resume translated, Resume original) throws IOException {
        // type 0 = experience bullet [expIdx, bulletIdx]
        // type 1 = project description [projIdx, -1]
        // type 2 = project bullet [projIdx, bulletIdx]
        List<String> items = new ArrayList<>();
        List<int[]> mapping = new ArrayList<>();

        if (original.getExperience() != null) {
            for (int i = 0; i < original.getExperience().size(); i++) {
                List<String> bullets = original.getExperience().get(i).getBullets();
                if (bullets != null) {
                    for (int j = 0; j < bullets.size(); j++) {
                        items.add(bullets.get(j));
                        mapping.add(new int[]{0, i, j});
                    }
                }
            }
        }

        if (original.getProjects() != null) {
            for (int i = 0; i < original.getProjects().size(); i++) {
                Resume.Project proj = original.getProjects().get(i);
                if (proj.getDescription() != null && !proj.getDescription().isBlank()) {
                    items.add(proj.getDescription());
                    mapping.add(new int[]{1, i, -1});
                }
                if (proj.getBullets() != null) {
                    for (int j = 0; j < proj.getBullets().size(); j++) {
                        items.add(proj.getBullets().get(j));
                        mapping.add(new int[]{2, i, j});
                    }
                }
            }
        }

        if (items.isEmpty()) return;

        String itemsJson = objectMapper.writeValueAsString(items);
        String prompt = """
            Translate each item from Portuguese to English. Professional resume tone.
            RULES:
            1. Return ONLY a JSON array with EXACTLY %d string elements — no markdown, no extra text
            2. Each output item corresponds 1-to-1 with the same-index input item
            3. Translate EVERY word of each item — NEVER truncate, shorten, summarize or use "..."
            4. Keep technical names as-is (React, Java, Docker, REST API, etc.)

            INPUT:
            %s

            OUTPUT: the JSON array only.
            """.formatted(items.size(), itemsJson);

        String response;
        if (geminiService != null && geminiService.isAvailable()) {
            try {
                response = geminiService.generateJson(prompt);
            } catch (IOException e) {
                response = openRouterService.generateJson(prompt);
            }
        } else {
            response = openRouterService.generateJson(prompt);
        }

        String jsonStr = extractJSON(response);
        // The response is a JSON array, not object — find '[' instead of '{'
        int arrStart = jsonStr.indexOf('[');
        int arrEnd   = jsonStr.lastIndexOf(']');
        if (arrStart >= 0 && arrEnd > arrStart) {
            jsonStr = jsonStr.substring(arrStart, arrEnd + 1);
        }

        List<String> translatedItems = objectMapper.readValue(jsonStr,
            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));

        if (translatedItems.size() != items.size()) {
            logger.warn("Bullet translation returned {} items, expected {}", translatedItems.size(), items.size());
        }

        for (int i = 0; i < Math.min(translatedItems.size(), mapping.size()); i++) {
            int[] map = mapping.get(i);
            String text = translatedItems.get(i);
            if (text == null || text.isBlank()) continue;

            if (map[0] == 0 && translated.getExperience() != null && map[1] < translated.getExperience().size()) {
                List<String> bullets = translated.getExperience().get(map[1]).getBullets();
                if (bullets == null) {
                    bullets = new ArrayList<>();
                    translated.getExperience().get(map[1]).setBullets(bullets);
                }
                while (bullets.size() <= map[2]) bullets.add("");
                bullets.set(map[2], text);
            } else if (map[0] == 1 && translated.getProjects() != null && map[1] < translated.getProjects().size()) {
                translated.getProjects().get(map[1]).setDescription(text);
            } else if (map[0] == 2 && translated.getProjects() != null && map[1] < translated.getProjects().size()) {
                List<String> bullets = translated.getProjects().get(map[1]).getBullets();
                if (bullets == null) {
                    bullets = new ArrayList<>();
                    translated.getProjects().get(map[1]).setBullets(bullets);
                }
                while (bullets.size() <= map[2]) bullets.add("");
                bullets.set(map[2], text);
            }
        }
    }

    /** Replaces Portuguese month names with English equivalents in all date string fields. */
    private void translateDatesInResume(Resume resume) {
        if (resume.getExperience() != null) {
            for (Resume.Experience exp : resume.getExperience()) {
                exp.setStartDate(translateMonthNames(exp.getStartDate()));
                exp.setEndDate(translateMonthNames(exp.getEndDate()));
            }
        }
        if (resume.getProjects() != null) {
            for (Resume.Project proj : resume.getProjects()) {
                proj.setStartDate(translateMonthNames(proj.getStartDate()));
                proj.setEndDate(translateMonthNames(proj.getEndDate()));
            }
        }
        if (resume.getEducation() != null) {
            for (Resume.Education edu : resume.getEducation()) {
                edu.setStartDate(translateMonthNames(edu.getStartDate()));
                edu.setGraduationDate(translateMonthNames(edu.getGraduationDate()));
            }
        }
        if (resume.getCertifications() != null) {
            for (Resume.Certification cert : resume.getCertifications()) {
                cert.setDate(translateMonthNames(cert.getDate()));
            }
        }
    }

    private String translateMonthNames(String text) {
        if (text == null || text.isBlank()) return text;
        String result = text;
        for (String[] pair : PT_MONTHS) {
            result = result.replaceAll("(?iu)\\b" + pair[0] + "\\b", pair[1]);
        }
        return result;
    }

    private String buildTranslationPrompt(Resume resume) throws IOException {
        // Serialize resume to JSON for AI
        String resumeJson = objectMapper.writeValueAsString(resume);

        return """
            You are a professional translator specializing in resumes/CVs. Translate the following resume from Portuguese to English.

            CRITICAL RULES:
            1. Return ONLY valid JSON — no markdown, no code blocks, no explanations, nothing before or after the JSON
            2. Translate ONLY: title, summary, experience job titles and bullet points, project descriptions and bullet points, education degree names, certification names, skill names, language names
            3. Keep the EXACT same JSON structure — same keys, same number of array entries
            4. NEVER add or remove array entries (experience, projects, education, certifications, languages must have the SAME COUNT as input)
            5. Do NOT translate and keep EXACTLY as-is: dates, emails, phone numbers, URLs, company names, university names, person names, project names, technology names (e.g. Java, React, Docker)
            6. For the "level" field of languages, use ONLY one of these exact English values: "Native", "Fluent", "Advanced", "Intermediate", "Basic", "Elementary"
               Examples: "Nativo"→"Native", "Fluente"→"Fluent", "Avançado"→"Advanced", "Intermediário"→"Intermediate", "Básico"/"Básico"→"Basic", "Elementar"→"Elementary"
            7. Use professional, ATS-friendly English
            8. PRESERVE THE FULL LENGTH — translate EVERY sentence verbatim. NEVER truncate, summarize, paraphrase, rewrite or use "..." to shorten text. If the input has 3 sentences, the output must have 3 translated sentences. This rule is absolute.
            9. Translate experience job titles fully (e.g. "Desenvolvedora Senior" → "Senior Software Developer", "Analista de Sistemas" → "Systems Analyst").
            10. Translate each bullet point completely — do NOT omit, merge or shorten any bullet.
            11. SUMMARY field: translate each sentence one-by-one in order. The result must contain the same sentences as the source, fully translated, nothing removed.

            INPUT RESUME (Portuguese):
            """ + resumeJson + """

            OUTPUT: Return the complete translated resume as JSON with the same structure.
            """;
    }

    private Resume parseTranslatedResume(String aiResponse, Resume originalResume) throws IOException {
        try {
            if (aiResponse == null || aiResponse.isBlank()) {
                throw new IOException("Empty translation response from AI");
            }

            logger.debug("AI Translation response received (length: {})", aiResponse.length());

            // Extract JSON from response
            String jsonStr = extractJSON(aiResponse);

            logger.debug("Extracted JSON length: {}", jsonStr.length());

            // Parse the translated resume
            Resume translatedResume = objectMapper.readValue(jsonStr, Resume.class);

            // Preserve metadata from original
            translatedResume.setId(originalResume.getId());
            translatedResume.setUserId(originalResume.getUserId());
            translatedResume.setCreatedAt(originalResume.getCreatedAt());
            translatedResume.setUpdatedAt(originalResume.getUpdatedAt());
            translatedResume.setLanguage("en");

            // Fail closed against raw AI output BEFORE post-processing.
            // Post-processing (e.g. translateDegreeText) would otherwise mask an unchanged response.
            if (isEffectivelyUnchanged(originalResume, translatedResume)) {
                throw new IOException("AI returned untranslated content");
            }

            // Restore fields the AI must NOT have changed (project names/URLs/techs, personalInfo contacts, entry counts)
            // Also applies degree translation dictionary and skill category/item dictionaries.
            restoreNonTranslatableFields(translatedResume, originalResume);

            // Normalize language levels to standard English values
            normalizeLanguageLevels(translatedResume);

            // Normalize Brazilian locations to US format (e.g. "São Paulo, SP" → "São Paulo, Brazil")
            normalizeResumeLocations(translatedResume);

            logger.info("Successfully translated resume {}", originalResume.getId());
            return translatedResume;

        } catch (Exception e) {
            logger.error("Failed to parse translated resume: {} (response length: {})",
                e.getMessage(), aiResponse != null ? aiResponse.length() : 0);
            throw new IOException("Failed to translate resume content into valid English JSON", e);
        }
    }

    private String extractJSON(String text) {
        // Remove markdown code blocks if present
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }

        // Find first { and last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }

        return text.trim();
    }

    private boolean isEffectivelyUnchanged(Resume original, Resume translated) {
        String source = normalize(buildTextFingerprint(original));
        String target = normalize(buildTextFingerprint(translated));

        if (source.isBlank() || target.isBlank()) {
            return false;
        }

        return source.equals(target);
    }

    private String buildTextFingerprint(Resume resume) {
        if (resume == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();

        appendText(sb, resume.getTitle());
        appendText(sb, resume.getSummary());

        if (resume.getExperience() != null) {
            for (Resume.Experience exp : resume.getExperience()) {
                appendText(sb, exp.getTitle());
                appendText(sb, exp.getCompany());
                appendText(sb, exp.getLocation());
                if (exp.getBullets() != null) {
                    for (String bullet : exp.getBullets()) {
                        appendText(sb, bullet);
                    }
                }
            }
        }

        if (resume.getProjects() != null) {
            for (Resume.Project proj : resume.getProjects()) {
                appendText(sb, proj.getName());
                appendText(sb, proj.getDescription());
                if (proj.getBullets() != null) {
                    for (String bullet : proj.getBullets()) {
                        appendText(sb, bullet);
                    }
                }
            }
        }

        if (resume.getEducation() != null) {
            for (Resume.Education edu : resume.getEducation()) {
                appendText(sb, edu.getDegree());
                appendText(sb, edu.getInstitution());
                appendText(sb, edu.getLocation());
            }
        }

        if (resume.getSkills() != null) {
            for (String skill : resume.getSkills()) {
                appendText(sb, skill);
            }
        }

        if (resume.getCertifications() != null) {
            for (Resume.Certification cert : resume.getCertifications()) {
                appendText(sb, cert.getName());
                appendText(sb, cert.getIssuer());
            }
        }

        if (resume.getLanguages() != null) {
            for (Resume.Language lang : resume.getLanguages()) {
                appendText(sb, lang.getName());
                appendText(sb, lang.getLevel());
            }
        }

        return sb.toString();
    }

    private void appendText(StringBuilder sb, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append(' ');
        }
        sb.append(value);
    }

    /**
     * Copies fields that the AI must not change (contact info, project names/URLs/technologies,
     * company names) from the original resume to the translated resume.
     * Also trims hallucinated extra entries to match the original count.
     */
    private void restoreNonTranslatableFields(Resume translated, Resume original) {
        // Personal info: preserve contact fields verbatim
        if (original.getPersonalInfo() != null) {
            Resume.PersonalInfo orig = original.getPersonalInfo();
            if (translated.getPersonalInfo() == null) {
                translated.setPersonalInfo(new Resume.PersonalInfo());
            }
            Resume.PersonalInfo trans = translated.getPersonalInfo();
            trans.setFullName(orig.getFullName());
            trans.setEmail(orig.getEmail());
            trans.setPhone(orig.getPhone());
            trans.setLinkedin(orig.getLinkedin());
            trans.setGithub(orig.getGithub());
            trans.setWebsite(orig.getWebsite());
            // Restore original location so normalizeResumeLocations always has a non-null value to work with
            trans.setLocation(orig.getLocation());
        }

        // Experience: trim hallucinated entries; restore company + location from original
        if (original.getExperience() != null) {
            List<Resume.Experience> origList = original.getExperience();
            List<Resume.Experience> transList = translated.getExperience();
            if (transList == null) {
                translated.setExperience(new ArrayList<>(origList));
            } else {
                // Trim if AI added extra entries
                while (transList.size() > origList.size()) {
                    transList.remove(transList.size() - 1);
                }
                for (int i = 0; i < transList.size(); i++) {
                    transList.get(i).setCompany(origList.get(i).getCompany());
                }
            }
        }

        // Projects: trim hallucinated entries; restore name, URL, technologies from original
        if (original.getProjects() != null) {
            List<Resume.Project> origList = original.getProjects();
            List<Resume.Project> transList = translated.getProjects();
            if (transList == null) {
                translated.setProjects(new ArrayList<>(origList));
            } else {
                while (transList.size() > origList.size()) {
                    transList.remove(transList.size() - 1);
                }
                for (int i = 0; i < transList.size(); i++) {
                    Resume.Project origProj = origList.get(i);
                    Resume.Project transProj = transList.get(i);
                    transProj.setName(origProj.getName());
                    transProj.setUrl(origProj.getUrl());
                    transProj.setTechnologies(origProj.getTechnologies());
                }
            }
        }

        // Education: trim hallucinated entries; restore institution from original
        if (original.getEducation() != null) {
            List<Resume.Education> origList = original.getEducation();
            List<Resume.Education> transList = translated.getEducation();
            if (transList == null) {
                translated.setEducation(new ArrayList<>(origList));
            } else {
                while (transList.size() > origList.size()) {
                    transList.remove(transList.size() - 1);
                }
                for (int i = 0; i < transList.size(); i++) {
                    transList.get(i).setInstitution(translateInstitutionName(origList.get(i).getInstitution()));
                    // Translate degree using our dictionary (AI often misses this)
                    transList.get(i).setDegree(translateDegreeText(transList.get(i).getDegree()));
                }
            }
        }

        // SkillGroups: always rebuild from original to avoid AI flattening them into the skills array.
        // Category names and PT-BR tech terms are translated via our dictionary.
        if (original.getSkillGroups() != null && !original.getSkillGroups().isEmpty()) {
            List<Resume.SkillGroup> restored = new ArrayList<>();
            for (Resume.SkillGroup origGroup : original.getSkillGroups()) {
                Resume.SkillGroup g = new Resume.SkillGroup();
                g.setCategory(translateCategoryName(origGroup.getCategory()));
                if (origGroup.getItems() != null) {
                    g.setItems(origGroup.getItems().stream()
                        .map(this::translateTechTerm)
                        .collect(Collectors.toList()));
                }
                restored.add(g);
            }
            translated.setSkillGroups(restored);
            translated.setSkills(null); // clear flat skills — groups take priority
        }

        // Languages: restore levels from original (already stored in English) to prevent AI from changing them
        if (original.getLanguages() != null) {
            List<Resume.Language> origLangs = original.getLanguages();
            List<Resume.Language> transLangs = translated.getLanguages();
            if (transLangs != null) {
                while (transLangs.size() > origLangs.size()) {
                    transLangs.remove(transLangs.size() - 1);
                }
                for (int i = 0; i < transLangs.size(); i++) {
                    transLangs.get(i).setLevel(normalizeLanguageLevel(origLangs.get(i).getLevel()));
                    transLangs.get(i).setName(translateLanguageName(origLangs.get(i).getName()));
                }
            }
        }

        // Project bullets fallback: if AI dropped the bullets array, copy original (untranslated is better than missing)
        if (original.getProjects() != null && translated.getProjects() != null) {
            List<Resume.Project> origProjs = original.getProjects();
            List<Resume.Project> transProjs = translated.getProjects();
            for (int i = 0; i < Math.min(origProjs.size(), transProjs.size()); i++) {
                if ((transProjs.get(i).getBullets() == null || transProjs.get(i).getBullets().isEmpty())
                        && origProjs.get(i).getBullets() != null && !origProjs.get(i).getBullets().isEmpty()) {
                    transProjs.get(i).setBullets(origProjs.get(i).getBullets());
                }
            }
        }
    }

    /**
     * Translates a Brazilian institution name to English following international conventions.
     * <ul>
     *   <li>"Universidade Federal do Rio de Janeiro" → "Federal University of Rio de Janeiro"</li>
     *   <li>"Universidade do Estado do Rio de Janeiro" → "State University of Rio de Janeiro"</li>
     *   <li>"Instituto Federal de Minas Gerais" → "Federal Institute of Minas Gerais"</li>
     *   <li>"Faculdade de Medicina" → "School of Medicine"</li>
     *   <li>"Faculdade Estácio de Sá" → "Estácio de Sá College" (proper name → suffix)</li>
     *   <li>"Universidade Positivo" → "Positivo University" (proper name → suffix)</li>
     *   <li>"Centro Universitário FMU" → "FMU University Center" (proper name → suffix)</li>
     * </ul>
     */
    String translateInstitutionName(String institution) {
        if (institution == null || institution.isBlank()) return institution;

        String lower = institution.toLowerCase(Locale.ROOT);

        // 1. Try prefix map (case-insensitive, longest-first ordering)
        for (String[] pair : INSTITUTION_PREFIX_MAP) {
            String prefix = pair[0].toLowerCase(Locale.ROOT);
            if (lower.startsWith(prefix)) {
                String rest = institution.substring(pair[0].length()).trim();
                if (rest.isEmpty()) {
                    // Strip trailing "of" when nothing follows: "Universidade de" alone → "University"
                    return pair[1].replaceAll("(?i)\\s+of\\s*$", "").trim();
                }
                return pair[1] + " " + rest;
            }
        }

        // 2. Proper-name fallback: "TypeWord ProperName" → "ProperName EnglishType"
        //    Only when the word after the type is NOT a Portuguese preposition (de/do/da...).
        String[][] properNameTypes = {
            {"universidade",      "University"},
            {"faculdade",         "College"},
            {"centro universitário", "University Center"},
            {"instituto",         "Institute"},
            {"escola superior",   "Graduate School"},
        };
        for (String[] pair : properNameTypes) {
            String typeWord = pair[0];
            if (lower.startsWith(typeWord)) {
                String rest = institution.substring(typeWord.length()).trim();
                if (!rest.isEmpty() && !PT_PREPOSITION.matcher(rest).matches()) {
                    return rest + " " + pair[1];
                }
            }
        }

        return institution; // no match — keep original
    }

    private String translateLanguageName(String name) {
        if (name == null || name.isBlank()) return name;
        String key = name.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[áàâãä]", "a").replaceAll("[éèêë]", "e")
            .replaceAll("[íìîï]", "i").replaceAll("[óòôõö]", "o")
            .replaceAll("[úùûü]", "u").replaceAll("[ç]", "c");
        String mapped = PT_LANGUAGE_NAMES_TO_EN.get(key);
        return mapped != null ? mapped : name;
    }

    private String translateCategoryName(String category) {
        if (category == null || category.isBlank()) return category;
        String key = category.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[áàâãä]", "a").replaceAll("[éèêë]", "e")
            .replaceAll("[íìîï]", "i").replaceAll("[óòôõö]", "o")
            .replaceAll("[úùûü]", "u").replaceAll("[ç]", "c");
        String mapped = PT_CATEGORY_TO_EN.get(key);
        return mapped != null ? mapped : category;
    }

    /**
     * Translates a degree/course string by replacing known PT-BR academic terms with their English equivalents.
     * E.g. "Bacharelado em Ciência da Computação" → "Bachelor's in Computer Science"
     * Safe to call even if the string is already in English (no matches → unchanged).
     */
    private String translateDegreeText(String degree) {
        if (degree == null || degree.isBlank()) return degree;
        String result = degree;
        for (String[] pair : DEGREE_REPLACEMENTS) {
            result = result.replaceAll("(?iu)" + Pattern.quote(pair[0]), pair[1]);
        }
        return result;
    }

    private String translateTechTerm(String item) {
        if (item == null || item.isBlank()) return item;
        String key = item.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[áàâãä]", "a").replaceAll("[éèêë]", "e")
            .replaceAll("[íìîï]", "i").replaceAll("[óòôõö]", "o")
            .replaceAll("[úùûü]", "u").replaceAll("[ç]", "c");
        String mapped = PT_TECH_TERMS_TO_EN.get(key);
        return mapped != null ? mapped : item;
    }

    /**
     * Normalizes language level strings to standard English values.
     * Handles cases where the AI returns incorrect formats like "english-basic".
     */
    private void normalizeLanguageLevels(Resume resume) {
        if (resume.getLanguages() == null) return;
        for (Resume.Language lang : resume.getLanguages()) {
            lang.setLevel(normalizeLanguageLevel(lang.getLevel()));
        }
    }

    private String normalizeLanguageLevel(String level) {
        if (level == null || level.isBlank()) return level;
        String lower = level.toLowerCase(Locale.ROOT).replaceAll("[^a-záéíóúàâêôãõçü]", "");
        if (lower.contains("nativ") || lower.contains("nativo")) return "Native";
        if (lower.contains("fluent") || lower.contains("fluente")) return "Fluent";
        if (lower.contains("advanced") || lower.contains("avan")) return "Advanced";
        if (lower.contains("intermediate") || lower.contains("intermedi")) return "Intermediate";
        if (lower.contains("basic") || lower.contains("bsic") || lower.contains("bási") || lower.contains("basico")) return "Basic";
        if (lower.contains("element")) return "Elementary";
        // Already a valid English level? Return as-is
        return level;
    }

    /**
     * Applies location normalization to all location fields of a translated resume.
     */
    private void normalizeResumeLocations(Resume resume) {
        if (resume.getPersonalInfo() != null) {
            resume.getPersonalInfo().setLocation(
                normalizeLocationForEnglish(resume.getPersonalInfo().getLocation()));
        }
        if (resume.getExperience() != null) {
            resume.getExperience().forEach(exp ->
                exp.setLocation(normalizeLocationForEnglish(exp.getLocation())));
        }
        if (resume.getEducation() != null) {
            resume.getEducation().forEach(edu ->
                edu.setLocation(normalizeLocationForEnglish(edu.getLocation())));
        }
    }

    /**
     * Converts a Brazilian location string to US resume format.
     * <ul>
     *   <li>"São Paulo, SP"       → "São Paulo, Brazil"</li>
     *   <li>"Campinas, SP"        → "Campinas, Brazil"</li>
     *   <li>"São Paulo, SP, Brasil" → "São Paulo, Brazil"</li>
     *   <li>"Remote"              → "Remote" (unchanged)</li>
     * </ul>
     */
    String normalizeLocationForEnglish(String location) {
        if (location == null || location.isBlank()) return location;

        String[] parts = location.split(",");
        if (parts.length >= 2) {
            String stateCode = parts[1].trim().toUpperCase();
            if (BR_STATES.containsKey(stateCode)) {
                return parts[0].trim() + ", Brazil";
            }
        }

        // Normalize "Brasil" → "Brazil" if already written out
        if (location.toLowerCase(Locale.ROOT).contains("brasil")
                && !location.toLowerCase(Locale.ROOT).contains("brazil")) {
            return location.replaceAll("(?i)brasil", "Brazil");
        }

        return location;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .replaceAll("[^\\p{L}\\p{N} ]", "")
                .trim();
    }
}
