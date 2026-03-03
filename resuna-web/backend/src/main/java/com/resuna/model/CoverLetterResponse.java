package com.resuna.model;

public class CoverLetterResponse {
    private String content;
    private int wordCount;
    private int creditsUsed;

    public CoverLetterResponse() {}

    public CoverLetterResponse(String content, int wordCount, int creditsUsed) {
        this.content = content;
        this.wordCount = wordCount;
        this.creditsUsed = creditsUsed;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public int getWordCount() { return wordCount; }
    public void setWordCount(int wordCount) { this.wordCount = wordCount; }

    public int getCreditsUsed() { return creditsUsed; }
    public void setCreditsUsed(int creditsUsed) { this.creditsUsed = creditsUsed; }
}
