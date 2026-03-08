package com.resuna.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.resuna.model.PDFAnalysisResponse;

/**
 * Service for analyzing PDF resumes against job descriptions.
 * Combines PDF extraction, keyword matching, and AI suggestions.
 */
@Service
public class PDFAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(PDFAnalysisService.class);
    private static final int MAX_JOB_DESCRIPTION_CHARS = 8000;
    private static final int MAX_PROMPT_CHARS = 2500;
    private static final int MAX_RESUME_SNIPPET_CHARS = 3000;
    private static final int MAX_JOB_SNIPPET_CHARS = 2000;

    private final PDFExtractionService pdfExtractionService;
    private final OpenRouterService openRouterService;
    private final PDFSecurityService pdfSecurityService;

    // Synonym mappings for common tech terms (English + Portuguese)
    private static final Map<String, Set<String>> SYNONYM_MAP = new HashMap<>();
    static {
        // JavaScript variants
        SYNONYM_MAP.put("javascript", Set.of("js", "ecmascript", "es6", "es2015", "ecma"));
        SYNONYM_MAP.put("typescript", Set.of("ts"));
        // React variants
        SYNONYM_MAP.put("react", Set.of("reactjs", "react.js", "react js"));
        SYNONYM_MAP.put("angular", Set.of("angularjs", "angular.js", "angular 2+"));
        SYNONYM_MAP.put("vue", Set.of("vuejs", "vue.js", "vue 3"));
        SYNONYM_MAP.put("node.js", Set.of("nodejs", "node"));
        SYNONYM_MAP.put("next.js", Set.of("nextjs", "next"));
        // Database variants
        SYNONYM_MAP.put("postgresql", Set.of("postgres", "psql", "pgsql"));
        SYNONYM_MAP.put("mongodb", Set.of("mongo"));
        SYNONYM_MAP.put("sql server", Set.of("mssql", "microsoft sql", "ms sql"));
        SYNONYM_MAP.put("elasticsearch", Set.of("elastic"));
        SYNONYM_MAP.put("database", Set.of("banco de dados", "bancos de dados", "bd"));
        // Cloud variants
        SYNONYM_MAP.put("aws", Set.of("amazon web services", "amazon aws"));
        SYNONYM_MAP.put("gcp", Set.of("google cloud", "google cloud platform"));
        SYNONYM_MAP.put("azure", Set.of("microsoft azure", "ms azure"));
        SYNONYM_MAP.put("kubernetes", Set.of("k8s", "kube"));
        SYNONYM_MAP.put("docker", Set.of("containers", "containerization", "contêineres", "conteineres"));
        SYNONYM_MAP.put("cloud", Set.of("nuvem", "computação em nuvem", "cloud computing"));
        // Programming variants
        SYNONYM_MAP.put("c#", Set.of("csharp", "c sharp"));
        SYNONYM_MAP.put("c++", Set.of("cpp", "cplusplus"));
        SYNONYM_MAP.put("python", Set.of("py", "python3", "python 3"));

        // Bilingual: English <-> Portuguese
        SYNONYM_MAP.put("machine learning", Set.of("ml", "aprendizado de máquina", "aprendizado de maquina"));
        SYNONYM_MAP.put("artificial intelligence",
                Set.of("ai", "ia", "inteligência artificial", "inteligencia artificial"));
        SYNONYM_MAP.put("data science", Set.of("ciência de dados", "ciencia de dados"));
        SYNONYM_MAP.put("software development", Set.of("desenvolvimento de software", "dev"));
        SYNONYM_MAP.put("frontend", Set.of("front-end", "front end", "desenvolvimento frontend"));
        SYNONYM_MAP.put("backend", Set.of("back-end", "back end", "desenvolvimento backend"));
        SYNONYM_MAP.put("fullstack", Set.of("full-stack", "full stack", "desenvolvimento fullstack"));

        // CI/CD variants
        SYNONYM_MAP.put("ci/cd", Set.of("continuous integration", "continuous deployment", "cicd", "ci cd",
                "integração contínua", "integracao continua", "entrega contínua"));

        // APIs
        SYNONYM_MAP.put("rest", Set.of("restful", "rest api", "restful api", "api rest", "apis rest"));
        SYNONYM_MAP.put("graphql", Set.of("graph ql"));
        SYNONYM_MAP.put("api", Set.of("apis", "web api", "web services", "integração de sistemas"));

        // Methodologies
        SYNONYM_MAP.put("agile", Set.of("metodologias ágeis", "metodologias ageis", "ágil", "agil"));
        SYNONYM_MAP.put("scrum", Set.of("scrum master", "product owner"));

        // Soft skills bilingual
        SYNONYM_MAP.put("leadership", Set.of("liderança", "lideranca", "líder", "lider", "gestão de equipe"));
        SYNONYM_MAP.put("teamwork", Set.of("trabalho em equipe", "colaboração", "colaboracao"));
        SYNONYM_MAP.put("communication", Set.of("comunicação", "comunicacao"));
        SYNONYM_MAP.put("problem solving", Set.of("resolução de problemas", "resolucao de problemas"));

        // Testing bilingual
        SYNONYM_MAP.put("unit testing", Set.of("testes unitários", "testes unitarios", "teste unitário"));
        SYNONYM_MAP.put("automated testing", Set.of("testes automatizados", "automação de testes"));
    }

    // Comprehensive technical keywords organized by category (English + Portuguese)
    private static final Set<String> TECH_KEYWORDS = new HashSet<>(Arrays.asList(
            // Programming Languages
            "java", "python", "javascript", "typescript", "c++", "c#", "go", "golang", "rust", "ruby", "php",
            "swift", "kotlin", "scala", "r", "matlab", "perl", "sql", "html", "css", "bash", "shell",
            "objective-c", "dart", "elixir", "haskell", "clojure", "lua", "groovy", "f#", "cobol",

            // Frontend Frameworks & Libraries
            "react", "angular", "vue", "svelte", "ember", "backbone", "jquery", "bootstrap", "tailwind",
            "material ui", "chakra", "ant design", "redux", "mobx", "zustand", "recoil", "webpack", "vite",
            "babel", "sass", "scss", "less", "styled-components", "emotion", "framer motion",

            // Backend Frameworks
            "node.js", "express", "fastify", "nest.js", "koa", "django", "flask", "fastapi", "spring",
            "spring boot", ".net", "asp.net", "rails", "laravel", "symfony", "gin", "fiber", "actix",
            "phoenix", "sinatra", "dropwizard", "micronaut", "quarkus",

            // Mobile Development
            "react native", "flutter", "ionic", "xamarin", "swiftui", "jetpack compose", "android", "ios",
            "mobile development", "cordova", "nativescript",
            // PT-BR: Mobile
            "desenvolvimento mobile", "desenvolvimento móvel", "aplicativos móveis",

            // Databases
            "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "oracle", "sql server", "dynamodb",
            "cassandra", "neo4j", "sqlite", "firestore", "firebase", "mariadb", "couchdb", "cockroachdb",
            "influxdb", "timescaledb", "supabase", "prisma", "sequelize", "typeorm", "hibernate",
            // PT-BR: Databases
            "banco de dados", "bancos de dados", "modelagem de dados",

            // Cloud & Infrastructure
            "aws", "azure", "gcp", "google cloud", "heroku", "digitalocean", "vercel", "netlify", "cloudflare",
            "docker", "kubernetes", "k8s", "terraform", "pulumi", "cloudformation", "openshift", "rancher",
            "istio", "helm", "vagrant", "packer", "consul", "vault", "linux", "unix", "windows server",
            // PT-BR: Cloud
            "computação em nuvem", "infraestrutura como código", "serviços em nuvem",

            // DevOps & CI/CD
            "jenkins", "ci/cd", "github actions", "gitlab", "circleci", "travis", "bamboo", "teamcity",
            "ansible", "puppet", "chef", "saltstack", "prometheus", "grafana", "datadog", "splunk",
            "new relic", "elk", "logstash", "kibana", "nagios", "zabbix", "pagerduty",
            // PT-BR: DevOps
            "integração contínua", "entrega contínua", "deploy contínuo", "automação",

            // Version Control & Collaboration
            "git", "github", "gitlab", "bitbucket", "svn", "mercurial", "jira", "confluence", "trello",
            "asana", "monday", "notion", "slack", "teams",
            // PT-BR: Version Control
            "controle de versão", "versionamento",

            // Testing
            "junit", "jest", "mocha", "cypress", "selenium", "playwright", "puppeteer", "pytest", "rspec",
            "karma", "jasmine", "testng", "cucumber", "postman", "insomnia", "soapui", "jmeter", "gatling",
            "tdd", "bdd", "unit testing", "integration testing", "e2e", "end-to-end",
            // PT-BR: Testing
            "testes unitários", "testes automatizados", "testes de integração", "qualidade de software",

            // Architecture & Design
            "microservices", "monolith", "serverless", "event-driven", "cqrs", "ddd", "clean architecture",
            "hexagonal", "mvc", "mvvm", "mvp", "solid", "design patterns", "system design",
            // PT-BR: Architecture
            "microsserviços", "arquitetura de software", "padrões de projeto", "arquitetura limpa",
            "arquitetura hexagonal", "orientação a objetos", "poo",

            // APIs & Protocols
            "rest", "restful", "api", "graphql", "grpc", "soap", "websocket", "oauth", "jwt", "openapi",
            "swagger", "http", "https", "tcp", "udp",
            // PT-BR: APIs
            "apis rest", "integração de sistemas", "web services",

            // AI/ML & Data
            "machine learning", "ml", "ai", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn",
            "pandas", "numpy", "data science", "data engineering", "big data", "hadoop", "spark", "kafka",
            "airflow", "dbt", "snowflake", "databricks", "jupyter", "nlp", "computer vision", "llm",
            "transformers", "hugging face", "openai", "langchain",
            // PT-BR: AI/ML
            "aprendizado de máquina", "inteligência artificial", "ciência de dados", "análise de dados",
            "engenharia de dados", "processamento de linguagem natural", "visão computacional",

            // Security
            "cybersecurity", "penetration testing", "ethical hacking", "owasp", "sso", "saml", "ldap",
            "encryption", "ssl", "tls", "firewall", "vpn", "iam", "rbac", "security audit",
            // PT-BR: Security
            "segurança da informação", "cibersegurança", "segurança cibernética", "criptografia",

            // Methodologies & Practices
            "agile", "scrum", "kanban", "waterfall", "lean", "xp", "safe", "devops", "devsecops", "sre",
            "pair programming", "code review", "continuous improvement",
            // PT-BR: Methodologies
            "metodologias ágeis", "gestão de projetos", "revisão de código", "melhoria contínua",

            // Soft Skills (English)
            "leadership", "management", "communication", "teamwork", "problem solving", "analytical",
            "critical thinking", "collaboration", "mentoring", "coaching", "presentation", "negotiation",
            "time management", "project management", "stakeholder management", "cross-functional",
            // PT-BR: Soft Skills
            "liderança", "gestão de equipe", "comunicação", "trabalho em equipe", "resolução de problemas",
            "pensamento crítico", "colaboração", "mentoria", "proatividade", "organização",

            // Industries & Domains
            "fintech", "healthcare", "e-commerce", "saas", "b2b", "b2c", "startup", "enterprise",
            "banking", "insurance", "retail", "logistics", "telecommunications", "media", "gaming",
            // PT-BR: Industries
            "tecnologia", "financeiro", "varejo", "logística", "telecomunicações", "saúde"));

    public PDFAnalysisService(PDFExtractionService pdfExtractionService, OpenRouterService openRouterService,
            PDFSecurityService pdfSecurityService) {
        this.pdfExtractionService = pdfExtractionService;
        this.openRouterService = openRouterService;
        this.pdfSecurityService = pdfSecurityService;
    }

    /**
     * Analyze a PDF resume against a job description.
     * 
     * @param language ISO 639-1 language code (en, pt, es, etc.)
     */
    public PDFAnalysisResponse analyze(MultipartFile pdfFile, String jobDescription, String language)
            throws IOException {
        logger.info("Starting PDF analysis in language: {}", language);

        // Step 1: Extract text from PDF
        String resumeText = pdfExtractionService.extractText(pdfFile);
        logger.info("Extracted {} characters from PDF", resumeText.length());

        // Step 1.5: Security checks - sanitize and detect injection attempts
        resumeText = pdfSecurityService.sanitizeExtractedText(resumeText);
        if (pdfSecurityService.detectPromptInjection(resumeText)) {
            logger.error("SECURITY ALERT: Prompt injection detected in PDF text");
            throw new PDFSecurityService.SecurityException("Suspicious content detected in PDF");
        }
        if (pdfSecurityService.detectPromptInjection(jobDescription)) {
            logger.error("SECURITY ALERT: Prompt injection detected in job description");
            throw new PDFSecurityService.SecurityException("Suspicious content detected in job description");
        }

        // Step 2: Extract contact info and skills
        Map<String, String> contactInfo = pdfExtractionService.extractContactInfo(resumeText);
        List<String> extractedSkills = pdfExtractionService.extractSkills(resumeText);

        // Step 3: Extract keywords from job description
        Set<String> jobKeywords = extractKeywords(jobDescription);
        logger.info("Found {} keywords in job description", jobKeywords.size());

        // Step 4: Match keywords against job description

        List<String> matchedKeywords = new ArrayList<>();
        List<String> missingKeywords = new ArrayList<>();

        for (String keyword : jobKeywords) {
            if (containsKeyword(resumeText.toLowerCase(), keyword.toLowerCase())) {
                matchedKeywords.add(keyword);
            } else {
                missingKeywords.add(keyword);
            }
        }

        // Step 5: Calculate score (improved algorithm)
        int totalKeywords = jobKeywords.size();
        int matchedCount = matchedKeywords.size();

        // Base score: Use a more forgiving formula
        // 60-70% keyword match is already good, so we boost the score
        double matchRatio = totalKeywords > 0 ? (matchedCount * 1.0) / totalKeywords : 0;
        int score;

        if (matchRatio >= 0.7) {
            // Excellent match: 85-100%
            score = 85 + (int) ((matchRatio - 0.7) / 0.3 * 15);
        } else if (matchRatio >= 0.5) {
            // Good match: 70-85%
            score = 70 + (int) ((matchRatio - 0.5) / 0.2 * 15);
        } else if (matchRatio >= 0.3) {
            // Fair match: 50-70%
            score = 50 + (int) ((matchRatio - 0.3) / 0.2 * 20);
        } else {
            // Needs improvement: 0-50%
            score = (int) (matchRatio / 0.3 * 50);
        }

        // Adjust score based on format and content quality
        score = adjustScore(score, resumeText);

        // Step 6: Detect format issues
        List<String> formatIssues = detectFormatIssues(resumeText);

        // Step 7: Generate AI suggestions
        List<String> suggestions = generateSuggestions(resumeText, jobDescription, missingKeywords, language);

        // Build response
        PDFAnalysisResponse response = new PDFAnalysisResponse();
        response.setScore(Math.min(100, Math.max(0, score)));
        response.setMatchedKeywords(matchedKeywords.stream().limit(20).toList());
        response.setMissingKeywords(missingKeywords.stream().limit(15).toList());
        response.setSuggestions(suggestions);
        response.setFormatIssues(formatIssues);

        // Build extracted info
        PDFAnalysisResponse.ExtractedInfo extractedInfo = new PDFAnalysisResponse.ExtractedInfo();
        extractedInfo.setName(contactInfo.get("name"));
        extractedInfo.setEmail(contactInfo.get("email"));
        extractedInfo.setPhone(contactInfo.get("phone"));
        extractedInfo.setSkills(extractedSkills.stream().limit(20).toList());
        extractedInfo.setTotalCharacters(resumeText.length());
        response.setExtractedInfo(extractedInfo);

        logger.info("PDF analysis completed. Score: {}, Matched: {}, Missing: {}",
                score, matchedCount, missingKeywords.size());

        return response;
    }

    /**
     * Extract keywords from text using pattern matching first, AI as optional
     * boost.
     * Works 100% offline; AI only called if pattern matching finds too few
     * keywords.
     */
    private Set<String> extractKeywords(String text) {
        Set<String> keywords = new HashSet<>();
        String lowerText = text.toLowerCase();

        // Method 1: Match against known tech keywords (reliable, offline)
        for (String keyword : TECH_KEYWORDS) {
            if (containsKeyword(lowerText, keyword)) {
                keywords.add(capitalizeKeyword(keyword));
            }
        }

        // Method 2: Pattern-based extraction as second layer
        extractPatternBasedKeywords(text, keywords);

        // Method 3: Only call AI if pattern matching found very few keywords (< 5)
        if (keywords.size() < 5) {
            try {
                Set<String> aiKeywords = extractKeywordsWithAI(text);
                keywords.addAll(aiKeywords);
                logger.info("AI boosted keywords from {} to {}", keywords.size() - aiKeywords.size(), keywords.size());
            } catch (Exception e) {
                logger.warn("AI keyword extraction failed, using pattern matching only: {}", e.getMessage());
            }
        }

        return keywords;
    }

    /**
     * Use AI (OpenRouter) to intelligently extract technical keywords from job
     * description.
     */
    private Set<String> extractKeywordsWithAI(String text) throws IOException {
        Set<String> keywords = new HashSet<>();

        String safeText = pdfSecurityService.sanitizeForAIPrompt(text, MAX_JOB_DESCRIPTION_CHARS);
        String systemInstructions = """
                Extract ONLY technical skills, tools, and qualifications from this job description.
                The text may be in English OR Portuguese - extract keywords in their original form.

                RULES:
                - ONLY extract: programming languages, frameworks, libraries, databases, cloud services, tools, certifications, methodologies
                - DO NOT extract: common verbs (criar, buscar, desenvolver, looking, seeking), company names, generic terms
                - DO NOT extract: soft skills in generic form (comunicação, liderança) unless specifically technical
                - Return as comma-separated list, no explanations
                - If skill appears in different forms (React, ReactJS), choose the most common form
                - Keep technical terms in their common form (AWS, Docker, Python - not translated)
                - Maximum 25 keywords

                Examples of GOOD keywords: Python, AWS, Docker, Kubernetes, React, PostgreSQL, Agile, CI/CD, Spring Boot, Microservices
                Examples of BAD keywords: Criar, Desenvolver, Buscamos, Configurar, Team, Requirements, Experience, Company, Looking, Nossos

                Return ONLY the comma-separated keywords.
                """;

        String securePrompt = pdfSecurityService.buildSecurePrompt(systemInstructions, safeText);
        String response = openRouterService.generateText(securePrompt);

        // Parse comma-separated response
        String[] parts = response.split(",");
        for (String part : parts) {
            String keyword = part.trim()
                    .replaceAll("[^a-zA-Z0-9.#+\\-/ ]", "")
                    .trim();
            if (keyword.length() >= 2 && keyword.length() <= 30 && !isCommonWord(keyword)) {
                keywords.add(keyword);
            }
        }

        return keywords;
    }

    /**
     * Pattern-based keyword extraction as fallback.
     */
    private void extractPatternBasedKeywords(String text, Set<String> keywords) {
        // Only extract ALL-CAPS or camelCase tech terms
        Pattern techPattern = Pattern.compile("\\b([A-Z]{2,}|[A-Z][a-z]+(?:[A-Z][a-z]+)+)\\b");
        Matcher matcher = techPattern.matcher(text);
        while (matcher.find()) {
            String match = matcher.group(1);
            if (match.length() >= 2 && match.length() <= 20 && !isCommonWord(match) && isTechTerm(match)) {
                keywords.add(match);
            }
        }
    }

    /**
     * Check if a term looks like a technical term.
     */
    private boolean isTechTerm(String term) {
        String lower = term.toLowerCase();
        // Check if it matches any known keyword or synonym
        if (TECH_KEYWORDS.contains(lower))
            return true;
        for (Set<String> synonyms : SYNONYM_MAP.values()) {
            if (synonyms.contains(lower))
                return true;
        }
        // Check common tech patterns
        return lower.matches(".*(js|api|sql|db|aws|gcp|sdk|cli|ui|ux|dev|ops|ml|ai).*");
    }

    /**
     * Check if text contains keyword or any of its synonyms (word boundary aware).
     */
    private boolean containsKeyword(String text, String keyword) {
        // Check the keyword itself
        if (matchesWord(text, keyword)) {
            return true;
        }

        // Check synonyms of this keyword
        Set<String> synonyms = SYNONYM_MAP.get(keyword.toLowerCase());
        if (synonyms != null) {
            for (String synonym : synonyms) {
                if (matchesWord(text, synonym)) {
                    return true;
                }
            }
        }

        // Check if this keyword is a synonym of something else
        for (Map.Entry<String, Set<String>> entry : SYNONYM_MAP.entrySet()) {
            if (entry.getValue().contains(keyword.toLowerCase())) {
                if (matchesWord(text, entry.getKey())) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if text contains exact word match (word boundary aware).
     */
    private boolean matchesWord(String text, String word) {
        String pattern = "(?i)\\b" + Pattern.quote(word) + "\\b";
        return Pattern.compile(pattern).matcher(text).find();
    }

    /**
     * Capitalize keyword properly.
     */
    private String capitalizeKeyword(String keyword) {
        // Special cases
        Map<String, String> specialCases = Map.of(
                "aws", "AWS", "gcp", "GCP", "api", "API", "sql", "SQL",
                "html", "HTML", "css", "CSS", "ci/cd", "CI/CD", "ai", "AI",
                "ml", "ML", "k8s", "K8s");

        if (specialCases.containsKey(keyword.toLowerCase())) {
            return specialCases.get(keyword.toLowerCase());
        }

        return keyword.substring(0, 1).toUpperCase() + keyword.substring(1);
    }

    /**
     * Check if word is a common non-technical word (English and Portuguese).
     */
    private boolean isCommonWord(String word) {
        String lower = word.toLowerCase();
        Set<String> commonEnglish = Set.of(
                // Articles, pronouns, prepositions
                "the", "and", "for", "with", "from", "about", "this", "that", "these", "those",
                "your", "our", "their", "his", "her", "its", "which", "what", "who", "whom",
                "are", "was", "were", "been", "being", "have", "has", "had", "will", "would",
                "could", "should", "may", "might", "must", "can", "shall", "need", "dare",
                // Common business/job words
                "experience", "requirements", "qualifications", "responsibilities", "team",
                "work", "working", "company", "role", "position", "job", "career", "opportunity",
                "looking", "seeking", "join", "growth", "development", "environment", "culture",
                "benefits", "salary", "bonus", "equity", "remote", "hybrid", "onsite", "office",
                "years", "months", "minimum", "preferred", "required", "plus", "nice",
                "strong", "excellent", "good", "great", "best", "ability", "skills", "knowledge",
                "understanding", "familiarity", "proficiency", "expert", "senior", "junior", "lead",
                "manager", "director", "engineer", "developer", "analyst", "specialist", "consultant");

        Set<String> commonPortuguese = Set.of(
                // Artigos e pronomes
                "para", "com", "como", "sobre", "entre", "esse", "essa", "este", "esta",
                "nosso", "nossa", "nossos", "nossas", "seu", "sua", "seus", "suas",
                "eles", "elas", "voce", "você", "nos", "nós", "que", "qual", "quais",
                // Verbos comuns
                "ser", "estar", "ter", "fazer", "criar", "buscar", "buscamos", "procurar",
                "desenvolver", "implementar", "construir", "manter", "gerenciar", "liderar",
                "trabalhar", "contribuir", "participar", "colaborar", "apoiar", "ajudar",
                "estamos", "somos", "temos", "fazemos", "precisamos", "queremos", "oferecemos",
                "configurar", "melhore", "melhorar", "otimizar", "garantir", "assegurar",
                // Palavras de negócio
                "empresa", "equipe", "time", "vaga", "oportunidade", "requisitos", "requisito",
                "experiencia", "experiência", "conhecimento", "conhecimentos", "habilidade",
                "habilidades", "responsabilidades", "atividades", "principais", "desejavel",
                "desejável", "obrigatorio", "obrigatório", "diferencial", "beneficios", "benefícios",
                "salario", "salário", "contrato", "remoto", "hibrido", "híbrido", "presencial",
                "anos", "meses", "minimo", "mínimo", "superior", "formacao", "formação",
                "alta", "alto", "grande", "bom", "boa", "excelente", "forte", "solida", "sólida",
                // Outras palavras comuns
                "mais", "muito", "bem", "além", "tambem", "também", "ainda", "desde", "ate", "até",
                "vontade", "sustentabilidade", "infraestrutura", "perfil", "dreamsquad");

        return commonEnglish.contains(lower) || commonPortuguese.contains(lower) || lower.length() <= 2;
    }

    /**
     * Adjust score based on resume quality factors.
     */
    private int adjustScore(int baseScore, String resumeText) {
        int adjustedScore = baseScore;

        // Bonus for good length (1000-5000 chars)
        if (resumeText.length() >= 1000 && resumeText.length() <= 5000) {
            adjustedScore += 5;
        }

        // Penalty for too short
        if (resumeText.length() < 500) {
            adjustedScore -= 10;
        }

        // Penalty for too long
        if (resumeText.length() > 10000) {
            adjustedScore -= 5;
        }

        // Check for quantifiable achievements
        if (Pattern.compile("\\d+%|\\$\\d+|\\d+\\+?\\s*(years?|users?|clients?|projects?)")
                .matcher(resumeText.toLowerCase()).find()) {
            adjustedScore += 5;
        }

        // Check for action verbs
        String[] actionVerbs = { "developed", "implemented", "designed", "led", "managed",
                "created", "built", "improved", "increased", "reduced", "achieved" };
        int actionVerbCount = 0;
        for (String verb : actionVerbs) {
            if (resumeText.toLowerCase().contains(verb)) {
                actionVerbCount++;
            }
        }
        if (actionVerbCount >= 3) {
            adjustedScore += 5;
        }

        return adjustedScore;
    }

    /**
     * Detect format issues in the resume.
     */
    private List<String> detectFormatIssues(String resumeText) {
        List<String> issues = new ArrayList<>();

        // Check length
        if (resumeText.length() < 500) {
            issues.add("Currículo parece muito curto. Considere adicionar mais detalhes sobre sua experiência.");
        }
        if (resumeText.length() > 10000) {
            issues.add("Currículo pode estar muito longo (2+ páginas). Considere condensar para 1-2 páginas.");
        }

        // Check for emojis
        if (resumeText.matches(".*[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+.*")) {
            issues.add("Currículo contém emojis que podem não ser interpretados corretamente por sistemas ATS.");
        }

        // Check for special characters
        if (resumeText.contains("★") || resumeText.contains("●") || resumeText.contains("◆")) {
            issues.add(
                    "Caracteres especiais de bullet detectados. Use bullets padrão para melhor compatibilidade com ATS.");
        }

        // Check for contact info
        if (!resumeText.contains("@")) {
            issues.add(
                    "Nenhum endereço de email detectado. Certifique-se de que suas informações de contato estão visíveis.");
        }

        // Check for common sections
        String lowerText = resumeText.toLowerCase();
        if (!lowerText.contains("experience") && !lowerText.contains("employment")) {
            issues.add("Nenhuma seção 'Experiência' ou 'Emprego' encontrada.");
        }
        if (!lowerText.contains("education")) {
            issues.add("Nenhuma seção 'Educação' ou 'Formação' encontrada.");
        }
        if (!lowerText.contains("skills")) {
            issues.add(
                    "Nenhuma seção 'Habilidades' encontrada. Adicionar uma seção de habilidades melhora a correspondência com ATS.");
        }

        return issues;
    }

    /**
     * Generate suggestions using rule-based system first, AI as optional boost.
     */
    private List<String> generateSuggestions(String resumeText, String jobDescription,
            List<String> missingKeywords, String language) {
        List<String> suggestions = new ArrayList<>();

        // Step 1: Always start with rule-based suggestions (offline, reliable)
        suggestions.addAll(getRuleBasedSuggestions(resumeText, language));

        // Add basic suggestions based on missing keywords
        if (!missingKeywords.isEmpty()) {
            String topMissing = missingKeywords.stream().limit(5).collect(Collectors.joining(", "));
            String suggestion = "Considere adicionar estas palavras-chave ao seu curr\u00edculo: " + topMissing;
            suggestions.add(0, suggestion); // Put at the beginning
        }

        // Step 2: Only try AI if we have fewer than 3 suggestions
        if (suggestions.size() < 3) {
            try {
                String prompt = buildSuggestionPrompt(resumeText, jobDescription, missingKeywords, language);
                String aiResponse = openRouterService.generateText(prompt);

                // Parse AI suggestions (expecting numbered list)
                String[] lines = aiResponse.split("\n");
                for (String line : lines) {
                    line = line.trim()
                            .replaceAll("^\\d+[.)]\\s*", "") // Remove numbering
                            .replaceAll("^[-*\u2022]\\s*", ""); // Remove bullets

                    if (line.length() >= 20 && line.length() <= 200) {
                        suggestions.add(line);
                    }

                    if (suggestions.size() >= 7)
                        break;
                }
            } catch (Exception e) {
                logger.warn("Failed to get AI suggestions, using rule-based only: {}", e.getMessage());
            }
        }

        return suggestions.stream().distinct().limit(7).toList();
    }

    /**
     * Build prompt for AI to generate suggestions with deep semantic analysis.
     */
    private String buildSuggestionPrompt(String resumeText, String jobDescription,
            List<String> missingKeywords, String language) {
        String safeResume = pdfSecurityService.sanitizeForAIPrompt(resumeText, MAX_RESUME_SNIPPET_CHARS);
        String safeJob = pdfSecurityService.sanitizeForAIPrompt(jobDescription, MAX_JOB_SNIPPET_CHARS);

        String userContent = String.format("""
                RESUME (first 3000 chars):
                %s

                JOB DESCRIPTION (first 2000 chars):
                %s

                KEYWORDS NOT DIRECTLY FOUND: %s
                """,
                safeResume, safeJob, missingKeywords.stream().limit(15).collect(Collectors.joining(", ")));

        String languageInstruction = language.equals("pt")
                ? "IMPORTANT: Respond in PORTUGUESE (Brazilian Portuguese). All suggestions must be in Portuguese."
                : "IMPORTANT: Respond in ENGLISH. All suggestions must be in English.";

        String systemInstructions = String.format(
                """
                        You are an expert ATS (Applicant Tracking System) analyst and career coach. Perform a DEEP SEMANTIC ANALYSIS of this resume against the job description.

                        %s

                        ANALYSIS INSTRUCTIONS:
                        1. SEMANTIC MATCHING: Look beyond exact keywords. If the resume has "ReactJS" and job needs "React", that's a match. If resume shows "led a team of 5 developers" and job needs "leadership", that's a match.
                        2. TRANSFERABLE SKILLS: Identify skills from the resume that could satisfy job requirements even if worded differently.
                        3. EXPERIENCE RELEVANCE: Assess if the candidate's experience domains are relevant to the job.
                        4. IMPLICIT QUALIFICATIONS: Detect skills that are implied but not stated (e.g., someone with 5 years of React likely knows JavaScript).

                        Based on your semantic analysis, provide exactly 6 suggestions as a numbered list:

                        First 2 suggestions: How to better highlight EXISTING experience that matches the job (reword, restructure, emphasize)
                        Next 2 suggestions: Specific MISSING skills or experiences the candidate should add or address
                        Last 2 suggestions: FORMAT and STRUCTURE improvements for better ATS parsing

                        Each suggestion must be:
                        - Specific with examples when possible
                        - Actionable (tell them exactly what to do)
                        - Directly tied to job requirements

                        Format: Just the numbered list, no introduction or conclusion.
                        """,
                languageInstruction);

        return pdfSecurityService.buildSecurePrompt(systemInstructions, userContent);
    }

    /**
     * Rule-based suggestions — works 100% offline.
     */
    private List<String> getRuleBasedSuggestions(String resumeText, String language) {
        List<String> suggestions = new ArrayList<>();
        String lowerText = resumeText.toLowerCase();

        if (!lowerText.contains("summary") && !lowerText.contains("objective") && !lowerText.contains("resumo")
                && !lowerText.contains("objetivo")) {
            suggestions.add(
                    "Adicione um resumo profissional no topo do seu curr\u00edculo para destacar rapidamente sua proposta de valor.");
        }

        if (!Pattern.compile("\\d+%|\\$\\d+|R\\$\\d+").matcher(resumeText).find()) {
            suggestions.add(
                    "Inclua conquistas quantific\u00e1veis (ex: 'aumentei as vendas em 25%', 'reduzi custos em R$ 10 mil').");
        }

        if (!lowerText.contains("github") && !lowerText.contains("portfolio") && !lowerText.contains("linkedin")) {
            suggestions
                    .add("Adicione links para seu GitHub, portf\u00f3lio ou perfil do LinkedIn para mostrar seu trabalho.");
        }

        String[] actionVerbs = { "desenvolvi", "implementei", "projetei", "liderei", "gerenciei",
                "developed", "implemented", "designed", "led", "managed" };
        int verbCount = 0;
        for (String verb : actionVerbs) {
            if (lowerText.contains(verb))
                verbCount++;
        }
        if (verbCount < 2) {
            suggestions.add(
                    "Use verbos de a\u00e7\u00e3o fortes como 'desenvolvi', 'implementei', 'liderei', 'projetei' para descrever suas conquistas.");
        }

        if (!lowerText.contains("certification") && !lowerText.contains("certified")
                && !lowerText.contains("certifica\u00e7\u00e3o") && !lowerText.contains("certificado")) {
            suggestions.add(
                    "Considere adicionar certifica\u00e7\u00f5es relevantes para demonstrar expertise nas principais tecnologias.");
        }

        // Additional rules for better standalone coverage
        if (resumeText.length() < 800) {
            suggestions.add(
                    "Seu curr\u00edculo parece curto. Adicione mais detalhes sobre suas experi\u00eancias e projetos realizados.");
        }

        if (!lowerText.contains("projeto") && !lowerText.contains("project")) {
            suggestions.add(
                    "Adicione uma se\u00e7\u00e3o de projetos para demonstrar sua experi\u00eancia pr\u00e1tica e portf\u00f3lio de trabalho.");
        }

        int sectionCount = 0;
        String[] sections = { "experi\u00eancia", "experience", "educa\u00e7\u00e3o", "education", "habilidades",
                "skills",
                "forma\u00e7\u00e3o", "projetos", "projects" };
        for (String section : sections) {
            if (lowerText.contains(section))
                sectionCount++;
        }
        if (sectionCount < 3) {
            suggestions.add(
                    "Organize seu curr\u00edculo em se\u00e7\u00f5es claras: Resumo, Experi\u00eancia, Educa\u00e7\u00e3o, Habilidades e Projetos.");
        }

        if (!lowerText.contains("idioma") && !lowerText.contains("language") && !lowerText.contains("ingl\u00eas")
                && !lowerText.contains("english")) {
            suggestions.add("Adicione uma se\u00e7\u00e3o de idiomas com seus n\u00edveis de profici\u00eancia.");
        }

        return suggestions;
    }
}
