package com.resuna.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request for analyzing a PDF resume against a job description.
 */
public class PDFAnalysisRequest {

    @NotBlank
    @Size(max = 8000)
    private String jobDescription;

    @Size(max = 120)
    private String jobTitle;

    @Size(max = 120)
    private String company;

    // Getters and Setters
    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }
}
