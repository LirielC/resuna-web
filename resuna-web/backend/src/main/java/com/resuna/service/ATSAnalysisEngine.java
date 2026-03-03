package com.resuna.service;

import com.resuna.model.ATSAnalysisRequest;
import com.resuna.model.ATSAnalysisResult;
import com.resuna.model.Resume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * ATS Analysis Engine - Analyzes resumes against job descriptions.
 * 
 * This service extracts keywords from job descriptions and matches them
 * against resume content to calculate an ATS compatibility score.
 */
@Service
public class ATSAnalysisEngine {
    
    private static final Logger logger = LoggerFactory.getLogger(ATSAnalysisEngine.class);
    
    // Common tech keywords by category
    private static final Map<String, Set<String>> KEYWORD_CATEGORIES = new HashMap<>();
    
    static {
        // Programming Languages
        KEYWORD_CATEGORIES.put("programming", Set.of(
            "java", "python", "javascript", "typescript", "c++", "c#", "ruby", "go", "golang",
            "rust", "kotlin", "swift", "scala", "php", "perl", "r", "matlab", "bash", "shell",
            "sql", "plsql", "html", "css", "sass", "less"
        ));
        
        // Frameworks & Libraries
        KEYWORD_CATEGORIES.put("frameworks", Set.of(
            "spring", "spring boot", "hibernate", "jpa", "react", "angular", "vue", "vue.js",
            "node.js", "nodejs", "express", "django", "flask", "fastapi", "rails", "laravel",
            "next.js", "nextjs", "nuxt", "svelte", "jquery", "bootstrap", "tailwind",
            ".net", "asp.net", "entity framework"
        ));
        
        // Cloud & DevOps
        KEYWORD_CATEGORIES.put("cloud", Set.of(
            "aws", "amazon web services", "azure", "gcp", "google cloud", "firebase",
            "docker", "kubernetes", "k8s", "jenkins", "ci/cd", "terraform", "ansible",
            "cloudformation", "lambda", "ec2", "s3", "rds", "dynamodb", "ecs", "eks",
            "heroku", "vercel", "netlify", "digitalocean"
        ));
        
        // Databases
        KEYWORD_CATEGORIES.put("databases", Set.of(
            "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
            "oracle", "sql server", "sqlite", "cassandra", "dynamodb", "firestore",
            "neo4j", "graphql", "nosql"
        ));
        
        // Tools & Practices
        KEYWORD_CATEGORIES.put("tools", Set.of(
            "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack",
            "agile", "scrum", "kanban", "tdd", "bdd", "ci/cd", "devops", "microservices",
            "rest", "restful", "api", "graphql", "grpc", "oauth", "jwt"
        ));
        
        // Soft Skills
        KEYWORD_CATEGORIES.put("soft_skills", Set.of(
            "leadership", "communication", "teamwork", "problem solving", "analytical",
            "project management", "time management", "collaboration", "mentoring",
            "presentation", "stakeholder", "cross-functional"
        ));
        
        // Experience Levels
        KEYWORD_CATEGORIES.put("experience", Set.of(
            "senior", "junior", "lead", "principal", "staff", "architect", "manager",
            "director", "vp", "entry-level", "mid-level", "expert"
        ));
        
        // Education
        KEYWORD_CATEGORIES.put("education", Set.of(
            "bachelor", "master", "phd", "doctorate", "degree", "computer science",
            "software engineering", "information technology", "mba", "certification",
            "certified"
        ));
    }
    
    /**
     * Analyze a resume against a job description.
     */
    public ATSAnalysisResult analyze(Resume resume, ATSAnalysisRequest request) {
        logger.info("Starting ATS analysis for resume: {}", resume.getId());
        
        String jobDescription = request.getJobDescription().toLowerCase();
        String jobTitle = request.getJobTitle() != null ? request.getJobTitle().toLowerCase() : "";
        
        // Extract keywords from job description
        Map<String, List<String>> extractedKeywords = extractKeywords(jobDescription);
        
        // Build resume text for matching
        String resumeText = buildResumeText(resume);
        
        // Find matches and gaps
        List<ATSAnalysisResult.Match> matches = new ArrayList<>();
        List<ATSAnalysisResult.Gap> gaps = new ArrayList<>();
        
        Map<String, Integer> categoryScores = new HashMap<>();
        Map<String, Integer> categoryTotals = new HashMap<>();
        
        for (Map.Entry<String, List<String>> entry : extractedKeywords.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();
            
            int categoryMatches = 0;
            
            for (String keyword : keywords) {
                int frequency = countOccurrences(resumeText, keyword);
                
                if (frequency > 0) {
                    ATSAnalysisResult.Match match = new ATSAnalysisResult.Match();
                    match.setKeyword(keyword);
                    match.setCategory(category);
                    match.setFrequency(frequency);
                    matches.add(match);
                    categoryMatches++;
                } else {
                    ATSAnalysisResult.Gap gap = new ATSAnalysisResult.Gap();
                    gap.setKeyword(keyword);
                    gap.setCategory(category);
                    gap.setImportance(determineImportance(keyword, jobDescription));
                    gap.setSuggestion(generateSuggestion(keyword, category));
                    gaps.add(gap);
                }
            }
            
            categoryScores.put(category, categoryMatches);
            categoryTotals.put(category, keywords.size());
        }
        
        // Calculate overall score
        int totalKeywords = matches.size() + gaps.size();
        int keywordScore = totalKeywords > 0 ? (int) ((matches.size() * 100.0) / totalKeywords) : 0;
        
        // Check ATS format compliance (emojis, symbols, etc.)
        ATSAnalysisResult.FormatCompliance formatCompliance = checkFormatCompliance(resume);
        
        // Apply format penalty to overall score
        int formatPenalty = 100 - formatCompliance.getScore();
        int overallScore = Math.max(0, keywordScore - (formatPenalty / 2));  // Format issues reduce score
        
        // Calculate score breakdown
        ATSAnalysisResult.ScoreBreakdown breakdown = calculateBreakdown(categoryScores, categoryTotals, resume);
        breakdown.setFormatScore(formatCompliance.getScore());
        
        // Generate recommendations (include format issues)
        List<String> recommendations = generateRecommendations(matches, gaps, resume, formatCompliance);
        
        // Build result
        ATSAnalysisResult result = new ATSAnalysisResult();
        result.setScore(overallScore);
        result.setScoreBreakdown(breakdown);
        result.setFormatCompliance(formatCompliance);
        result.setMatches(matches);
        result.setGaps(gaps);
        result.setRecommendations(recommendations);
        
        logger.info("ATS analysis completed. Score: {}, Format: {}, Matches: {}, Gaps: {}", 
                   overallScore, formatCompliance.getScore(), matches.size(), gaps.size());
        
        return result;
    }
    
    /**
     * Public entry point: extract keywords from a job description and return them
     * organized by category. Empty categories are omitted.
     */
    public Map<String, List<String>> extractKeywordsFromJobDescription(String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank()) {
            return Map.of();
        }
        return extractKeywords(jobDescription.toLowerCase());
    }

    /**
     * Extract keywords from job description organized by category.
     */
    private Map<String, List<String>> extractKeywords(String text) {
        Map<String, List<String>> result = new HashMap<>();
        
        for (Map.Entry<String, Set<String>> category : KEYWORD_CATEGORIES.entrySet()) {
            List<String> found = new ArrayList<>();
            
            for (String keyword : category.getValue()) {
                if (containsKeyword(text, keyword)) {
                    found.add(keyword);
                }
            }
            
            if (!found.isEmpty()) {
                result.put(category.getKey(), found);
            }
        }
        
        // Also extract custom keywords (capitalized words that might be specific technologies)
        List<String> customKeywords = extractCustomKeywords(text);
        if (!customKeywords.isEmpty()) {
            result.put("custom", customKeywords);
        }
        
        return result;
    }
    
    /**
     * Extract custom keywords that aren't in our predefined list.
     */
    private List<String> extractCustomKeywords(String text) {
        List<String> custom = new ArrayList<>();
        
        // Pattern for potential technology names (capitalized or camelCase)
        Pattern pattern = Pattern.compile("\\b([A-Z][a-zA-Z0-9]+(?:\\.[a-zA-Z]+)?|[a-z]+[A-Z][a-zA-Z0-9]*)\\b");
        Matcher matcher = pattern.matcher(text.replace(text.toLowerCase(), text)); // Restore original case
        
        Set<String> seen = new HashSet<>();
        while (matcher.find()) {
            String word = matcher.group(1).toLowerCase();
            if (word.length() > 2 && !seen.contains(word) && !isCommonWord(word)) {
                seen.add(word);
                if (custom.size() < 10) { // Limit custom keywords
                    custom.add(word);
                }
            }
        }
        
        return custom;
    }
    
    private boolean isCommonWord(String word) {
        Set<String> commonWords = Set.of(
            "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
            "was", "one", "our", "out", "has", "have", "been", "will", "with"
        );
        return commonWords.contains(word.toLowerCase());
    }
    
    private boolean containsKeyword(String text, String keyword) {
        String pattern = "\\b" + Pattern.quote(keyword.toLowerCase()) + "\\b";
        return Pattern.compile(pattern).matcher(text.toLowerCase()).find();
    }
    
    private int countOccurrences(String text, String keyword) {
        String pattern = "\\b" + Pattern.quote(keyword.toLowerCase()) + "\\b";
        Matcher matcher = Pattern.compile(pattern).matcher(text.toLowerCase());
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }
    
    /**
     * Build searchable text from resume.
     */
    private String buildResumeText(Resume resume) {
        StringBuilder sb = new StringBuilder();
        
        // Title
        if (resume.getTitle() != null) {
            sb.append(resume.getTitle()).append(" ");
        }
        
        // Summary
        if (resume.getSummary() != null) {
            sb.append(resume.getSummary()).append(" ");
        }
        
        // Skills
        if (resume.getSkills() != null) {
            sb.append(String.join(" ", resume.getSkills())).append(" ");
        }
        
        // Experience
        if (resume.getExperience() != null) {
            for (Resume.Experience exp : resume.getExperience()) {
                if (exp.getTitle() != null) sb.append(exp.getTitle()).append(" ");
                if (exp.getCompany() != null) sb.append(exp.getCompany()).append(" ");
                if (exp.getBullets() != null) {
                    sb.append(String.join(" ", exp.getBullets())).append(" ");
                }
            }
        }
        
        // Education
        if (resume.getEducation() != null) {
            for (Resume.Education edu : resume.getEducation()) {
                if (edu.getDegree() != null) sb.append(edu.getDegree()).append(" ");
                if (edu.getInstitution() != null) sb.append(edu.getInstitution()).append(" ");
            }
        }
        
        // Certifications
        if (resume.getCertifications() != null) {
            for (Resume.Certification cert : resume.getCertifications()) {
                if (cert.getName() != null) sb.append(cert.getName()).append(" ");
                if (cert.getIssuer() != null) sb.append(cert.getIssuer()).append(" ");
            }
        }
        
        // Languages
        if (resume.getLanguages() != null) {
            for (Resume.Language lang : resume.getLanguages()) {
                if (lang.getName() != null) sb.append(lang.getName()).append(" ");
            }
        }
        
        return sb.toString().toLowerCase();
    }
    
    private String determineImportance(String keyword, String jobDescription) {
        // Count how many times the keyword appears in the job description
        int frequency = countOccurrences(jobDescription, keyword);
        
        if (frequency >= 3) return "critical";
        if (frequency >= 2) return "important";
        return "nice-to-have";
    }
    
    private String generateSuggestion(String keyword, String category) {
        switch (category) {
            case "programming":
                return "Consider adding " + keyword + " to your skills if you have experience with it";
            case "frameworks":
                return "Add " + keyword + " experience to your resume if applicable";
            case "cloud":
                return "Include any cloud/DevOps experience with " + keyword;
            case "databases":
                return "Mention database experience with " + keyword + " if you have it";
            case "tools":
                return "If you've used " + keyword + ", add it to your skills section";
            case "soft_skills":
                return "Consider highlighting " + keyword + " abilities in your experience bullets";
            case "experience":
                return "Ensure your experience level is clearly communicated";
            case "education":
                return "Make sure your educational background is complete";
            default:
                return "Consider adding " + keyword + " to strengthen your application";
        }
    }
    
    private ATSAnalysisResult.ScoreBreakdown calculateBreakdown(
            Map<String, Integer> scores, 
            Map<String, Integer> totals,
            Resume resume) {
        
        ATSAnalysisResult.ScoreBreakdown breakdown = new ATSAnalysisResult.ScoreBreakdown();
        
        // Calculate keyword match (programming + frameworks + tools)
        int kwMatches = getOrDefault(scores, "programming", 0) + 
                       getOrDefault(scores, "frameworks", 0) + 
                       getOrDefault(scores, "tools", 0) +
                       getOrDefault(scores, "custom", 0);
        int kwTotals = getOrDefault(totals, "programming", 0) + 
                      getOrDefault(totals, "frameworks", 0) + 
                      getOrDefault(totals, "tools", 0) +
                      getOrDefault(totals, "custom", 0);
        breakdown.setKeywordMatch(kwTotals > 0 ? (int)((kwMatches * 100.0) / kwTotals) : 50);
        
        // Skills match (skills + cloud + databases)
        int skillMatches = getOrDefault(scores, "cloud", 0) + 
                          getOrDefault(scores, "databases", 0);
        int skillTotals = getOrDefault(totals, "cloud", 0) + 
                         getOrDefault(totals, "databases", 0);
        breakdown.setSkillsMatch(skillTotals > 0 ? (int)((skillMatches * 100.0) / skillTotals) : 50);
        
        // Experience score based on resume content
        int expScore = 60;
        if (resume.getExperience() != null) {
            int expCount = resume.getExperience().size();
            int bulletCount = resume.getExperience().stream()
                    .mapToInt(e -> e.getBullets() != null ? e.getBullets().size() : 0)
                    .sum();
            
            if (expCount >= 3) expScore += 15;
            else if (expCount >= 2) expScore += 10;
            else if (expCount >= 1) expScore += 5;
            
            if (bulletCount >= 10) expScore += 15;
            else if (bulletCount >= 5) expScore += 10;
            else if (bulletCount >= 3) expScore += 5;
        }
        breakdown.setExperienceMatch(Math.min(100, expScore));
        
        // Education score
        int eduScore = 50;
        if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
            eduScore = 75;
            for (Resume.Education edu : resume.getEducation()) {
                String degree = edu.getDegree() != null ? edu.getDegree().toLowerCase() : "";
                if (degree.contains("master") || degree.contains("phd") || degree.contains("doctorate")) {
                    eduScore = 95;
                    break;
                } else if (degree.contains("bachelor")) {
                    eduScore = 85;
                }
            }
        }
        if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
            eduScore = Math.min(100, eduScore + 10);
        }
        breakdown.setEducationMatch(eduScore);
        
        return breakdown;
    }
    
    private int getOrDefault(Map<String, Integer> map, String key, int defaultValue) {
        return map.getOrDefault(key, defaultValue);
    }
    
    /**
     * Check ATS format compliance - detects emojis, symbols, and other elements
     * that ATS systems cannot properly parse.
     */
    private ATSAnalysisResult.FormatCompliance checkFormatCompliance(Resume resume) {
        ATSAnalysisResult.FormatCompliance compliance = new ATSAnalysisResult.FormatCompliance();
        List<ATSAnalysisResult.FormatIssue> issues = new ArrayList<>();
        int score = 100;  // Start with perfect score
        
        // Check each section of the resume
        if (resume.getTitle() != null) {
            issues.addAll(checkTextForIssues(resume.getTitle(), "title"));
        }
        
        if (resume.getSummary() != null) {
            issues.addAll(checkTextForIssues(resume.getSummary(), "summary"));
        }
        
        if (resume.getSkills() != null) {
            for (String skill : resume.getSkills()) {
                issues.addAll(checkTextForIssues(skill, "skills"));
            }
        }
        
        if (resume.getExperience() != null) {
            for (Resume.Experience exp : resume.getExperience()) {
                if (exp.getTitle() != null) {
                    issues.addAll(checkTextForIssues(exp.getTitle(), "experience.title"));
                }
                if (exp.getCompany() != null) {
                    issues.addAll(checkTextForIssues(exp.getCompany(), "experience.company"));
                }
                if (exp.getBullets() != null) {
                    for (String bullet : exp.getBullets()) {
                        issues.addAll(checkTextForIssues(bullet, "experience.bullets"));
                    }
                }
            }
        }
        
        if (resume.getEducation() != null) {
            for (Resume.Education edu : resume.getEducation()) {
                if (edu.getDegree() != null) {
                    issues.addAll(checkTextForIssues(edu.getDegree(), "education.degree"));
                }
                if (edu.getInstitution() != null) {
                    issues.addAll(checkTextForIssues(edu.getInstitution(), "education.institution"));
                }
            }
        }
        
        if (resume.getCertifications() != null) {
            for (Resume.Certification cert : resume.getCertifications()) {
                if (cert.getName() != null) {
                    issues.addAll(checkTextForIssues(cert.getName(), "certifications"));
                }
            }
        }
        
        // Calculate score based on issues
        for (ATSAnalysisResult.FormatIssue issue : issues) {
            score -= issue.getPenalty();
        }
        score = Math.max(0, score);
        
        compliance.setScore(score);
        compliance.setAtsReadable(score >= 70);  // Consider readable if score >= 70
        compliance.setIssues(issues);
        
        return compliance;
    }
    
    /**
     * Check a text string for ATS-unfriendly content.
     */
    private List<ATSAnalysisResult.FormatIssue> checkTextForIssues(String text, String location) {
        List<ATSAnalysisResult.FormatIssue> issues = new ArrayList<>();
        
        if (text == null || text.isEmpty()) {
            return issues;
        }
        
        // Check for emojis (Unicode emoji ranges)
        Pattern emojiPattern = Pattern.compile("[\\x{1F300}-\\x{1F9FF}\\x{2600}-\\x{26FF}\\x{2700}-\\x{27BF}\\x{1F600}-\\x{1F64F}\\x{1F680}-\\x{1F6FF}]");
        Matcher emojiMatcher = emojiPattern.matcher(text);
        Set<String> foundEmojis = new HashSet<>();
        while (emojiMatcher.find()) {
            foundEmojis.add(emojiMatcher.group());
        }
        if (!foundEmojis.isEmpty()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("emoji");
            issue.setSeverity("critical");
            issue.setDescription("Emojis detected - ATS systems cannot parse these and may reject your resume");
            issue.setLocation(location);
            issue.setExample(String.join(" ", foundEmojis));
            issue.setPenalty(15 * foundEmojis.size());  // 15 points per emoji type
            issues.add(issue);
        }
        
        // Check for special bullet symbols (•, ▪, ►, ★, etc.)
        Pattern bulletSymbolPattern = Pattern.compile("[•▪▸►◆◇○●★☆✓✔✗✘→←↑↓➔➜➤➢➣]");
        Matcher bulletMatcher = bulletSymbolPattern.matcher(text);
        Set<String> foundBullets = new HashSet<>();
        while (bulletMatcher.find()) {
            foundBullets.add(bulletMatcher.group());
        }
        if (!foundBullets.isEmpty()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("special_bullet");
            issue.setSeverity("warning");
            issue.setDescription("Special bullet/arrow symbols detected - use simple dashes (-) or asterisks (*) instead");
            issue.setLocation(location);
            issue.setExample(String.join(" ", foundBullets));
            issue.setPenalty(5 * foundBullets.size());
            issues.add(issue);
        }
        
        // Check for decorative symbols and fancy characters
        Pattern decorativePattern = Pattern.compile("[§¶†‡©®™℠℗№℮∞≠≤≥±×÷√∑∏∫∂∆∇]");
        Matcher decorativeMatcher = decorativePattern.matcher(text);
        if (decorativeMatcher.find()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("decorative_symbol");
            issue.setSeverity("warning");
            issue.setDescription("Decorative or mathematical symbols detected - these may not parse correctly");
            issue.setLocation(location);
            issue.setExample(decorativeMatcher.group());
            issue.setPenalty(5);
            issues.add(issue);
        }
        
        // Check for unusual unicode characters (box drawing, geometric shapes, etc.)
        Pattern unusualUnicodePattern = Pattern.compile("[\\x{2500}-\\x{257F}\\x{25A0}-\\x{25FF}\\x{2580}-\\x{259F}]");
        Matcher unicodeMatcher = unusualUnicodePattern.matcher(text);
        if (unicodeMatcher.find()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("box_drawing");
            issue.setSeverity("critical");
            issue.setDescription("Box drawing or geometric shape characters detected - these break ATS parsing");
            issue.setLocation(location);
            issue.setExample(unicodeMatcher.group());
            issue.setPenalty(10);
            issues.add(issue);
        }
        
        // Check for invisible or zero-width characters
        Pattern invisiblePattern = Pattern.compile("[\\x{200B}-\\x{200D}\\x{FEFF}\\x{00AD}]");
        Matcher invisibleMatcher = invisiblePattern.matcher(text);
        if (invisibleMatcher.find()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("invisible_character");
            issue.setSeverity("critical");
            issue.setDescription("Invisible or zero-width characters detected - these can cause major parsing issues");
            issue.setLocation(location);
            issue.setExample("[invisible character]");
            issue.setPenalty(20);
            issues.add(issue);
        }
        
        // Check for smart quotes and fancy punctuation
        Pattern smartQuotePattern = Pattern.compile("[\\x{201C}\\x{201D}\\x{2018}\\x{2019}\\x{2026}\\x{2013}\\x{2014}]");
        Matcher smartQuoteMatcher = smartQuotePattern.matcher(text);
        Set<String> foundSmartQuotes = new HashSet<>();
        while (smartQuoteMatcher.find()) {
            foundSmartQuotes.add(smartQuoteMatcher.group());
        }
        if (!foundSmartQuotes.isEmpty()) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("smart_punctuation");
            issue.setSeverity("info");
            issue.setDescription("Smart quotes or fancy punctuation detected - use standard ASCII quotes (\", ') and dashes (-)");
            issue.setLocation(location);
            issue.setExample(String.join(" ", foundSmartQuotes));
            issue.setPenalty(2);
            issues.add(issue);
        }
        
        // Check for excessive caps (might indicate design-focused formatting)
        if (text.length() > 10) {
            long capsCount = text.chars().filter(Character::isUpperCase).count();
            double capsRatio = (double) capsCount / text.length();
            if (capsRatio > 0.5) {
                ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
                issue.setType("excessive_caps");
                issue.setSeverity("info");
                issue.setDescription("Excessive capitalization detected - some ATS may have trouble parsing ALL CAPS text");
                issue.setLocation(location);
                issue.setExample(text.substring(0, Math.min(30, text.length())) + "...");
                issue.setPenalty(3);
                issues.add(issue);
            }
        }
        
        // Check for pipe characters often used in visual formatting
        if (text.contains("|") && text.indexOf("|") != text.lastIndexOf("|")) {
            ATSAnalysisResult.FormatIssue issue = new ATSAnalysisResult.FormatIssue();
            issue.setType("pipe_separator");
            issue.setSeverity("warning");
            issue.setDescription("Multiple pipe characters (|) detected - often indicates column-based formatting that ATS cannot parse");
            issue.setLocation(location);
            issue.setExample(text.substring(0, Math.min(50, text.length())));
            issue.setPenalty(8);
            issues.add(issue);
        }
        
        return issues;
    }
    
    private List<String> generateRecommendations(
            List<ATSAnalysisResult.Match> matches,
            List<ATSAnalysisResult.Gap> gaps,
            Resume resume,
            ATSAnalysisResult.FormatCompliance formatCompliance) {
        
        List<String> recommendations = new ArrayList<>();
        
        // Format issues are highest priority
        if (formatCompliance != null && formatCompliance.getIssues() != null) {
            long criticalFormatIssues = formatCompliance.getIssues().stream()
                    .filter(i -> "critical".equals(i.getSeverity()))
                    .count();
            if (criticalFormatIssues > 0) {
                recommendations.add("🚫 CRITICAL: Your resume contains " + criticalFormatIssues + 
                        " format issue(s) that will cause ATS systems to reject or misread it. Remove emojis, special symbols, and unusual characters.");
            }
            
            long warningFormatIssues = formatCompliance.getIssues().stream()
                    .filter(i -> "warning".equals(i.getSeverity()))
                    .count();
            if (warningFormatIssues > 0) {
                recommendations.add("⚠️ FORMAT: " + warningFormatIssues + 
                        " format warning(s) detected. These may reduce ATS readability.");
            }
        }
        
        // Critical gaps
        List<ATSAnalysisResult.Gap> criticalGaps = gaps.stream()
                .filter(g -> "critical".equals(g.getImportance()))
                .limit(3)
                .collect(Collectors.toList());
        
        if (!criticalGaps.isEmpty()) {
            String keywords = criticalGaps.stream()
                    .map(ATSAnalysisResult.Gap::getKeyword)
                    .collect(Collectors.joining(", "));
            recommendations.add("🔴 Critical: Add these missing keywords if you have the experience: " + keywords);
        }
        
        // Important gaps
        List<ATSAnalysisResult.Gap> importantGaps = gaps.stream()
                .filter(g -> "important".equals(g.getImportance()))
                .limit(3)
                .collect(Collectors.toList());
        
        if (!importantGaps.isEmpty()) {
            String keywords = importantGaps.stream()
                    .map(ATSAnalysisResult.Gap::getKeyword)
                    .collect(Collectors.joining(", "));
            recommendations.add("🟡 Important: Consider adding: " + keywords);
        }
        
        // General recommendations based on resume analysis
        if (resume.getSummary() == null || resume.getSummary().length() < 50) {
            recommendations.add("📝 Add a professional summary (50-200 words) highlighting your key qualifications");
        }
        
        if (resume.getSkills() == null || resume.getSkills().size() < 5) {
            recommendations.add("💡 Expand your skills section with more technical and soft skills");
        }
        
        if (resume.getExperience() != null) {
            boolean hasQuantifiableBullets = resume.getExperience().stream()
                    .flatMap(e -> e.getBullets() != null ? e.getBullets().stream() : java.util.stream.Stream.empty())
                    .anyMatch(b -> Pattern.compile("\\d+").matcher(b).find());
            
            if (!hasQuantifiableBullets) {
                recommendations.add("📊 Add quantifiable achievements (numbers, percentages, metrics) to your experience bullets");
            }
        }
        
        if (matches.size() > gaps.size()) {
            recommendations.add("✅ Good keyword match! Your resume aligns well with this job description");
        }
        
        // Limit to 5 recommendations
        return recommendations.stream().limit(5).collect(Collectors.toList());
    }
}
