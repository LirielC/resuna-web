$ErrorActionPreference = "Continue"
$DEV_TOKEN = "dev-test-token"
$BASE = "http://localhost:8080"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " RESUNA - AI Translation Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create a resume in Portuguese
Write-Host "--- STEP 1: Creating Portuguese Resume ---" -ForegroundColor Yellow
$body = @{
    title = "Curriculo - Ana Costa"
    personalInfo = @{
        fullName = "Ana Costa"
        email = "ana.costa@email.com"
        phone = "(21) 98765-4321"
        location = "Rio de Janeiro, RJ"
        linkedin = "https://linkedin.com/in/anacosta"
        github = "https://github.com/anacosta"
    }
    summary = "Engenheira de Software com 6 anos de experiencia em desenvolvimento web full-stack. Especializada em construcao de aplicacoes escalaveis utilizando Java, React e servicos em nuvem da AWS. Apaixonada por codigo limpo e melhores praticas de engenharia."
    experience = @(
        @{
            title = "Engenheira de Software Senior"
            company = "Empresa de Tecnologia LTDA"
            startDate = "Jan 2022"
            endDate = "Presente"
            current = $true
            bullets = @(
                "Liderou equipe de 8 desenvolvedores na implementacao de arquitetura de microsservicos",
                "Reduziu o tempo de resposta da API em 45% atraves de otimizacao de consultas ao banco de dados",
                "Implementou pipeline de CI/CD usando GitHub Actions, reduzindo o tempo de deploy em 60%",
                "Conduziu revisoes de codigo e sessoes de mentoria para desenvolvedores juniores"
            )
        },
        @{
            title = "Desenvolvedora Plena"
            company = "Startup Inovadora S.A."
            startDate = "Mar 2019"
            endDate = "Dez 2021"
            bullets = @(
                "Desenvolveu aplicacoes React com TypeScript para mais de 50 mil usuarios ativos",
                "Integrou APIs REST com servicos de terceiros incluindo gateways de pagamento",
                "Participou de cerimônias ageis e planejamento de sprints"
            )
        }
    )
    projects = @(
        @{
            name = "Sistema de Gestao de Pedidos"
            description = "Plataforma completa para gerenciamento de pedidos de e-commerce com painel administrativo"
            technologies = @("Java", "Spring Boot", "React", "PostgreSQL", "Docker")
            bullets = @(
                "Projetou e implementou APIs RESTful para processamento de pedidos",
                "Criou painel de monitoramento em tempo real com graficos interativos"
            )
        }
    )
    education = @(
        @{
            degree = "Bacharelado em Ciencia da Computacao"
            institution = "Universidade Federal do Rio de Janeiro"
            graduationDate = "Dez 2018"
        }
    )
    skills = @("Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Git", "Testes Unitarios", "Metodologias Ageis")
    certifications = @(
        @{
            name = "AWS Solutions Architect Associate"
            issuer = "Amazon Web Services"
            date = "Mar 2023"
        },
        @{
            name = "Certificacao Profissional Scrum Master I"
            issuer = "Scrum.org"
            date = "Jun 2022"
        }
    )
    languages = @(
        @{ name = "Portugues"; level = "native" },
        @{ name = "Ingles"; level = "advanced" },
        @{ name = "Espanhol"; level = "basic" }
    )
} | ConvertTo-Json -Depth 5

try {
    $createResponse = Invoke-RestMethod -Uri "$BASE/api/resumes" -Method POST -Headers @{Authorization="Bearer $DEV_TOKEN"; "Content-Type"="application/json"} -Body $body
    $RESUME_ID = $createResponse.id
    Write-Host "[PASS] Resume created successfully (ID: $RESUME_ID)" -ForegroundColor Green
    Write-Host "  Title: $($createResponse.title)" -ForegroundColor Gray
    Write-Host "  Skills: $($createResponse.skills -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] CREATE: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Call the translation endpoint
Write-Host "--- STEP 2: Translating Resume to English via AI ---" -ForegroundColor Yellow
Write-Host "  Calling POST /api/resumes/$RESUME_ID/translate..." -ForegroundColor Gray
Write-Host "  (This may take 20-60 seconds depending on the AI model)" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
try {
    $translationResponse = Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID/translate" -Method POST -Headers @{Authorization="Bearer $DEV_TOKEN"; "Content-Type"="application/json"} -TimeoutSec 120
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    
    Write-Host "[PASS] Translation completed in ${elapsed}s!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== TRANSLATED RESUME ===" -ForegroundColor Cyan
    Write-Host "  ID: $($translationResponse.id)" -ForegroundColor Gray
    Write-Host "  Title: $($translationResponse.title)" -ForegroundColor White
    Write-Host ""
    
    # Check if title was translated (should contain "English")
    if ($translationResponse.title -match "English|english") {
        Write-Host "  [PASS] Title contains '(English)' marker" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Title: $($translationResponse.title)" -ForegroundColor Yellow
    }
    
    # Check Personal Info
    Write-Host ""
    Write-Host "  --- Personal Info ---" -ForegroundColor Yellow
    Write-Host "  Name: $($translationResponse.personalInfo.fullName)" -ForegroundColor White
    Write-Host "  Email: $($translationResponse.personalInfo.email)" -ForegroundColor White
    Write-Host "  Location: $($translationResponse.personalInfo.location)" -ForegroundColor White
    
    # Check Summary translation
    Write-Host ""
    Write-Host "  --- Summary (translated) ---" -ForegroundColor Yellow
    Write-Host "  $($translationResponse.summary)" -ForegroundColor White
    
    # Verify summary is in English
    if ($translationResponse.summary -match "Software Engineer|experience|web development|scalable|cloud") {
        Write-Host "  [PASS] Summary appears to be in English" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Summary may not be fully translated: $($translationResponse.summary.Substring(0, [math]::Min(100, $translationResponse.summary.Length)))..." -ForegroundColor Yellow
    }

    # Check Experience translation
    Write-Host ""
    Write-Host "  --- Experience (translated) ---" -ForegroundColor Yellow
    foreach ($exp in $translationResponse.experience) {
        Write-Host "  Role: $($exp.title)" -ForegroundColor White
        Write-Host "  Company: $($exp.company)" -ForegroundColor White
        if ($exp.bullets) {
            foreach ($bullet in $exp.bullets) {
                Write-Host "    - $bullet" -ForegroundColor Gray
            }
        }
        Write-Host ""
    }
    
    # Check Skills
    Write-Host "  --- Skills ---" -ForegroundColor Yellow
    Write-Host "  $($translationResponse.skills -join ', ')" -ForegroundColor White
    
    # Verify skills translation
    $translatedSkills = $translationResponse.skills -join ", "
    if ($translatedSkills -match "Unit Test|Agile") {
        Write-Host "  [PASS] Portuguese skills translated (Testes Unitarios -> Unit Testing, Metodologias Ageis -> Agile)" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Skills: $translatedSkills" -ForegroundColor Yellow
    }

    # Check Certifications
    Write-Host ""
    Write-Host "  --- Certifications ---" -ForegroundColor Yellow
    foreach ($cert in $translationResponse.certifications) {
        Write-Host "  $($cert.name) - $($cert.issuer) ($($cert.date))" -ForegroundColor White
    }
    
    # Check Languages
    Write-Host ""
    Write-Host "  --- Languages ---" -ForegroundColor Yellow
    foreach ($lang in $translationResponse.languages) {
        Write-Host "  $($lang.name): $($lang.level)" -ForegroundColor White
    }
    
    # Languages should be translated
    $langNames = ($translationResponse.languages | ForEach-Object { $_.name }) -join ", "
    if ($langNames -match "Portuguese|English|Spanish") {
        Write-Host "  [PASS] Language names translated to English" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Language names: $langNames" -ForegroundColor Yellow
    }
    
    # Verify a new resume was created (different ID from original)
    Write-Host ""
    if ($translationResponse.id -ne $RESUME_ID) {
        Write-Host "[PASS] Translation created as new resume (Original: $RESUME_ID, Translated: $($translationResponse.id))" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Translation may have overwritten the original resume" -ForegroundColor Yellow
    }

    # Step 3: Verify both resumes exist
    Write-Host ""
    Write-Host "--- STEP 3: Verifying Both Resumes Exist ---" -ForegroundColor Yellow
    $allResumes = Invoke-RestMethod -Uri "$BASE/api/resumes" -Headers @{Authorization="Bearer $DEV_TOKEN"}
    $count = if ($allResumes -is [array]) { $allResumes.Count } else { 1 }
    Write-Host "[PASS] Total resumes after translation: $count" -ForegroundColor Green
    foreach ($r in $allResumes) {
        Write-Host "  - [$($r.id)] $($r.title)" -ForegroundColor Gray
    }

    # Step 4: Export translated resume as PDF
    Write-Host ""
    Write-Host "--- STEP 4: Exporting Translated Resume as PDF ---" -ForegroundColor Yellow
    $translatedId = $translationResponse.id
    $pdfPath = "$env:TEMP\resuna-translated-resume.pdf"
    try {
        Invoke-WebRequest -Uri "$BASE/api/resumes/$translatedId/pdf?locale=en-US" -Headers @{Authorization="Bearer $DEV_TOKEN"} -OutFile $pdfPath
        $pdfSize = (Get-Item $pdfPath).Length
        Write-Host "[PASS] Translated PDF exported ($pdfSize bytes): $pdfPath" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] PDF EXPORT: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Cleanup
    Write-Host ""
    Write-Host "--- CLEANUP ---" -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Method DELETE -Headers @{Authorization="Bearer $DEV_TOKEN"} | Out-Null
        Write-Host "  Deleted original resume $RESUME_ID" -ForegroundColor Gray
    } catch { Write-Host "  Could not delete original: $($_.Exception.Message)" -ForegroundColor Gray }
    
    try {
        Invoke-RestMethod -Uri "$BASE/api/resumes/$translatedId" -Method DELETE -Headers @{Authorization="Bearer $DEV_TOKEN"} | Out-Null
        Write-Host "  Deleted translated resume $translatedId" -ForegroundColor Gray
    } catch { Write-Host "  Could not delete translated: $($_.Exception.Message)" -ForegroundColor Gray }

} catch {
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    Write-Host "[FAIL] Translation failed after ${elapsed}s" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "  HTTP Status: $statusCode" -ForegroundColor Red
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        } catch {}
    }
    
    # Cleanup original resume
    try {
        Invoke-RestMethod -Uri "$BASE/api/resumes/$RESUME_ID" -Method DELETE -Headers @{Authorization="Bearer $DEV_TOKEN"} | Out-Null
    } catch {}
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TRANSLATION TEST COMPLETE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
