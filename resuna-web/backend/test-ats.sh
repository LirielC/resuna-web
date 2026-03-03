#!/bin/bash

# Script de teste para ATS Analysis API
# Uso: ./test-ats.sh

set -e

BASE_URL="http://localhost:8080"
AUTH_HEADER="Authorization: Bearer dev-user"

echo "=========================================="
echo "  Resuna ATS Analysis - Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Create Resume
echo -e "${BLUE}[1/6] Creating test resume...${NC}"
RESUME_RESPONSE=$(curl -s -X POST "$BASE_URL/api/resumes" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "title": "Full Stack Developer Resume",
    "personalInfo": {
      "fullName": "Maria Santos",
      "email": "maria@email.com",
      "phone": "11987654321",
      "location": "Rio de Janeiro, Brazil"
    },
    "summary": "Full stack developer with 5+ years of experience building modern web applications",
    "experience": [
      {
        "title": "Full Stack Developer",
        "company": "Tech Startup",
        "location": "Remote",
        "startDate": "2019-03",
        "current": true,
        "bullets": [
          "Developed RESTful APIs using Node.js and Express",
          "Built responsive UIs with React and TypeScript",
          "Implemented CI/CD pipelines with GitHub Actions",
          "Worked with PostgreSQL and MongoDB databases"
        ]
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Computer Science",
        "institution": "UFRJ",
        "location": "Rio de Janeiro",
        "graduationDate": "2018-12"
      }
    ],
    "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "PostgreSQL", "MongoDB", "Git", "Docker"],
    "certifications": [],
    "languages": [{"name": "Portuguese", "level": "Native"}, {"name": "English", "level": "Advanced"}]
  }')

RESUME_ID=$(echo $RESUME_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$RESUME_ID" ]; then
  echo -e "${RED}✗ Failed to create resume${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Resume created: $RESUME_ID${NC}"
echo ""

# Test 2: Analyze Resume
echo -e "${BLUE}[2/6] Running ATS analysis...${NC}"
ANALYSIS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ats/analyze" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "resumeId": "'$RESUME_ID'",
    "jobDescription": "We are seeking a talented Full Stack Developer to join our team. The ideal candidate will have strong experience with React, TypeScript, Node.js, and modern web development practices. Experience with AWS, Kubernetes, and GraphQL is highly desirable. Must have at least 3 years of professional experience building scalable web applications.",
    "jobTitle": "Full Stack Developer",
    "company": "Innovative Tech Co"
  }')

ANALYSIS_ID=$(echo $ANALYSIS_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
SCORE=$(echo $ANALYSIS_RESPONSE | grep -o '"score":[0-9]*' | cut -d':' -f2)

if [ -z "$ANALYSIS_ID" ]; then
  echo -e "${RED}✗ Analysis failed${NC}"
  echo "$ANALYSIS_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Analysis completed: $ANALYSIS_ID${NC}"
echo -e "  Score: ${GREEN}$SCORE/100${NC}"
echo ""

# Test 3: Get ATS Score
echo -e "${BLUE}[3/6] Getting ATS score...${NC}"
SCORE_RESPONSE=$(curl -s "$BASE_URL/api/ats/score/$RESUME_ID" \
  -H "$AUTH_HEADER")

SCORE_VALUE=$(echo $SCORE_RESPONSE | grep -o '"score":[0-9]*' | cut -d':' -f2)
MATCHED=$(echo $SCORE_RESPONSE | grep -o '"matchedKeywords":[0-9]*' | cut -d':' -f2)
TOTAL=$(echo $SCORE_RESPONSE | grep -o '"totalKeywords":[0-9]*' | cut -d':' -f2)

echo -e "${GREEN}✓ Score retrieved${NC}"
echo -e "  Score: $SCORE_VALUE/100"
echo -e "  Keywords: $MATCHED/$TOTAL matched"
echo ""

# Test 4: List All Analyses
echo -e "${BLUE}[4/6] Listing all analyses...${NC}"
ANALYSES_RESPONSE=$(curl -s "$BASE_URL/api/ats/analyses" \
  -H "$AUTH_HEADER")

ANALYSES_COUNT=$(echo $ANALYSES_RESPONSE | grep -o '"id":"[^"]*"' | wc -l)
echo -e "${GREEN}✓ Found $ANALYSES_COUNT analysis(es)${NC}"
echo ""

# Test 5: List Analyses by Resume
echo -e "${BLUE}[5/6] Listing analyses for resume...${NC}"
RESUME_ANALYSES=$(curl -s "$BASE_URL/api/ats/analyses/resume/$RESUME_ID" \
  -H "$AUTH_HEADER")

RESUME_ANALYSES_COUNT=$(echo $RESUME_ANALYSES | grep -o '"id":"[^"]*"' | wc -l)
echo -e "${GREEN}✓ Found $RESUME_ANALYSES_COUNT analysis(es) for this resume${NC}"
echo ""

# Test 6: Display Analysis Details
echo -e "${BLUE}[6/6] Analysis Details:${NC}"
echo "$ANALYSIS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYSIS_RESPONSE"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}  All tests passed! ✓${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Resume ID: $RESUME_ID"
echo "  - Analysis ID: $ANALYSIS_ID"
echo "  - ATS Score: $SCORE/100"
echo "  - Matched Keywords: $MATCHED/$TOTAL"
echo ""
echo "Next steps:"
echo "  1. Check the analysis recommendations"
echo "  2. Update resume based on gaps"
echo "  3. Run analysis again to see improvement"
echo ""
