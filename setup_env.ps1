# Configuration script for TextToSpeech Playground environment variables for Windows PowerShell

# First check if env.template exists and use it as a basis
$templateExists = Test-Path -Path "./env.template"
$envExists = Test-Path -Path "./.env"

if ($templateExists) {
    if (-not $envExists) {
        # Copy the template to .env if it doesn't exist
        Copy-Item -Path "./env.template" -Destination "./.env"
        Write-Host "Created .env file from template." -ForegroundColor Green
    }
} else {
    Write-Host "env.template file not found. Creating basic .env file." -ForegroundColor Yellow
    # Create a minimal .env file
    @"
# TextToSpeech Playground Environment
MODEL_DIR=./models/tts
AUDIO_OUTPUT_DIR=./audio-output
"@ | Out-File -FilePath "./.env" -Encoding utf8
}

Write-Host "Setting up environment variables for TextToSpeech Playground..." -ForegroundColor Cyan

# Check if token is provided as argument
if ($args[0]) {
    $HF_TOKEN = $args[0]
    
    # Update the .env file with the token
    $envContent = Get-Content -Path "./.env" -Raw
    if ($envContent -match "HUGGINGFACE_TOKEN=.*") {
        $envContent = $envContent -replace "HUGGINGFACE_TOKEN=.*", "HUGGINGFACE_TOKEN=$HF_TOKEN"
    } else {
        $envContent += "`nHUGGINGFACE_TOKEN=$HF_TOKEN`n"
    }
    $envContent | Out-File -FilePath "./.env" -Encoding utf8
    
    # Also set for current session
    [Environment]::SetEnvironmentVariable("HUGGINGFACE_TOKEN", $HF_TOKEN, "Process")
    Write-Host "Hugging Face token set successfully!" -ForegroundColor Green
} else {
    # Prompt for token if not provided
    Write-Host "Enter your Hugging Face token (or leave blank to skip):" -ForegroundColor Green
    $HF_TOKEN = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($HF_TOKEN)
    $HF_TOKEN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    if ($HF_TOKEN) {
        # Update the .env file with the token
        $envContent = Get-Content -Path "./.env" -Raw
        if ($envContent -match "HUGGINGFACE_TOKEN=.*") {
            $envContent = $envContent -replace "HUGGINGFACE_TOKEN=.*", "HUGGINGFACE_TOKEN=$HF_TOKEN"
        } else {
            $envContent += "`nHUGGINGFACE_TOKEN=$HF_TOKEN`n"
        }
        $envContent | Out-File -FilePath "./.env" -Encoding utf8
        
        # Also set for current session
        [Environment]::SetEnvironmentVariable("HUGGINGFACE_TOKEN", $HF_TOKEN, "Process")
        Write-Host "Hugging Face token set successfully!" -ForegroundColor Green
    } else {
        Write-Host "No Hugging Face token provided. The application will use fallback models." -ForegroundColor Yellow
    }
}

# Load all variables from .env into current session
Write-Host "Loading environment variables from .env file..." -ForegroundColor Cyan
Get-Content -Path "./.env" | ForEach-Object {
    if (-not [string]::IsNullOrWhiteSpace($_) -and -not $_.StartsWith("#")) {
        $name, $value = $_ -split '=', 2
        if (-not [string]::IsNullOrWhiteSpace($name) -and -not [string]::IsNullOrWhiteSpace($value)) {
            [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
            Write-Host "Set $($name.Trim())=$($value.Trim())" -ForegroundColor DarkGray
        }
    }
}

# Create directories based on config
$modelDir = [Environment]::GetEnvironmentVariable("MODEL_DIR", "Process")
$audioDir = [Environment]::GetEnvironmentVariable("AUDIO_OUTPUT_DIR", "Process")

if (-not [string]::IsNullOrWhiteSpace($modelDir)) {
    if (-not (Test-Path -Path $modelDir)) {
        New-Item -ItemType Directory -Path $modelDir -Force | Out-Null
        Write-Host "Created models directory at $modelDir" -ForegroundColor Green
    }
}

if (-not [string]::IsNullOrWhiteSpace($audioDir)) {
    if (-not (Test-Path -Path $audioDir)) {
        New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
        Write-Host "Created audio output directory at $audioDir" -ForegroundColor Green
    }
}

Write-Host "Environment setup complete!" -ForegroundColor Green
Write-Host "Note: These settings are only for the current PowerShell session." -ForegroundColor Yellow
Write-Host ""
Write-Host "To make these settings permanent, you can:"
Write-Host "1. Edit the .env file (recommended)" -ForegroundColor Cyan
Write-Host "2. Add them to your PowerShell profile:" -ForegroundColor Cyan
Write-Host "[Environment]::SetEnvironmentVariable('HUGGINGFACE_TOKEN', 'your_token_here', 'User')" -ForegroundColor DarkGray 