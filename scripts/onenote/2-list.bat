@echo off
REM ---------------------------------------------------------------------------
REM Step 2: list every notebook / section / page, WITH page IDs (--verbose).
REM Writes the listing to pages.txt next to this .bat and opens it in Notepad,
REM so you can copy a "Notebook/Section" path or a page ID for steps 3 and 4.
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion
set "HERE=%~dp0"
set "OUTFILE=%HERE%pages.txt"

set "EXE="
for /r "%HERE%tool" %%F in (OneNoteMarkdownExporter.exe) do if exist "%%F" set "EXE=%%F"
if not defined EXE (echo ERROR: exporter not installed. Run 1-setup.bat first. & pause & exit /b 1)

echo Listing notebooks, sections and page IDs ...
echo (OneNote will be launched automatically if it is not already running.)
echo.
"!EXE!" --list --verbose > "%OUTFILE%" 2>&1
set "RC=%ERRORLEVEL%"

type "%OUTFILE%"
echo.
if not "%RC%"=="0" (
  echo ---------------------------------------------------------------
  echo The exporter exited with code %RC%.
  echo A COM interop error here means the wrong OneNote is installed:
  echo this tool needs the Microsoft 365 DESKTOP OneNote, not the
  echo "OneNote for Windows 10" Store app. Check File ^> Account.
  echo Fall back to the docx + pandoc route if so.
  echo ---------------------------------------------------------------
)
echo Saved to: %OUTFILE%
start "" notepad "%OUTFILE%"
pause
exit /b %RC%
