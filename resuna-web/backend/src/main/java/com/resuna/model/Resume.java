package com.resuna.model;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class Resume {

    private String id;
    private String userId;

    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 10)
    private String language; // e.g. "pt-BR", "en"

    @Valid
    private PersonalInfo personalInfo;

    @Size(max = 5000, message = "Summary must not exceed 5000 characters")
    private String summary;

    @Valid
    private List<Experience> experience;

    @Valid
    private List<Project> projects;

    @Valid
    private List<Education> education;

    private List<@Size(max = 100, message = "Each skill must not exceed 100 characters") String> skills;

    private List<SkillGroup> skillGroups;

    @Valid
    private List<Certification> certifications;

    @Valid
    private List<Language> languages;

    private Instant createdAt;
    private Instant updatedAt;

    public Resume() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public PersonalInfo getPersonalInfo() {
        return personalInfo;
    }

    public void setPersonalInfo(PersonalInfo personalInfo) {
        this.personalInfo = personalInfo;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<Experience> getExperience() {
        return experience;
    }

    public void setExperience(List<Experience> experience) {
        this.experience = experience;
    }

    public List<Project> getProjects() {
        return projects;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public List<Education> getEducation() {
        return education;
    }

    public void setEducation(List<Education> education) {
        this.education = education;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<SkillGroup> getSkillGroups() {
        return skillGroups;
    }

    public void setSkillGroups(List<SkillGroup> skillGroups) {
        this.skillGroups = skillGroups;
    }

    public List<Certification> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<Certification> certifications) {
        this.certifications = certifications;
    }

    public List<Language> getLanguages() {
        return languages;
    }

    public void setLanguages(List<Language> languages) {
        this.languages = languages;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Nested Classes

    public static class SkillGroup {
        private String category;
        private List<String> items;

        public SkillGroup() {}

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public List<String> getItems() { return items; }
        public void setItems(List<String> items) { this.items = items; }
    }

    public static class PersonalInfo {
        @NotBlank(message = "Full name is required")
        @Size(max = 200, message = "Full name must not exceed 200 characters")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        @Size(max = 254, message = "Email must not exceed 254 characters")
        private String email;

        @Size(max = 50, message = "Phone must not exceed 50 characters")
        private String phone;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        @Size(max = 500, message = "LinkedIn URL must not exceed 500 characters")
        @Pattern(regexp = "^(https?://.*|)$", message = "URL must start with http:// or https://")
        private String linkedin;

        @Size(max = 500, message = "GitHub URL must not exceed 500 characters")
        @Pattern(regexp = "^(https?://.*|)$", message = "URL must start with http:// or https://")
        private String github;

        @Size(max = 500, message = "Website URL must not exceed 500 characters")
        @Pattern(regexp = "^(https?://.*|)$", message = "URL must start with http:// or https://")
        private String website;

        public PersonalInfo() {
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
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

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getLinkedin() {
            return linkedin;
        }

        public void setLinkedin(String linkedin) {
            this.linkedin = linkedin;
        }

        public String getGithub() {
            return github;
        }

        public void setGithub(String github) {
            this.github = github;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }
    }

    public static class Experience {
        @Size(max = 200, message = "Job title must not exceed 200 characters")
        private String title;

        @Size(max = 200, message = "Company name must not exceed 200 characters")
        private String company;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        @Size(max = 20, message = "Start date must not exceed 20 characters")
        private String startDate;

        @Size(max = 20, message = "End date must not exceed 20 characters")
        private String endDate;

        private boolean current;

        private List<@Size(max = 1000, message = "Each bullet point must not exceed 1000 characters") String> bullets;

        public Experience() {
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCompany() {
            return company;
        }

        public void setCompany(String company) {
            this.company = company;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }

        public boolean isCurrent() {
            return current;
        }

        public void setCurrent(boolean current) {
            this.current = current;
        }

        public List<String> getBullets() {
            return bullets;
        }

        public void setBullets(List<String> bullets) {
            this.bullets = bullets;
        }
    }

    public static class Project {
        @Size(max = 200, message = "Project name must not exceed 200 characters")
        private String name;

        @Size(max = 2000, message = "Project description must not exceed 2000 characters")
        private String description;

        private List<@Size(max = 100, message = "Each technology must not exceed 100 characters") String> technologies;

        @Size(max = 500, message = "Project URL must not exceed 500 characters")
        private String url;

        @Size(max = 20, message = "Start date must not exceed 20 characters")
        private String startDate;

        @Size(max = 20, message = "End date must not exceed 20 characters")
        private String endDate;

        private List<@Size(max = 1000, message = "Each bullet point must not exceed 1000 characters") String> bullets;

        public Project() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public List<String> getTechnologies() {
            return technologies;
        }

        public void setTechnologies(List<String> technologies) {
            this.technologies = technologies;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }

        public List<String> getBullets() {
            return bullets;
        }

        public void setBullets(List<String> bullets) {
            this.bullets = bullets;
        }
    }

    public static class Education {
        @Size(max = 200, message = "Degree must not exceed 200 characters")
        private String degree;

        @Size(max = 200, message = "Institution must not exceed 200 characters")
        private String institution;

        @Size(max = 200, message = "Location must not exceed 200 characters")
        private String location;

        @Size(max = 20, message = "Start date must not exceed 20 characters")
        private String startDate;

        @Size(max = 20, message = "Graduation date must not exceed 20 characters")
        private String graduationDate;

        @Size(max = 10, message = "GPA must not exceed 10 characters")
        private String gpa;

        public Education() {
        }

        public String getDegree() {
            return degree;
        }

        public void setDegree(String degree) {
            this.degree = degree;
        }

        public String getInstitution() {
            return institution;
        }

        public void setInstitution(String institution) {
            this.institution = institution;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getGraduationDate() {
            return graduationDate;
        }

        public void setGraduationDate(String graduationDate) {
            this.graduationDate = graduationDate;
        }

        public String getGpa() {
            return gpa;
        }

        public void setGpa(String gpa) {
            this.gpa = gpa;
        }
    }

    public static class Certification {
        @Size(max = 200, message = "Certification name must not exceed 200 characters")
        private String name;

        @Size(max = 200, message = "Issuer must not exceed 200 characters")
        private String issuer;

        @Size(max = 20, message = "Date must not exceed 20 characters")
        private String date;

        @Size(max = 500, message = "URL must not exceed 500 characters")
        private String url;

        public Certification() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

    public static class Language {
        @Size(max = 100, message = "Language name must not exceed 100 characters")
        private String name;

        @Size(max = 50, message = "Language level must not exceed 50 characters")
        private String level;

        public Language() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getLevel() {
            return level;
        }

        public void setLevel(String level) {
            this.level = level;
        }
    }
}
