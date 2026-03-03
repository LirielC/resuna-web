package com.resuna.service;

import com.resuna.exception.ResourceNotFoundException;
import com.resuna.exception.UnauthorizedException;
import com.resuna.model.Resume;
import com.resuna.repository.ResumeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests for ProductionResumeService.
 * Covers: IDOR protection, CRUD operations, userId enforcement.
 */
class ProductionResumeServiceTest {

    private ProductionResumeService service;
    private ResumeRepository repository;

    @BeforeEach
    void setUp() {
        repository = mock(ResumeRepository.class);
        service = new ProductionResumeService(repository);
    }

    private Resume createResume(String id, String userId) {
        Resume resume = new Resume();
        resume.setId(id);
        resume.setUserId(userId);
        resume.setTitle("Test Resume");
        resume.setCreatedAt(Instant.now());
        resume.setUpdatedAt(Instant.now());
        return resume;
    }

    // ── Create ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createResume")
    class CreateTests {

        @Test
        @DisplayName("Sets userId from authenticated context, not from request body")
        void create_overridesUserIdFromBody() throws Exception {
            Resume input = new Resume();
            input.setUserId("attacker-id"); // trying to set another user's ID
            input.setTitle("Injected Resume");

            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume result = service.createResume(input, "real-user-id");

            assertEquals("real-user-id", result.getUserId(),
                    "userId must come from auth context, not request body");
        }

        @Test
        @DisplayName("Generates UUID when id is null")
        void create_generatesId() throws Exception {
            Resume input = new Resume();
            input.setTitle("No ID");

            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume result = service.createResume(input, "user-1");

            assertNotNull(result.getId(), "Should generate UUID");
            assertFalse(result.getId().isEmpty());
        }

        @Test
        @DisplayName("Sets createdAt and updatedAt timestamps")
        void create_setsTimestamps() throws Exception {
            Resume input = new Resume();
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume result = service.createResume(input, "user-1");

            assertNotNull(result.getCreatedAt());
            assertNotNull(result.getUpdatedAt());
        }
    }

    // ── Read (IDOR protection) ───────────────────────────────────────────

    @Nested
    @DisplayName("getResumeById — IDOR Protection")
    class ReadTests {

        @Test
        @DisplayName("Owner can access their own resume")
        void owner_canAccess() throws Exception {
            Resume resume = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(resume));

            Resume result = service.getResumeById("res-1", "user-A");

            assertEquals("res-1", result.getId());
        }

        @Test
        @DisplayName("Non-owner is blocked from accessing resume (IDOR)")
        void nonOwner_isBlocked() throws Exception {
            Resume resume = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(resume));

            assertThrows(UnauthorizedException.class, () -> service.getResumeById("res-1", "attacker-user"),
                    "Should throw UnauthorizedException for non-owner");
        }

        @Test
        @DisplayName("Non-existent resume throws ResourceNotFoundException")
        void notFound_throwsException() throws Exception {
            when(repository.findById("nonexistent")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> service.getResumeById("nonexistent", "user-A"));
        }
    }

    // ── Update ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateResume")
    class UpdateTests {

        @Test
        @DisplayName("Owner can update their resume")
        void owner_canUpdate() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(existing));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume update = new Resume();
            update.setTitle("Updated Title");

            Resume result = service.updateResume("res-1", update, "user-A");

            assertEquals("Updated Title", result.getTitle());
            assertEquals("user-A", result.getUserId());
            assertEquals(existing.getCreatedAt(), result.getCreatedAt(),
                    "createdAt should not change on update");
        }

        @Test
        @DisplayName("Non-owner cannot update resume")
        void nonOwner_cannotUpdate() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(existing));

            assertThrows(UnauthorizedException.class, () -> service.updateResume("res-1", new Resume(), "attacker"));
        }

        @Test
        @DisplayName("Update preserves userId even if body contains different userId")
        void update_preservesUserId() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(existing));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume update = new Resume();
            update.setUserId("attacker-id"); // attempt to change owner

            Resume result = service.updateResume("res-1", update, "user-A");

            assertEquals("user-A", result.getUserId(),
                    "Update should not allow changing userId");
        }

        @Test
        @DisplayName("Partial update (summary only) preserves existing resume content")
        void update_summaryOnly_preservesExistingData() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            existing.setSummary("Existing summary");
            Resume.PersonalInfo info = new Resume.PersonalInfo();
            info.setFullName("Alice");
            info.setEmail("alice@example.com");
            existing.setPersonalInfo(info);

            when(repository.findById("res-1")).thenReturn(Optional.of(existing));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Resume update = new Resume();
            update.setSummary("Updated summary");

            Resume result = service.updateResume("res-1", update, "user-A");

            assertEquals("Test Resume", result.getTitle(), "Title should be preserved");
            assertEquals("Updated summary", result.getSummary(), "Summary should be updated");
            assertNotNull(result.getPersonalInfo(), "Personal info should be preserved");
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteResume")
    class DeleteTests {

        @Test
        @DisplayName("Owner can delete their resume")
        void owner_canDelete() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(existing));

            assertDoesNotThrow(() -> service.deleteResume("res-1", "user-A"));
            verify(repository).deleteById("res-1");
        }

        @Test
        @DisplayName("Non-owner cannot delete resume")
        void nonOwner_cannotDelete() throws Exception {
            Resume existing = createResume("res-1", "user-A");
            when(repository.findById("res-1")).thenReturn(Optional.of(existing));

            assertThrows(UnauthorizedException.class, () -> service.deleteResume("res-1", "attacker"));
            verify(repository, never()).deleteById(any());
        }
    }

    // ── List ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllResumes")
    class ListTests {

        @Test
        @DisplayName("Returns only resumes belonging to the requesting user")
        void list_returnOnlyOwnResumes() throws Exception {
            Resume r1 = createResume("res-1", "user-A");
            Resume r2 = createResume("res-2", "user-A");
            when(repository.findAllByUserId("user-A")).thenReturn(List.of(r1, r2));

            List<Resume> results = service.getAllResumes("user-A");

            assertEquals(2, results.size());
            assertTrue(results.stream().allMatch(r -> r.getUserId().equals("user-A")));
        }
    }

}
