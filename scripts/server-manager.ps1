param()

$projectDir = "D:\prj\jusic"
$port = 3000

Add-Type -AssemblyName PresentationFramework

function Show-Info($msg) {
    [System.Windows.MessageBox]::Show(
        $msg, "주식 포트폴리오",
        [System.Windows.MessageBoxButton]::OK,
        [System.Windows.MessageBoxImage]::Information
    ) | Out-Null
}

function Show-Error($msg) {
    [System.Windows.MessageBox]::Show(
        $msg, "오류",
        [System.Windows.MessageBoxButton]::OK,
        [System.Windows.MessageBoxImage]::Error
    ) | Out-Null
}

function Test-ServerRunning {
    try {
        $req = [System.Net.WebRequest]::Create("http://localhost:$port")
        $req.Timeout = 2000
        $req.Method = "HEAD"
        $res = $req.GetResponse()
        $res.Close()
        return $true
    } catch {
        return $false
    }
}

function Stop-Server {
    $netstat = & netstat -ano 2>$null
    $line = $netstat | Where-Object { $_ -match "TCP\s+0\.0\.0\.0:$port\s+.*LISTENING" } | Select-Object -First 1
    if ($line -match '(\d+)\s*$') {
        $targetPid = $Matches[1]
        & taskkill /F /T /PID $targetPid 2>$null | Out-Null
        return $true
    }
    return $false
}

# ── 메인 ──────────────────────────────────────────────────

if (Test-ServerRunning) {
    $choice = [System.Windows.MessageBox]::Show(
        "서버가 실행 중입니다.`nhttp://localhost:$port`n`n[예] 브라우저 열기`n[아니오] 서버 종료",
        "주식 포트폴리오",
        [System.Windows.MessageBoxButton]::YesNo,
        [System.Windows.MessageBoxImage]::Question
    )

    if ($choice -eq 'Yes') {
        Start-Process "http://localhost:$port"
    } else {
        if (Stop-Server) {
            Show-Info "서버를 종료했습니다."
        } else {
            Show-Error "서버 종료에 실패했습니다.`n작업 관리자에서 node.exe 프로세스를 직접 종료하세요."
        }
    }
    exit
}

# 서버 미실행 → 빌드 확인 후 시작
$nextDir = Join-Path $projectDir ".next"

if (-not (Test-Path $nextDir)) {
    $confirm = [System.Windows.MessageBox]::Show(
        "첫 실행입니다. 프로젝트 빌드가 필요합니다.`n(약 1~2분 소요)`n`n계속하시겠습니까?",
        "주식 포트폴리오",
        [System.Windows.MessageBoxButton]::YesNo,
        [System.Windows.MessageBoxImage]::Question
    )
    if ($confirm -ne 'Yes') { exit }

    $buildProc = Start-Process "cmd" -ArgumentList "/c cd /d `"$projectDir`" && npm run build" -Wait -PassThru
    if ($buildProc.ExitCode -ne 0) {
        Show-Error "빌드에 실패했습니다.`n터미널에서 'npm run build'를 실행해 오류를 확인하세요."
        exit 1
    }
}

# 서버 시작 (최소화 창으로 실행 — 창을 닫으면 서버도 종료됨)
Start-Process "cmd" -ArgumentList "/k title 주식포트폴리오-서버 && cd /d `"$projectDir`" && npm start" -WindowStyle Minimized

# 최대 30초 대기
$elapsed = 0
while ($elapsed -lt 60) {
    Start-Sleep -Milliseconds 500
    $elapsed++
    if (Test-ServerRunning) {
        Start-Sleep -Milliseconds 300
        Start-Process "http://localhost:$port"
        Show-Info "서버가 시작되었습니다!`nhttp://localhost:$port`n`n서버 종료는 이 프로그램을 다시 실행하세요."
        exit
    }
}

Show-Error "서버 시작에 실패했습니다. 잠시 후 다시 시도해주세요."
