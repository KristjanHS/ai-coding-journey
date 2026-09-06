@echo off
REM ---------------------------------------------------------------------------
REM Step 4: export ONE page by its page ID (the surgical option - use this for
REM the three starred inc2 pages if a whole section is more than you want).
REM
REM   4-export-page.bat {GUID}{...}{...}
REM   4-export-page.bat <PageID> dry
REM
REM Page IDs come from 2-list.bat (they only appear because of --verbose).
REM A page ID contains braces, so ALWAYS pass it inside double quotes.
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion
set "HERE=%~dp0"
set "OUTDIR=%HERE%out"

set "EXE="
for /r "%HERE%tool" %%F in (OneNoteMarkdownExporter.exe) do if exist "%%F" set "EXE=%%F"
if not defined EXE (echo ERROR: exporter not installed. Run 1-setup.bat first. & pause & exit /b 1)

set "PAGEID=%~1"
if not defined PAGEID (
  echo Page ID from pages.txt, e.g. {1234ABCD-...}{1}{E19...}
  set /p "PAGEID=Page ID: "
)
if not defined PAGEID (echo ERROR: no page ID given. & pause & exit /b 1)

set "DRY="
if /i "%~2"=="dry" set "DRY=--dry-run"

echo.
echo Exporting page: !PAGEID!
echo Output:         %OUTDIR%
if defined DRY echo MODE:           DRY RUN - no files will be written
echo.
"!EXE!" --page "!PAGEID!" --output "%OUTDIR%" --overwrite --verbose !DRY!
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo Done. Next: run scripts/onenote/import-from-windows.sh inside WSL.
) else (
  echo Exporter exited with code %RC%.
)
pause
exit /b %RC%
