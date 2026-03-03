package com.resuna.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ATSAnalysisRequest {
    @Size(max = 120)
    private String resumeId;

    @Valid
    private Resume resume;

    @NotBlank
    @Size(max = 8000)
    private String jobDescription;

    @Size(max = 120)
    private String jobTitle;

    @Size(max = 120)
    private String company;

    public ATSAnalysisRequest() {}

    public String getResumeId() { return resumeId; }
    public void setResumeId(String resumeId) { this.resumeId = resumeId; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
}
