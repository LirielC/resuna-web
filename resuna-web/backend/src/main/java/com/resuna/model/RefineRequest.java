package com.resuna.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class RefineRequest {
    @Size(max = 120)
    private String resumeId;

    @NotNull(message = "Either resumeId or resume must be provided")
    private Resume resume;

    @Size(max = 50)
    private List<@Size(max = 300) String> bullets;

    @Size(max = 8000)
    private String jobDescription;

    @Size(max = 25)
    private List<@Size(max = 40) String> targetKeywords;

    @Size(max = 30)
    private String tone;

    @Size(max = 2048)
    private String captchaToken;

    public RefineRequest() {}

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public List<String> getBullets() { return bullets; }
    public void setBullets(List<String> bullets) { this.bullets = bullets; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public List<String> getTargetKeywords() { return targetKeywords; }
    public void setTargetKeywords(List<String> targetKeywords) { this.targetKeywords = targetKeywords; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }

    public String getCaptchaToken() { return captchaToken; }
    public void setCaptchaToken(String captchaToken) { this.captchaToken = captchaToken; }
}
