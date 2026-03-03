package com.resuna.controller;

import com.resuna.exception.UnauthorizedException;
import com.resuna.model.ATSAnalysisResult;
import com.resuna.model.Resume;
import com.resuna.model.UserStatsDTO;
import com.resuna.service.ATSService;
import com.resuna.service.ResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final ResumeService resumeService;
    private final ATSService atsService;

    public UserController(ResumeService resumeService, ATSService atsService) {
        this.resumeService = resumeService;
        this.atsService = atsService;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        return userId.toString();
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
