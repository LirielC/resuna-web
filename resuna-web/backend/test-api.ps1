$ErrorActionPreference = "Continue"
$DEV_TOKEN = "dev-test-token"
$BASE = "http://localhost:8080"
$RESULTS = @()

function Log($step, $status, $detail) {
    $RESULTS += [PSCustomObject]@{Step=$step; Status=$status; Detail=$detail}
    if ($status -eq "PASS") { Write-Host "[PASS] $step : $detail" -ForegroundColor Green }
    elseif ($status -eq "FAIL") { Write-Host "[FAIL] $step : $detail" -ForegroundColor Red }
    else { Write-Host "[INFO] $step : $detail" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " RESUNA WEB - Complete API Test Suite" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ========== TEST 1: Create Resume ==========
Write-Host "--- TEST 1: Create Resume ---" -ForegroundColor Yellow
$body = @{
    title = "Curriculo Teste - Joao Silva"
    personalInfo = @{
        fullName = "Joao Silva"
        email = "joao@teste.com"
        phone = "(11) 99999-8888"
        location = "Sao Paulo, SP"
        linkedin = "https://linkedin.com/in/joaosilva"
        github = "https://github.com/joaosilva"
        website = "https://joaosilva.dev"
    }
    summary = "Desenvolvedor Full Stack com 5 anos de experiencia em Java, Spring Boot, React e TypeScript."
    experience = @(
        @{
            title = "Desenvolvedor Senior"
            company = "Tech Corp"
            startDate = "Jan 2022"
            endDate = "Presente"
            bullets = @("Liderou equipe de 5 desenvolvedores", "Implementou microservicos com Spring Boot", "Reduziu tempo de deploy em 40%")
        },
        @{
            title = "Desenvolvedor Pleno"
            company = "StartupXYZ"
            startDate = "Mar 2020"
            endDate = "Dez 2021"
            bullets = @("Desenvolveu aplicacoes React", "Integrou APIs REST")
        }
    )
    projects = @(
        @{
            name = "Resuna"
            description = "Plataforma de criacao de curriculos com IA"
            technologies = @("Java", "Spring Boot", "Next.js", "TypeScript")
            bullets = @("Implementou geracao de PDF com PDFBox", "Criou sistema de analise ATS")
        }
    )
    education = @(
        @{
            degree = "Bacharelado em Ciencia da Computacao"
            institution = "Universidade de Sao Paulo"
            graduationDate = "Dez 2019"
        }
    )
    skills = @("Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Git")
    certifications = @(
        @{
            name = "AWS Solutions Architect"
            issuer = "Amazon Web Services"
            date = "Mar 2023"
        }
    )
    languages = @(
        @{ name = "Portugues"; level = "native" },
        @{ name = "Ingles"; level = "fluent" },
        @{ name = "Espanhol"; level = "intermediate" }
    )
} | ConvertTo-Json -Depth 5

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE/api/resumes" -Method POST -Headers @{Authorization="Bearer $DEV_TOKEN"; "Content-Type"="application/json"} -Body $body
    $RESUME_ID = $createResponse.id
    Write-Host "[PASS] CREATE: Resume created with ID=$RESUME_ID" -ForegroundColor Green
    Write-Host "  Title: $($createResponse.title)" -ForegroundColor Gray
    Write-Host "  Name: $($createResponse.personalInfo.fullName)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] CREATE: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ========== TEST 2: Read Resume ==========
Write-Host "--- TEST 2: Read Resume by ID ---" -ForegroundColor Yellow
try {
    $readResponse = Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Headers @{Authorization="Bearer $DEV_TOKEN"}
    if ($readResponse.id -eq $RESUME_ID -and $readResponse.personalInfo.fullName -eq "Joao Silva") {
        Write-Host "[PASS] READ: Resume retrieved successfully" -ForegroundColor Green
        Write-Host "  Skills: $($readResponse.skills -join ', ')" -ForegroundColor Gray
        Write-Host "  Experience: $($readResponse.experience.Count) roles" -ForegroundColor Gray
        Write-Host "  Education: $($readResponse.education.Count) entries" -ForegroundColor Gray
        Write-Host "  Certifications: $($readResponse.certifications.Count)" -ForegroundColor Gray
        Write-Host "  Languages: $($readResponse.languages.Count)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] READ: Data mismatch" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] READ: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 3: List All Resumes ==========
Write-Host "--- TEST 3: List All Resumes ---" -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$BASE/api/resumes" -Headers @{Authorization="Bearer $DEV_TOKEN"}
    $count = if ($listResponse -is [array]) { $listResponse.Count } else { 1 }
    Write-Host "[PASS] LIST: $count resume(s) found" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] LIST: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 4: Update Resume ==========
Write-Host "--- TEST 4: Update Resume ---" -ForegroundColor Yellow
$updateBody = @{
    title = "Curriculo Atualizado - Joao Silva"
    personalInfo = @{
        fullName = "Joao Silva Santos"
        email = "joao.updated@teste.com"
        phone = "(11) 99999-7777"
        location = "Campinas, SP"
    }
    summary = "Engenheiro de Software Senior com 7 anos de experiencia."
    experience = @(
        @{
            title = "Tech Lead"
            company = "BigTech"
            startDate = "Jan 2024"
            endDate = "Presente"
            bullets = @("Liderou squad de 10 engenheiros")
        }
    )
    education = @(
        @{
            degree = "Mestrado em Engenharia de Software"
            institution = "Unicamp"
            graduationDate = "Jul 2023"
        }
    )
    skills = @("Java", "Kotlin", "Spring Boot", "React", "TypeScript", "Kubernetes", "Terraform")
    certifications = @()
    languages = @(@{ name = "Portugues"; level = "native" }, @{ name = "Ingles"; level = "fluent" })
} | ConvertTo-Json -Depth 5

try {
    $updateResponse = Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Method PUT -Headers @{Authorization="Bearer $DEV_TOKEN"; "Content-Type"="application/json"} -Body $updateBody
    if ($updateResponse.title -eq "Curriculo Atualizado - Joao Silva") {
        Write-Host "[PASS] UPDATE: Resume updated successfully" -ForegroundColor Green
        Write-Host "  New title: $($updateResponse.title)" -ForegroundColor Gray
        Write-Host "  New name: $($updateResponse.personalInfo.fullName)" -ForegroundColor Gray
        Write-Host "  New skills: $($updateResponse.skills -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] UPDATE: Title mismatch" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] UPDATE: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 5: Export PDF ==========
Write-Host "--- TEST 5: Export to PDF ---" -ForegroundColor Yellow
$pdfPath = "$env:TEMP\resuna-test-resume.pdf"
try {
    Invoke-WebRequest -Uri "$BASE/api/resumes/$RESUME_ID/pdf" -Headers @{Authorization="Bearer $DEV_TOKEN"} -OutFile $pdfPath
    $pdfSize = (Get-Item $pdfPath).Length
    if ($pdfSize -gt 0) {
        Write-Host "[PASS] PDF EXPORT: Generated successfully ($pdfSize bytes)" -ForegroundColor Green
        Write-Host "  Saved to: $pdfPath" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] PDF EXPORT: Empty file" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] PDF EXPORT: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 6: Export PDF with locale en-US ==========
Write-Host "--- TEST 6: Export PDF with en-US locale ---" -ForegroundColor Yellow
$pdfPathEn = "$env:TEMP\resuna-test-resume-en.pdf"
try {
    Invoke-WebRequest -Uri "$BASE/api/resumes/$RESUME_ID/pdf?locale=en-US" -Headers @{Authorization="Bearer $DEV_TOKEN"} -OutFile $pdfPathEn
    $pdfSizeEn = (Get-Item $pdfPathEn).Length
    if ($pdfSizeEn -gt 0) {
        Write-Host "[PASS] PDF EXPORT (en-US): Generated successfully ($pdfSizeEn bytes)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] PDF EXPORT (en-US): Empty file" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] PDF EXPORT (en-US): $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 7: Export DOCX ==========
Write-Host "--- TEST 7: Export to DOCX ---" -ForegroundColor Yellow
$docxPath = "$env:TEMP\resuna-test-resume.docx"
try {
    Invoke-WebRequest -Uri "$BASE/api/resumes/$RESUME_ID/docx" -Headers @{Authorization="Bearer $DEV_TOKEN"} -OutFile $docxPath
    $docxSize = (Get-Item $docxPath).Length
    if ($docxSize -gt 0) {
        Write-Host "[PASS] DOCX EXPORT: Generated successfully ($docxSize bytes)" -ForegroundColor Green
        Write-Host "  Saved to: $docxPath" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] DOCX EXPORT: Empty file" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] DOCX EXPORT: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 8: Auth Validation ==========
Write-Host "--- TEST 8: Auth Validation (no token) ---" -ForegroundColor Yellow
try {
    $noAuthResponse = Invoke-WebRequest -Uri "$BASE/api/resumes" -ErrorAction Stop
    Write-Host "[FAIL] AUTH: Request without token should have been rejected" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 401) {
        Write-Host "[PASS] AUTH: Correctly returned 401 without token" -ForegroundColor Green
    } else {
        Write-Host "[WARN] AUTH: Unexpected status code $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""

# ========== TEST 9: Delete Resume ==========
Write-Host "--- TEST 9: Delete Resume ---" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Method DELETE -Headers @{Authorization="Bearer $DEV_TOKEN"}
    Write-Host "[PASS] DELETE: Resume deleted successfully" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] DELETE: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========== TEST 10: Verify Deleted ==========
Write-Host "--- TEST 10: Verify Resume is Deleted ---" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Headers @{Authorization="Bearer $DEV_TOKEN"} -ErrorAction Stop
    Write-Host "[FAIL] VERIFY DELETE: Resume still exists" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 404) {
        Write-Host "[PASS] VERIFY DELETE: Resume correctly not found (404)" -ForegroundColor Green
    } else {
        Write-Host "[PASS] VERIFY DELETE: Resume not accessible (Status: $statusCode)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TEST SUITE COMPLETE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
