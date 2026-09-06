@echo off
REM ---------------------------------------------------------------------------
REM Step 3: export one whole section to markdown.
REM
REM   3-export-section.bat "Notebook/Section"
REM   3-export-section.bat "Notebook/Section" dry     (preview, writes nothing)
REM
REM With no argument it prompts. Output goes to the "out" folder next to this
REM .bat; images land in out\_assets. Re-runs overwrite (--overwrite) so the
REM folder never fills with numbered copies.
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion
set "HERE=%~dp0"
set "OUTDIR=%HERE%out"

set "EXE="
for /r "%HERE%tool" %%F in (OneNoteMarkdownExporter.exe) do if exist "%%F" set "EXE=%%F"
if not defined EXE (echo ERROR: exporter not installed. Run 1-setup.bat first. & pause & exit /b 1)

set "SECTION=%~1"
if not defined SECTION (
  echo Section path, exactly as 2-list.bat printed it, e.g.  My Notebook/Projects
  set /p "SECTION=Section: "
)
if not defined SECTION (echo ERROR: no section given. & pause & exit /b 1)

set "DRY="
if /i "%~2"=="dry" set "DRY=--dry-run"

echo.
echo Exporting section: !SECTION!
echo Output:           %OUTDIR%
if defined DRY echo MODE:             DRY RUN - no files will be written
echo.
"!EXE!" --section "!SECTION!" --output "%OUTDIR%" --overwrite --verbose !DRY!
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo Done. Next: run scripts/onenote/import-from-windows.sh inside WSL.
) else (
  echo Exporter exited with code %RC%.
)
pause
exit /b %RC%
