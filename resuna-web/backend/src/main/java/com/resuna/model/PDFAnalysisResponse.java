package com.resuna.model;

import java.util.List;

/**
 * Response for PDF resume analysis against a job description.
 */
public class PDFAnalysisResponse {

    private int score;
    private List<String> matchedKeywords;
    private List<String> missingKeywords;
    private List<String> suggestions;
    private List<String> formatIssues;
    private ExtractedInfo extractedInfo;

    // Getters and Setters
    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public List<String> getMatchedKeywords() {
        return matchedKeywords;
    }

    public void setMatchedKeywords(List<String> matchedKeywords) {
        this.matchedKeywords = matchedKeywords;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public List<String> getFormatIssues() {
        return formatIssues;
    }

    public void setFormatIssues(List<String> formatIssues) {
        this.formatIssues = formatIssues;
    }

    public ExtractedInfo getExtractedInfo() {
        return extractedInfo;
    }

    public void setExtractedInfo(ExtractedInfo extractedInfo) {
        this.extractedInfo = extractedInfo;
    }

    /**
     * Information extracted from the PDF resume.
     */
    public static class ExtractedInfo {
        private String name;
        private String email;
        private String phone;
        private List<String> skills;
        private int totalCharacters;

        // Getters and Setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public List<String> getSkills() {
            return skills;
        }

        public void setSkills(List<String> skills) {
            this.skills = skills;
        }

        public int getTotalCharacters() {
            return totalCharacters;
        }

        public void setTotalCharacters(int totalCharacters) {
            this.totalCharacters = totalCharacters;
        }
    }
}
