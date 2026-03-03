package com.resuna.model;

public class TranslateResponse {
    private String translatedResumeId;
    private String targetLanguage;
    private int creditsUsed;
    private String message;

    public TranslateResponse() {}

    public TranslateResponse(String translatedResumeId, String targetLanguage, int creditsUsed, String message) {
        this.translatedResumeId = translatedResumeId;
        this.targetLanguage = targetLanguage;
        this.creditsUsed = creditsUsed;
        this.message = message;
    }

    public String getTranslatedResumeId() { return translatedResumeId; }
    public void setTranslatedResumeId(String translatedResumeId) { this.translatedResumeId = translatedResumeId; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public int getCreditsUsed() { return creditsUsed; }
    public void setCreditsUsed(int creditsUsed) { this.creditsUsed = creditsUsed; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
