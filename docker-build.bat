@echo off
REM eMediCare Docker Build Script for Windows
REM Builds Docker images for all services

setlocal enabledelayedexpansion

set REGISTRY=%1
set IMAGE_PREFIX=%2
set TAG=%3

if "!REGISTRY!"=="" set REGISTRY=docker.io
if "!IMAGE_PREFIX!"=="" set IMAGE_PREFIX=emedicare
if "!TAG!"=="" set TAG=latest

echo ==================================
echo Building eMediCare Docker Images
echo ==================================
echo Registry: !REGISTRY!
echo Image Prefix: !IMAGE_PREFIX!
echo Tag: !TAG!
echo.

set SERVICES[0]=api-gateway
set SERVICES[1]=services\auth-service
set SERVICES[2]=services\appointment-service
set SERVICES[3]=services\payment-service
set SERVICES[4]=services\notification-service
set SERVICES[5]=services\ai-service
set SERVICES[6]=services\doctor-service
set SERVICES[7]=services\patient-service
set SERVICES[8]=services\telemedicine-service
set SERVICES[9]=services\admin-service
set SERVICES[10]=frontend

setlocal enabledelayedexpansion
for /l %%i in (0,1,10) do (
  set SERVICE=!SERVICES[%%i]!
  for %%F in (!SERVICE!) do set SERVICE_NAME=%%~nxF
  set IMAGE_NAME=!REGISTRY!/!IMAGE_PREFIX!/!SERVICE_NAME!:!TAG!
  
  echo Building !SERVICE_NAME!...
  
  if "!SERVICE!"=="frontend" (
    docker build -t "!IMAGE_NAME!" -f docker\frontend.Dockerfile .\frontend
  ) else (
    docker build -t "!IMAGE_NAME!" -f docker\services.Dockerfile .\!SERVICE!
  )
  
  echo Built: !IMAGE_NAME!
  echo.
)

endlocal

echo.
echo ==================================
echo All images built successfully!
echo ==================================
echo.

set /p PUSH="Do you want to push images to registry? (y/n): "
if /i "!PUSH!"=="y" (
  echo Pushing images to !REGISTRY!...
  for /l %%i in (0,1,10) do (
    set SERVICE=!SERVICES[%%i]!
    for %%F in (!SERVICE!) do set SERVICE_NAME=%%~nxF
    set IMAGE_NAME=!REGISTRY!/!IMAGE_PREFIX!/!SERVICE_NAME!:!TAG!
    
    echo Pushing !IMAGE_NAME!...
    docker push "!IMAGE_NAME!"
    echo Pushed: !IMAGE_NAME!
  )
  echo.
  echo All images pushed successfully!
)

pause
