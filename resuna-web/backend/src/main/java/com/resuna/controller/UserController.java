package com.resuna.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.resuna.exception.UnauthorizedException;
import com.resuna.model.ATSAnalysisResult;
import com.resuna.model.Resume;
import com.resuna.model.UserStatsDTO;
import com.resuna.repository.ATSAnalysisRepository;
import com.resuna.repository.SubscriptionRepository;
import com.resuna.repository.UserProfileRepository;
import com.resuna.service.ATSService;
import com.resuna.service.ResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final ResumeService resumeService;
    private final ATSService atsService;
    private final SubscriptionRepository subscriptionRepository;
    private final UserProfileRepository userProfileRepository;
    private final ATSAnalysisRepository atsAnalysisRepository;

    public UserController(ResumeService resumeService, ATSService atsService,
                          SubscriptionRepository subscriptionRepository,
                          UserProfileRepository userProfileRepository,
                          ATSAnalysisRepository atsAnalysisRepository) {
        this.resumeService = resumeService;
        this.atsService = atsService;
        this.subscriptionRepository = subscriptionRepository;
        this.userProfileRepository = userProfileRepository;
        this.atsAnalysisRepository = atsAnalysisRepository;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(HttpServletRequest request) {
        String userId = null;
        try {
            userId = getCurrentUserId(request);
            logger.info("Starting full account deletion for user {}", userId);

            // 1. Delete all resumes
            resumeService.deleteAllByUserId(userId);

            // 2. Delete ATS analyses subcollection + user doc
            try { atsAnalysisRepository.deleteAllByUserId(userId); }
            catch (Exception e) { logger.warn("Failed to delete ATS analyses for {}: {}", userId, e.getMessage()); }

            // 3. Delete subscription document
            try { subscriptionRepository.deleteByUserId(userId); }
            catch (Exception e) { logger.warn("Failed to delete subscription for {}: {}", userId, e.getMessage()); }

            // 4. Delete user profile document
            try { userProfileRepository.deleteByUserId(userId); }
            catch (Exception e) { logger.warn("Failed to delete user profile for {}: {}", userId, e.getMessage()); }

            // 5. Delete Firebase Auth user (Admin SDK bypasses recent-login requirement)
            try { FirebaseAuth.getInstance().deleteUser(userId); }
            catch (Exception e) { logger.warn("Failed to delete Firebase Auth user {}: {}", userId, e.getMessage()); }

            logger.info("Account deletion completed for user {}", userId);
            return ResponseEntity.noContent().build();

        } catch (UnauthorizedException e) {
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            logger.error("Failed to delete account for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getUserStats(
            HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);

            // Get Resumes
            List<Resume> resumes = resumeService.getAllResumes(userId);
            int resumeCount = resumes.size();

            // Get ATS Analyses (All)
            List<ATSAnalysisResult> analyses = atsService.getAnalysesByUserId(userId);

            // Calculate Average Best Score per Resume
            double avgScore = 0.0;
            if (!analyses.isEmpty()) {
                // Group by resumeId and find max score for each resume
                Map<String, Integer> bestScoreByResume = analyses.stream()
                        .collect(Collectors.groupingBy(
                                ATSAnalysisResult::getResumeId,
                                Collectors.collectingAndThen(
                                        Collectors.maxBy((a, b) -> Integer.compare(a.getScore(), b.getScore())),
                                        opt -> opt.map(ATSAnalysisResult::getScore).orElse(0))));

                if (!bestScoreByResume.isEmpty()) {
                    avgScore = bestScoreByResume.values().stream()
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);
                }
            }

            // Return DTO
            UserStatsDTO stats = new UserStatsDTO();
            stats.setResumeCount(resumeCount);
            stats.setAvgAtsScore(Math.round(avgScore * 10.0) / 10.0); // Round to 1 decimal
            // MemberSince and PlanName handled by frontend/auth context, or subscription
            // service later

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
