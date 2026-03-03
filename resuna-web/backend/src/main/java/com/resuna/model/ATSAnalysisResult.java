package com.resuna.model;

import java.time.Instant;
import java.util.List;

public class ATSAnalysisResult {
    private String id;
    private String userId;
    private String resumeId;
    private String jobTitle;
    private String company;
    private String jobDescription;
    private int score;
    private ScoreBreakdown scoreBreakdown;
    private FormatCompliance formatCompliance;
    private List<Match> matches;
    private List<Gap> gaps;
    private List<String> recommendations;
    private Instant createdAt;

    public ATSAnalysisResult() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public ScoreBreakdown getScoreBreakdown() { return scoreBreakdown; }
    public void setScoreBreakdown(ScoreBreakdown scoreBreakdown) { this.scoreBreakdown = scoreBreakdown; }

    public FormatCompliance getFormatCompliance() { return formatCompliance; }
    public void setFormatCompliance(FormatCompliance formatCompliance) { this.formatCompliance = formatCompliance; }

    public List<Match> getMatches() { return matches; }
    public void setMatches(List<Match> matches) { this.matches = matches; }

    public List<Gap> getGaps() { return gaps; }
    public void setGaps(List<Gap> gaps) { this.gaps = gaps; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // Nested classes
    public static class ScoreBreakdown {
        private int keywordMatch;
        private int skillsMatch;
        private int experienceMatch;
        private int educationMatch;
        private int formatScore;  // New: ATS format compliance score

        public ScoreBreakdown() {}

        public int getKeywordMatch() { return keywordMatch; }
        public void setKeywordMatch(int keywordMatch) { this.keywordMatch = keywordMatch; }

        public int getSkillsMatch() { return skillsMatch; }
        public void setSkillsMatch(int skillsMatch) { this.skillsMatch = skillsMatch; }

        public int getExperienceMatch() { return experienceMatch; }
        public void setExperienceMatch(int experienceMatch) { this.experienceMatch = experienceMatch; }

        public int getEducationMatch() { return educationMatch; }
        public void setEducationMatch(int educationMatch) { this.educationMatch = educationMatch; }

        public int getFormatScore() { return formatScore; }
        public void setFormatScore(int formatScore) { this.formatScore = formatScore; }
    }

    /**
     * ATS Format Compliance - checks if resume is readable by ATS systems
     */
    public static class FormatCompliance {
        private int score;              // Overall format score (0-100)
        private boolean atsReadable;    // Is the resume ATS readable?
        private List<FormatIssue> issues;  // List of detected issues
        
        public FormatCompliance() {}

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }

        public boolean isAtsReadable() { return atsReadable; }
        public void setAtsReadable(boolean atsReadable) { this.atsReadable = atsReadable; }

        public List<FormatIssue> getIssues() { return issues; }
        public void setIssues(List<FormatIssue> issues) { this.issues = issues; }
    }

    /**
     * A specific format issue detected in the resume
     */
    public static class FormatIssue {
        private String type;          // emoji, symbol, unicode, encoding, etc.
        private String severity;      // critical, warning, info
        private String description;   // Human-readable description
        private String location;      // Where in the resume (summary, skills, etc.)
        private String example;       // Example of the problematic content
        private int penalty;          // Score penalty for this issue

        public FormatIssue() {}

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getExample() { return example; }
        public void setExample(String example) { this.example = example; }

        public int getPenalty() { return penalty; }
        public void setPenalty(int penalty) { this.penalty = penalty; }
    }

    public static class Match {
        private String keyword;
        private String category;
        private int frequency;

        public Match() {}

        public String getKeyword() { return keyword; }
        public void setKeyword(String keyword) { this.keyword = keyword; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getFrequency() { return frequency; }
        public void setFrequency(int frequency) { this.frequency = frequency; }
    }

    public static class Gap {
        private String keyword;
        private String category;
        private String importance;
        private String suggestion;

        public Gap() {}

        public String getKeyword() { return keyword; }
        public void setKeyword(String keyword) { this.keyword = keyword; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getImportance() { return importance; }
        public void setImportance(String importance) { this.importance = importance; }

        public String getSuggestion() { return suggestion; }
        public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
    }
}
