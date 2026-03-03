package com.resuna.model;

import java.util.List;

/**
 * Response model for AI resume critique.
 * Contains strengths, weaknesses, and an overall qualitative assessment.
 */
public class CritiqueResponse {
    private int overallScore;
    private String overallVerdict;
    private List<String> strengths;
    private List<CritiqueItem> weaknesses;
    private List<String> quickWins;
    private int creditsUsed;

    public CritiqueResponse() {
    }

    public CritiqueResponse(int overallScore, String overallVerdict, List<String> strengths,
            List<CritiqueItem> weaknesses, List<String> quickWins, int creditsUsed) {
        this.overallScore = overallScore;
        this.overallVerdict = overallVerdict;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.quickWins = quickWins;
        this.creditsUsed = creditsUsed;
    }

    public int getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(int overallScore) {
        this.overallScore = overallScore;
    }

    public String getOverallVerdict() {
        return overallVerdict;
    }

    public void setOverallVerdict(String overallVerdict) {
        this.overallVerdict = overallVerdict;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<CritiqueItem> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<CritiqueItem> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<String> getQuickWins() {
        return quickWins;
    }

    public void setQuickWins(List<String> quickWins) {
        this.quickWins = quickWins;
    }

    public int getCreditsUsed() {
        return creditsUsed;
    }

    public void setCreditsUsed(int creditsUsed) {
        this.creditsUsed = creditsUsed;
    }

    /**
     * A single weakness/improvement item with a section, issue, and suggestion.
     */
    public static class CritiqueItem {
        private String section;
        private String issue;
        private String suggestion;
        private String severity; // "critical", "important", "minor"

        public CritiqueItem() {
        }

        public CritiqueItem(String section, String issue, String suggestion, String severity) {
            this.section = section;
            this.issue = issue;
            this.suggestion = suggestion;
            this.severity = severity;
        }

        public String getSection() {
            return section;
        }

        public void setSection(String section) {
            this.section = section;
        }

        public String getIssue() {
            return issue;
        }

        public void setIssue(String issue) {
            this.issue = issue;
        }

        public String getSuggestion() {
            return suggestion;
        }

        public void setSuggestion(String suggestion) {
            this.suggestion = suggestion;
        }

        public String getSeverity() {
            return severity;
        }

        public void setSeverity(String severity) {
            this.severity = severity;
        }
    }
}
