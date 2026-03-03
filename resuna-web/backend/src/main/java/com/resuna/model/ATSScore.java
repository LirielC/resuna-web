package com.resuna.model;

import java.time.Instant;

public class ATSScore {
    private String resumeId;
    private String jobTitle;
    private int score;
    private int matchedKeywords;
    private int totalKeywords;
    private Instant analyzedAt;

    public ATSScore() {}

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getMatchedKeywords() { return matchedKeywords; }
    public void setMatchedKeywords(int matchedKeywords) { this.matchedKeywords = matchedKeywords; }

    public int getTotalKeywords() { return totalKeywords; }
    public void setTotalKeywords(int totalKeywords) { this.totalKeywords = totalKeywords; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }
}
