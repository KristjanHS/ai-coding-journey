@echo off
REM ---------------------------------------------------------------------------
REM Step 1 of the OneNote -> markdown route (inc2 Stage 0).
REM Downloads the segunak/one-note-to-markdown release and extracts it into
REM a "tool" folder next to this .bat. Run once. Re-run to re-install.
REM
REM Bumping the version: change PINNED_VERSION below, then re-run.
REM Releases: https://github.com/segunak/one-note-to-markdown/releases
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion

set "PINNED_VERSION=v1.0.6"
set "REPO=segunak/one-note-to-markdown"

set "HERE=%~dp0"
set "TOOL=%HERE%tool"
set "ZIPNAME=OneNoteMarkdownExporter-%PINNED_VERSION%.zip"
set "URL=https://github.com/%REPO%/releases/download/%PINNED_VERSION%/%ZIPNAME%"
set "ZIPTMP=%TEMP%\%ZIPNAME%"

echo.
echo === OneNote Markdown Exporter %PINNED_VERSION% ===
echo Target folder: %TOOL%
echo.

where curl.exe >nul 2>&1 || (echo ERROR: curl.exe not found. Needs Windows 10 1803 or later. & goto :fail)
where tar.exe  >nul 2>&1 || (echo ERROR: tar.exe not found. Needs Windows 10 1803 or later. & goto :fail)

echo [1/3] Downloading %ZIPNAME% ...
curl.exe -fL --progress-bar -o "%ZIPTMP%" "%URL%"
if errorlevel 1 (echo ERROR: download failed. Check the version pin and your network. & goto :fail)

echo [2/3] Extracting ...
if exist "%TOOL%" rmdir /s /q "%TOOL%"
mkdir "%TOOL%"
tar.exe -xf "%ZIPTMP%" -C "%TOOL%"
if errorlevel 1 (echo ERROR: extract failed. & goto :fail)
del "%ZIPTMP%" >nul 2>&1

echo [3/3] Locating the executable ...
set "EXE="
for /r "%TOOL%" %%F in (OneNoteMarkdownExporter.exe) do if exist "%%F" set "EXE=%%F"
if not defined EXE (echo ERROR: OneNoteMarkdownExporter.exe not found under %TOOL%. & goto :fail)

echo.
echo OK. Executable: !EXE!
echo.
echo Next: run 2-list.bat to see your notebooks, sections and page IDs.
echo Windows SmartScreen may flag the unsigned exe on first run:
echo   "More info" -^> "Run anyway".
echo.
pause
exit /b 0

:fail
echo.
echo Setup did not complete.
pause
exit /b 1
