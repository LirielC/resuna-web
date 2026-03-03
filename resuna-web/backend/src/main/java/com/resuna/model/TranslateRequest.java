package com.resuna.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TranslateRequest {
    @Size(max = 120)
    private String resumeId;

    private Resume resume;

    @NotBlank
    @Size(max = 10)
    private String targetLanguage;

    @Size(max = 120)
    private String newResumeName;

    @Size(max = 2048)
    private String captchaToken;

    public TranslateRequest() {}

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }

    public String getNewResumeName() { return newResumeName; }
    public void setNewResumeName(String newResumeName) { this.newResumeName = newResumeName; }

    public String getCaptchaToken() { return captchaToken; }
    public void setCaptchaToken(String captchaToken) { this.captchaToken = captchaToken; }
}
