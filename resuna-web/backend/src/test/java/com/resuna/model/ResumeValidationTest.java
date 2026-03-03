package com.resuna.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for Resume model validation annotations (Fix #5).
 * Covers: @NotBlank, @Email, @Size on PersonalInfo, Experience, Education,
 * Project, Certification, Language, and nested list validation.
 */
class ResumeValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Resume.PersonalInfo validPersonalInfo() {
        Resume.PersonalInfo info = new Resume.PersonalInfo();
        info.setFullName("John Doe");
        info.setEmail("john@example.com");
        return info;
    }

    private Resume validResume() {
        Resume resume = new Resume();
        resume.setTitle("My Resume");
        resume.setSummary("A brief summary");
        resume.setPersonalInfo(validPersonalInfo());
        return resume;
    }

    // ── PersonalInfo validation ──────────────────────────────────────────

    @Nested
    @DisplayName("PersonalInfo Validation")
    class PersonalInfoTests {

        @Test
        @DisplayName("Valid PersonalInfo passes validation")
        void validInfo_passes() {
            Resume resume = validResume();
            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty(), "Valid resume should have no violations");
        }

        @Test
        @DisplayName("Missing fullName is rejected")
        void missingFullName_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setEmail("test@example.com");
            // fullName is null

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("fullName")),
                    "Should have violation for fullName");
        }

        @Test
        @DisplayName("Blank fullName is rejected")
        void blankFullName_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("   ");
            info.setEmail("test@example.com");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("fullName")),
                    "Blank fullName should be rejected");
        }

        @Test
        @DisplayName("Missing email is rejected")
        void missingEmail_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("John Doe");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("email")),
                    "Should have violation for email");
        }

        @Test
        @DisplayName("Invalid email format is rejected")
        void invalidEmail_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("John Doe");
            info.setEmail("not-an-email");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("email")),
                    "Invalid email should be rejected");
        }

        @Test
        @DisplayName("FullName exceeding max length is rejected")
        void fullNameTooLong_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("A".repeat(201));
            info.setEmail("test@example.com");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("fullName")),
                    "FullName over 200 chars should be rejected");
        }

        @Test
        @DisplayName("Email exceeding max length is rejected")
        void emailTooLong_rejected() {
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("John");
            info.setEmail("a".repeat(250) + "@b.c");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty(), "Email over 254 chars should be rejected");
        }

        @Test
        @DisplayName("Optional fields can be null")
        void optionalFields_canBeNull() {
            Resume.PersonalInfo info = validPersonalInfo();
            // phone, location, linkedin, github, website all null

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty(), "Null optional fields should pass");
        }

        @Test
        @DisplayName("LinkedIn URL within max length passes")
        void linkedinWithinLimit_passes() {
            Resume.PersonalInfo info = validPersonalInfo();
            info.setLinkedin("https://linkedin.com/in/johndoe");

            Resume resume = new Resume();
            resume.setPersonalInfo(info);

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty());
        }
    }

    // ── Title & Summary ──────────────────────────────────────────────────

    @Nested
    @DisplayName("Title and Summary Validation")
    class TitleSummaryTests {

        @Test
        @DisplayName("Title exceeding max length is rejected")
        void titleTooLong_rejected() {
            Resume resume = validResume();
            resume.setTitle("A".repeat(201));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("title")),
                    "Title over 200 chars should be rejected");
        }

        @Test
        @DisplayName("Summary exceeding max length is rejected")
        void summaryTooLong_rejected() {
            Resume resume = validResume();
            resume.setSummary("A".repeat(5001));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("summary")),
                    "Summary over 5000 chars should be rejected");
        }
    }

    // ── Experience validation ────────────────────────────────────────────

    @Nested
    @DisplayName("Experience Validation")
    class ExperienceTests {

        @Test
        @DisplayName("Experience with valid data passes")
        void validExperience_passes() {
            Resume.Experience exp = new Resume.Experience();
            exp.setTitle("Software Engineer");
            exp.setCompany("Acme Corp");
            exp.setStartDate("2023-01");

            Resume resume = validResume();
            resume.setExperience(List.of(exp));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Experience title exceeding max is rejected")
        void titleTooLong_rejected() {
            Resume.Experience exp = new Resume.Experience();
            exp.setTitle("A".repeat(201));

            Resume resume = validResume();
            resume.setExperience(List.of(exp));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }

    // ── Education validation ─────────────────────────────────────────────

    @Nested
    @DisplayName("Education Validation")
    class EducationTests {

        @Test
        @DisplayName("Education with valid data passes")
        void validEducation_passes() {
            Resume.Education edu = new Resume.Education();
            edu.setDegree("BS Computer Science");
            edu.setInstitution("MIT");

            Resume resume = validResume();
            resume.setEducation(List.of(edu));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("GPA exceeding max length is rejected")
        void gpaTooLong_rejected() {
            Resume.Education edu = new Resume.Education();
            edu.setGpa("A".repeat(11));

            Resume resume = validResume();
            resume.setEducation(List.of(edu));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }

    // ── Project validation ───────────────────────────────────────────────

    @Nested
    @DisplayName("Project Validation")
    class ProjectTests {

        @Test
        @DisplayName("Project with valid data passes")
        void validProject_passes() {
            Resume.Project proj = new Resume.Project();
            proj.setName("Cool Project");
            proj.setDescription("A description");
            proj.setTechnologies(List.of("Java", "React"));

            Resume resume = validResume();
            resume.setProjects(List.of(proj));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Project description exceeding max is rejected")
        void descriptionTooLong_rejected() {
            Resume.Project proj = new Resume.Project();
            proj.setName("Project");
            proj.setDescription("A".repeat(2001));

            Resume resume = validResume();
            resume.setProjects(List.of(proj));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }

    // ── Skills validation ────────────────────────────────────────────────

    @Nested
    @DisplayName("Skills Validation")
    class SkillsTests {

        @Test
        @DisplayName("Valid skills list passes")
        void validSkills_passes() {
            Resume resume = validResume();
            resume.setSkills(List.of("Java", "Spring", "React"));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Skill exceeding max length is rejected")
        void skillTooLong_rejected() {
            Resume resume = validResume();
            resume.setSkills(List.of("A".repeat(101)));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }

    // ── Certification & Language ──────────────────────────────────────────

    @Nested
    @DisplayName("Certification Validation")
    class CertificationTests {

        @Test
        @DisplayName("Certification name exceeding max is rejected")
        void nameTooLong_rejected() {
            Resume.Certification cert = new Resume.Certification();
            cert.setName("A".repeat(201));

            Resume resume = validResume();
            resume.setCertifications(List.of(cert));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }

    @Nested
    @DisplayName("Language Validation")
    class LanguageTests {

        @Test
        @DisplayName("Language name exceeding max is rejected")
        void nameTooLong_rejected() {
            Resume.Language lang = new Resume.Language();
            lang.setName("A".repeat(101));

            Resume resume = validResume();
            resume.setLanguages(List.of(lang));

            Set<ConstraintViolation<Resume>> violations = validator.validate(resume);
            assertFalse(violations.isEmpty());
        }
    }
}
