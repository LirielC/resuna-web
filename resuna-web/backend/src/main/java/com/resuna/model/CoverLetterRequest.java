package com.resuna.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CoverLetterRequest {
    @Size(max = 120)
    private String resumeId;

    private Resume resume;

    @Size(max = 120)
    private String jobTitle;

    @Size(max = 120)
    private String company;

    @NotBlank
    @Size(max = 8000)
    private String jobDescription;

    @Size(max = 120)
    private String hiringManager;

    @Size(max = 2000)
    private String additionalContext;

    @Size(max = 30)
    private String tone;

    @Size(max = 20)
    private String length;

    @Size(max = 2048)
    private String captchaToken;

    @Size(max = 8000)
    private String existingContent;

    public CoverLetterRequest() {}

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public String getHiringManager() { return hiringManager; }
    public void setHiringManager(String hiringManager) { this.hiringManager = hiringManager; }

    public String getAdditionalContext() { return additionalContext; }
    public void setAdditionalContext(String additionalContext) { this.additionalContext = additionalContext; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }

    public String getLength() { return length; }
    public void setLength(String length) { this.length = length; }

    public String getCaptchaToken() { return captchaToken; }
    public void setCaptchaToken(String captchaToken) { this.captchaToken = captchaToken; }

    public String getExistingContent() { return existingContent; }
    public void setExistingContent(String existingContent) { this.existingContent = existingContent; }
}
