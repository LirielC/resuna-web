#!/usr/bin/env python3
"""
Test script for ATS Engine analysis without running the full server.
This demonstrates the NLP analysis capabilities.
"""

import json
from typing import Dict, Any

# Mock the main.py functions for testing without dependencies
def test_analysis():
    """Test the analysis logic with sample data."""
    
    # Sample resume
    resume = {
        "id": "test-123",
        "title": "Senior Software Engineer Resume",
        "skills": ["Java", "Spring Boot", "React", "TypeScript", "Docker", "AWS"],
        "summary": "Experienced software engineer with 7+ years building scalable web applications",
        "experience": [
            {
                "title": "Senior Software Engineer",
                "company": "Tech Company",
                "bullets": [
                    "Built microservices using Java and Spring Boot",
                    "Developed React applications with TypeScript",
                    "Deployed applications to AWS using Docker",
                    "Improved system performance by 40%"
                ]
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Computer Science",
                "institution": "University"
            }
        ]
    }
    
    # Sample job description
    job_description = """
    We are looking for a Senior Software Engineer with strong experience in:
    - Java and Spring Boot (required)
    - React and TypeScript (required)
    - Docker and Kubernetes (required)
    - AWS cloud services (preferred)
    - Python for scripting (nice to have)
    - CI/CD pipelines with Jenkins or GitLab
    
    Must have 5+ years of experience building scalable microservices.
    Bachelor's degree in Computer Science or related field required.
    """
    
    print("=" * 60)
    print("  ATS Engine - Analysis Test")
    print("=" * 60)
    print()
    
    # Extract skills from resume
    resume_skills = set([s.lower() for s in resume["skills"]])
    print(f"📄 Resume Skills: {resume_skills}")
    print()
    
    # Extract required skills from job
    job_skills = {
        "java", "spring boot", "react", "typescript", 
        "docker", "kubernetes", "aws", "python", "ci/cd"
    }
    print(f"🎯 Job Requirements: {job_skills}")
    print()
    
    # Calculate matches
    matches = []
    gaps = []
    
    for skill in job_skills:
        found = any(skill in resume_skill or resume_skill in skill 
                   for resume_skill in resume_skills)
        
        if found:
            matches.append({
                "keyword": skill,
                "category": "skill",
                "frequency": 1
            })
        else:
            importance = "critical" if "required" in job_description.lower() and skill in job_description.lower() else "important"
            gaps.append({
                "keyword": skill,
                "category": "skill",
                "importance": importance,
                "suggestion": f"Add '{skill}' to your resume"
            })
    
    # Calculate scores
    keyword_score = int((len(matches) / len(job_skills)) * 100)
    skills_score = keyword_score - (len([g for g in gaps if g["importance"] == "critical"]) * 10)
    skills_score = max(0, min(100, skills_score))
    
    experience_score = 85  # Has 7+ years and quantified achievements
    education_score = 100  # Has required degree
    
    overall_score = int(
        keyword_score * 0.35 +
        skills_score * 0.35 +
        experience_score * 0.20 +
        education_score * 0.10
    )
    
    # Results
    print("✅ MATCHES:")
    for match in matches:
        print(f"  • {match['keyword']}")
    print()
    
    print("❌ GAPS:")
    for gap in gaps:
        print(f"  • {gap['keyword']} ({gap['importance']})")
    print()
    
    print("📊 SCORES:")
    print(f"  Keyword Match:  {keyword_score}/100")
    print(f"  Skills Match:   {skills_score}/100")
    print(f"  Experience:     {experience_score}/100")
    print(f"  Education:      {education_score}/100")
    print(f"  ─────────────────────────")
    print(f"  OVERALL SCORE:  {overall_score}/100")
    print()
    
    print("💡 RECOMMENDATIONS:")
    if overall_score >= 85:
        print("  • Your resume is an excellent match for this position!")
    elif overall_score >= 70:
        print("  • Your resume is a good match with room for improvement")
    else:
        print("  • Your resume needs significant improvements")
    
    for gap in gaps[:3]:
        if gap["importance"] == "critical":
            print(f"  • CRITICAL: {gap['suggestion']}")
        else:
            print(f"  • {gap['suggestion']}")
    
    print("  • Quantify your achievements with numbers and metrics")
    print("  • Use action verbs to start each bullet point")
    print()
    
    print("=" * 60)
    print("  Analysis Complete")
    print("=" * 60)
    
    return {
        "score": overall_score,
        "matches": len(matches),
        "gaps": len(gaps),
        "breakdown": {
            "keyword": keyword_score,
            "skills": skills_score,
            "experience": experience_score,
            "education": education_score
        }
    }


if __name__ == "__main__":
    result = test_analysis()
    print()
    print(f"Final Result: {json.dumps(result, indent=2)}")
