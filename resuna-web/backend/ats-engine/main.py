"""
ATS Engine - FastAPI service for resume analysis using NLP.

This service uses spaCy for advanced NLP analysis including:
- Named Entity Recognition (NER)
- Part-of-Speech (POS) tagging
- Dependency parsing
- Semantic similarity
- TF-IDF keyword extraction
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Set
import re
from datetime import datetime
import logging
from collections import Counter
import string
import os
import hmac

# NLP libraries
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load spaCy model — must be pre-installed (e.g. via requirements.txt or Dockerfile).
# Never download models at runtime to avoid supply-chain risk.
try:
    nlp = spacy.load("en_core_web_md")  # Medium model with word vectors
    logger.info("✓ spaCy model 'en_core_web_md' loaded successfully")
except OSError as e:
    logger.error(
        "✗ spaCy model 'en_core_web_md' not found. "
        "Install it before starting the service: "
        "python -m spacy download en_core_web_md"
    )
    raise RuntimeError("Required spaCy model 'en_core_web_md' is not installed.") from e

app = FastAPI(
    title="Resuna ATS Engine",
    description="NLP-powered ATS analysis for resumes",
    version="1.0.0"
)

ATS_API_KEY = os.getenv("ATS_API_KEY", "")

def _parse_allowed_origins() -> List[str]:
    raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


allowed_origins = _parse_allowed_origins()
allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() == "true"
if "*" in allowed_origins and allow_credentials:
    logger.warning("CORS_ALLOW_CREDENTIALS disabled because wildcard origin is used.")
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def verify_internal_api_key(request: Request) -> None:
    if not ATS_API_KEY:
        logger.error("ATS_API_KEY not configured")
        raise HTTPException(status_code=503, detail="Service unavailable")

    provided = request.headers.get("X-ATS-API-KEY")
    if not provided or not hmac.compare_digest(provided, ATS_API_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ============================================================================
# Data Models
# ============================================================================

class PersonalInfo(BaseModel):
    fullName: Optional[str] = Field(default=None, max_length=120)
    email: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    location: Optional[str] = Field(default=None, max_length=120)
    linkedin: Optional[str] = Field(default=None, max_length=200)
    website: Optional[str] = Field(default=None, max_length=200)


class Experience(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    company: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)
    startDate: Optional[str] = Field(default=None, max_length=30)
    endDate: Optional[str] = Field(default=None, max_length=30)
    current: bool = False
    bullets: List[str] = Field(default_factory=list, max_items=50)


class Education(BaseModel):
    degree: Optional[str] = Field(default=None, max_length=120)
    institution: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)
    graduationDate: Optional[str] = Field(default=None, max_length=30)
    gpa: Optional[str] = Field(default=None, max_length=20)


class Language(BaseModel):
    name: Optional[str] = Field(default=None, max_length=60)
    level: Optional[str] = Field(default=None, max_length=60)


class Resume(BaseModel):
    id: Optional[str] = Field(default=None, max_length=120)
    userId: Optional[str] = Field(default=None, max_length=120)
    title: Optional[str] = Field(default=None, max_length=200)
    personalInfo: Optional[PersonalInfo] = None
    summary: Optional[str] = Field(default=None, max_length=4000)
    experience: List[Experience] = Field(default_factory=list, max_items=50)
    education: List[Education] = Field(default_factory=list, max_items=20)
    skills: List[str] = Field(default_factory=list, max_items=100)
    certifications: List[str] = Field(default_factory=list, max_items=50)
    languages: List[Language] = Field(default_factory=list, max_items=20)


class AnalysisRequest(BaseModel):
    resume: Resume
    job_description: str = Field(..., max_length=8000)
    job_title: Optional[str] = Field(default=None, max_length=120)


class Match(BaseModel):
    keyword: str
    category: str
    frequency: int


class Gap(BaseModel):
    keyword: str
    category: str
    importance: str
    suggestion: str


class ScoreBreakdown(BaseModel):
    keywordMatch: int
    skillsMatch: int
    experienceMatch: int
    educationMatch: int


class AnalysisResult(BaseModel):
    score: int
    scoreBreakdown: ScoreBreakdown
    matches: List[Match]
    gaps: List[Gap]
    recommendations: List[str]


# ============================================================================
# NLP Analysis Functions
# ============================================================================

def preprocess_text(text: str) -> str:
    """Clean and normalize text."""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_technical_skills(text: str) -> Set[str]:
    """
    Extract technical skills and keywords using spaCy NER and pattern matching.
    """
    skills = set()
    text_lower = text.lower()
    
    # Process with spaCy
    doc = nlp(text)
    
    # Extract entities that might be skills (ORG, PRODUCT, etc.)
    for ent in doc.ents:
        if ent.label_ in ['PRODUCT', 'ORG', 'GPE', 'LANGUAGE']:
            skill = ent.text.lower().strip()
            if len(skill) > 2:  # Avoid very short matches
                skills.add(skill)
    
    # Common technical skills patterns
    technical_patterns = {
        # Programming Languages
        'python', 'java', 'javascript', 'typescript', 'go', 'golang', 'rust', 
        'c++', 'c#', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala',
        'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
        
        # Web Frameworks
        'react', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt',
        'django', 'flask', 'fastapi', 'spring', 'spring boot', 'express',
        'nestjs', 'laravel', 'rails', 'asp.net',
        
        # Databases
        'sql', 'nosql', 'mysql', 'postgresql', 'postgres', 'mongodb',
        'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'oracle',
        'sqlite', 'mariadb', 'neo4j',
        
        # Cloud & DevOps
        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
        'jenkins', 'gitlab', 'github', 'ci/cd', 'terraform', 'ansible',
        'puppet', 'chef', 'circleci', 'travis', 'devops',
        
        # Data Science & ML
        'machine learning', 'deep learning', 'data science', 'ai',
        'artificial intelligence', 'nlp', 'natural language processing',
        'computer vision', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
        'pandas', 'numpy', 'spark', 'hadoop', 'tableau', 'power bi',
        
        # Mobile
        'ios', 'android', 'react native', 'flutter', 'xamarin', 'swift',
        'kotlin', 'mobile development',
        
        # Other Technologies
        'rest api', 'graphql', 'microservices', 'api', 'grpc',
        'websocket', 'oauth', 'jwt', 'saml', 'ldap',
        'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
        'webpack', 'vite', 'babel', 'git', 'svn', 'agile', 'scrum',
        'kanban', 'jira', 'confluence', 'linux', 'unix', 'windows',
    }
    
    # Multi-word patterns (check first)
    multi_word_patterns = [p for p in technical_patterns if ' ' in p]
    for pattern in multi_word_patterns:
        if pattern in text_lower:
            skills.add(pattern)
    
    # Single word patterns
    words = re.findall(r'\b\w+\b', text_lower)
    for word in words:
        if word in technical_patterns:
            skills.add(word)
    
    # Extract noun chunks that might be skills
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.lower().strip()
        # Check if it's a potential technical term
        if any(tech in chunk_text for tech in technical_patterns):
            skills.add(chunk_text)
    
    return skills


def extract_keywords_tfidf(texts: List[str], top_n: int = 20) -> List[tuple]:
    """
    Extract keywords using TF-IDF.
    Returns list of (keyword, score) tuples.
    """
    if not texts or all(not t for t in texts):
        return []
    
    try:
        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 3),  # Unigrams, bigrams, and trigrams
            min_df=1,
            max_df=0.8
        )
        
        # Fit and transform
        tfidf_matrix = vectorizer.fit_transform(texts)
        feature_names = vectorizer.get_feature_names_out()
        
        # Get scores for first document (job description)
        scores = tfidf_matrix[0].toarray()[0]
        
        # Create keyword-score pairs
        keywords = [(feature_names[i], scores[i]) 
                   for i in range(len(feature_names)) if scores[i] > 0]
        
        # Sort by score and return top N
        keywords.sort(key=lambda x: x[1], reverse=True)
        return keywords[:top_n]
    
    except Exception as e:
        logger.error(f"TF-IDF extraction failed: {e}")
        return []


def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """
    Calculate semantic similarity between two texts using spaCy word vectors.
    Returns similarity score between 0 and 1.
    """
    if not text1 or not text2:
        return 0.0
    
    try:
        doc1 = nlp(text1)
        doc2 = nlp(text2)
        
        # Use spaCy's built-in similarity (based on word vectors)
        similarity = doc1.similarity(doc2)
        return float(similarity)
    
    except Exception as e:
        logger.error(f"Similarity calculation failed: {e}")
        return 0.0


def extract_resume_text(resume: Resume) -> str:
    """Extract all text from resume into a single string."""
    text_parts = []
    
    # Summary
    if resume.summary:
        text_parts.append(resume.summary)
    
    # Skills
    if resume.skills:
        text_parts.append(" ".join(resume.skills))
    
    # Experience
    for exp in resume.experience:
        if exp.title:
            text_parts.append(exp.title)
        if exp.company:
            text_parts.append(exp.company)
        for bullet in exp.bullets:
            text_parts.append(bullet)
    
    # Education
    for edu in resume.education:
        if edu.degree:
            text_parts.append(edu.degree)
        if edu.institution:
            text_parts.append(edu.institution)
    
    # Certifications
    if resume.certifications:
        text_parts.extend(resume.certifications)
    
    return " ".join(text_parts)


def extract_resume_skills(resume: Resume) -> Set[str]:
    """Extract technical skills from resume."""
    skills = set()
    
    # Explicit skills list
    if resume.skills:
        for skill in resume.skills:
            skills.add(skill.lower().strip())
    
    # Extract from full resume text
    resume_text = extract_resume_text(resume)
    technical_skills = extract_technical_skills(resume_text)
    skills.update(technical_skills)
    
    return skills


def analyze_keyword_match(resume_skills: Set[str], job_skills: Set[str], 
                         job_description: str) -> tuple:
    """
    Analyze keyword match between resume and job description.
    Returns (matches, gaps).
    """
    matches = []
    gaps = []
    
    # Count frequency of each skill in job description
    job_lower = job_description.lower()
    
    for job_skill in job_skills:
        # Check if skill exists in resume (exact or partial match)
        found = False
        match_type = "exact"
        
        # Exact match
        if job_skill in resume_skills:
            found = True
            match_type = "exact"
        else:
            # Partial match (e.g., "react" matches "react.js")
            for resume_skill in resume_skills:
                if (job_skill in resume_skill or resume_skill in job_skill):
                    found = True
                    match_type = "partial"
                    break
        
        # Count frequency in job description
        frequency = job_lower.count(job_skill)
        
        if found:
            matches.append(Match(
                keyword=job_skill,
                category="skill",
                frequency=frequency
            ))
        else:
            # Determine importance based on context
            importance = "nice-to-have"
            
            # Check for critical keywords around the skill
            skill_context = []
            for match in re.finditer(r'\b' + re.escape(job_skill) + r'\b', job_lower):
                start = max(0, match.start() - 50)
                end = min(len(job_lower), match.end() + 50)
                skill_context.append(job_lower[start:end])
            
            context_text = " ".join(skill_context).lower()
            
            if any(word in context_text for word in ['required', 'must', 'mandatory', 'essential']):
                importance = "critical"
            elif any(word in context_text for word in ['should', 'preferred', 'strong', 'experience']):
                importance = "important"
            
            # Generate suggestion
            suggestion = f"Add '{job_skill}' to your resume"
            if importance == "critical":
                suggestion = f"CRITICAL: Add '{job_skill}' - this is a required skill"
            elif importance == "important":
                suggestion = f"Consider highlighting '{job_skill}' experience if you have it"
            
            gaps.append(Gap(
                keyword=job_skill,
                category="skill",
                importance=importance,
                suggestion=suggestion
            ))
    
    # Sort matches by frequency (most important first)
    matches.sort(key=lambda x: x.frequency, reverse=True)
    
    # Sort gaps by importance
    importance_order = {"critical": 0, "important": 1, "nice-to-have": 2}
    gaps.sort(key=lambda x: importance_order.get(x.importance, 3))
    
    return matches, gaps


def calculate_experience_score(resume: Resume, job_description: str) -> int:
    """
    Calculate experience match score based on:
    - Years of experience
    - Relevant job titles
    - Action verbs and achievements
    """
    if not resume.experience:
        return 40
    
    score = 50  # Base score
    
    # 1. Calculate years of experience
    years_experience = len(resume.experience)
    
    # Extract required years from job description
    years_patterns = [
        r'(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?',
        r'minimum\s+(\d+)\s+years?'
    ]
    
    required_years = None
    for pattern in years_patterns:
        match = re.search(pattern, job_description.lower())
        if match:
            required_years = int(match.group(1))
            break
    
    if required_years:
        if years_experience >= required_years:
            score += 20
        elif years_experience >= required_years * 0.7:
            score += 10
    else:
        # No specific requirement, reward experience
        score += min(years_experience * 5, 20)
    
    # 2. Check for relevant job titles
    job_title_keywords = extract_technical_skills(job_description)
    resume_titles = " ".join([exp.title.lower() if exp.title else "" 
                             for exp in resume.experience])
    
    title_matches = sum(1 for keyword in job_title_keywords 
                       if keyword in resume_titles)
    score += min(title_matches * 3, 15)
    
    # 3. Check for quantified achievements (numbers in bullets)
    quantified_bullets = 0
    for exp in resume.experience:
        for bullet in exp.bullets:
            if re.search(r'\d+', bullet):  # Contains numbers
                quantified_bullets += 1
    
    if quantified_bullets > 0:
        score += min(quantified_bullets * 2, 15)
    
    return min(score, 100)


def calculate_education_score(resume: Resume, job_description: str) -> int:
    """
    Calculate education match score based on:
    - Degree level (Bachelor's, Master's, PhD)
    - Field of study relevance
    - Institution prestige (optional)
    """
    if not resume.education:
        # Check if education is required
        job_lower = job_description.lower()
        if any(word in job_lower for word in ['degree required', 'bachelor required', 'must have degree']):
            return 30  # Low score if required but missing
        return 70  # Neutral if not explicitly required
    
    score = 60  # Base score
    job_lower = job_description.lower()
    
    # Extract degree levels from resume
    has_bachelors = any('bachelor' in edu.degree.lower() if edu.degree else False 
                       for edu in resume.education)
    has_masters = any('master' in edu.degree.lower() if edu.degree else False 
                     for edu in resume.education)
    has_phd = any('phd' in edu.degree.lower() or 'doctorate' in edu.degree.lower() 
                 if edu.degree else False for edu in resume.education)
    
    # Match against job requirements
    if 'phd' in job_lower or 'doctorate' in job_lower:
        if has_phd:
            score = 100
        elif has_masters:
            score = 75
        elif has_bachelors:
            score = 60
    elif 'master' in job_lower or "master's" in job_lower:
        if has_masters or has_phd:
            score = 100
        elif has_bachelors:
            score = 80
    elif 'bachelor' in job_lower or "bachelor's" in job_lower or 'degree' in job_lower:
        if has_bachelors or has_masters or has_phd:
            score = 100
    else:
        # No specific requirement, but having education is good
        if has_phd:
            score = 95
        elif has_masters:
            score = 90
        elif has_bachelors:
            score = 85
    
    # Bonus for relevant field of study
    tech_fields = ['computer', 'software', 'engineering', 'science', 'technology', 
                   'information', 'data', 'mathematics', 'physics']
    
    for edu in resume.education:
        if edu.degree:
            degree_lower = edu.degree.lower()
            if any(field in degree_lower for field in tech_fields):
                score = min(score + 10, 100)
                break
    
    return score


def generate_recommendations(matches: List[Match], gaps: List[Gap], score: int) -> List[str]:
    """Generate recommendations based on analysis."""
    recommendations = []
    
    if score < 70:
        recommendations.append("Your resume needs significant improvements to match this job")
    elif score < 85:
        recommendations.append("Your resume is a good match, but there's room for improvement")
    else:
        recommendations.append("Your resume is an excellent match for this position!")
    
    # Recommendations based on gaps
    critical_gaps = [g for g in gaps if g.importance == "critical"]
    if critical_gaps:
        recommendations.append(
            f"Add these critical skills: {', '.join([g.keyword for g in critical_gaps[:3]])}"
        )
    
    if len(gaps) > 5:
        recommendations.append("Consider adding more relevant keywords from the job description")
    
    # General recommendations
    recommendations.extend([
        "Quantify your achievements with numbers and metrics",
        "Use action verbs to start each bullet point",
        "Tailor your resume to match the job description keywords",
        "Keep your resume format simple and ATS-friendly"
    ])
    
    return recommendations[:5]  # Return top 5 recommendations


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Resuna ATS Engine",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/analyze", response_model=AnalysisResult, dependencies=[Depends(verify_internal_api_key)])
async def analyze_resume(request: AnalysisRequest):
    """
    Analyze resume against job description using advanced NLP.
    
    This endpoint performs:
    - spaCy NER for entity extraction
    - TF-IDF for keyword importance
    - Semantic similarity analysis
    - Detailed scoring with recommendations
    """
    try:
        logger.info("🔍 Analyzing resume request")
        
        # 1. Extract text from resume and job
        resume_text = extract_resume_text(request.resume)
        job_text = preprocess_text(request.job_description)
        
        logger.info(f"📄 Resume text length: {len(resume_text)} chars")
        logger.info(f"📋 Job description length: {len(job_text)} chars")
        
        # 2. Extract technical skills using spaCy
        resume_skills = extract_resume_skills(request.resume)
        job_skills = extract_technical_skills(job_text)
        
        logger.info(f"💼 Resume skills: {len(resume_skills)} found")
        logger.info(f"🎯 Job skills: {len(job_skills)} found")
        
        # 3. Extract keywords using TF-IDF
        tfidf_keywords = extract_keywords_tfidf([job_text, resume_text], top_n=15)
        logger.info(f"🔑 TF-IDF keywords: {len(tfidf_keywords)} extracted")
        
        # Add high-scoring TF-IDF keywords to job skills
        for keyword, score in tfidf_keywords:
            if score > 0.1:  # Threshold for relevance
                job_skills.add(keyword.lower())
        
        # 4. Analyze keyword matches and gaps
        matches, gaps = analyze_keyword_match(resume_skills, job_skills, job_text)
        
        logger.info(f"✅ Matches: {len(matches)}")
        logger.info(f"❌ Gaps: {len(gaps)}")
        
        # 5. Calculate semantic similarity
        semantic_similarity = calculate_semantic_similarity(resume_text, job_text)
        logger.info(f"🧠 Semantic similarity: {semantic_similarity:.2f}")
        
        # 6. Calculate individual scores
        
        # Keyword match score (based on matches vs total job skills)
        total_job_skills = len(job_skills)
        matched_skills = len(matches)
        keyword_score = int((matched_skills / max(total_job_skills, 1)) * 100) if total_job_skills > 0 else 50
        
        # Skills match score (weighted by frequency and importance)
        critical_gaps = [g for g in gaps if g.importance == "critical"]
        important_gaps = [g for g in gaps if g.importance == "important"]
        
        skills_score = keyword_score
        if critical_gaps:
            skills_score -= len(critical_gaps) * 10  # Penalize critical gaps heavily
        if important_gaps:
            skills_score -= len(important_gaps) * 5   # Moderate penalty
        skills_score = max(0, min(100, skills_score))
        
        # Add semantic similarity bonus
        semantic_bonus = int(semantic_similarity * 20)  # Up to 20 points bonus
        skills_score = min(100, skills_score + semantic_bonus)
        
        # Experience and education scores
        experience_score = calculate_experience_score(request.resume, job_text)
        education_score = calculate_education_score(request.resume, job_text)
        
        logger.info(f"📊 Scores - Keyword: {keyword_score}, Skills: {skills_score}, "
                   f"Experience: {experience_score}, Education: {education_score}")
        
        # 7. Calculate overall score (weighted average)
        overall_score = int(
            keyword_score * 0.35 +
            skills_score * 0.35 +
            experience_score * 0.20 +
            education_score * 0.10
        )
        
        # 8. Generate recommendations
        recommendations = generate_recommendations(matches, gaps, overall_score)
        
        # Add semantic similarity insight
        if semantic_similarity < 0.5:
            recommendations.insert(0, 
                "Your resume language doesn't closely match the job description. "
                "Try using similar terminology and phrasing.")
        
        result = AnalysisResult(
            score=overall_score,
            scoreBreakdown=ScoreBreakdown(
                keywordMatch=keyword_score,
                skillsMatch=skills_score,
                experienceMatch=experience_score,
                educationMatch=education_score
            ),
            matches=matches,
            gaps=gaps,
            recommendations=recommendations
        )
        
        logger.info(f"✨ Analysis complete. Overall score: {overall_score}/100")
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
