@echo off
REM ---------------------------------------------------------------------------
REM Step 5 (optional): export EVERY notebook. Cheap insurance while you are
REM already set up - the inc2 spec only needs three pages, but the other ten
REM chapters will want theirs eventually.
REM
REM   5-export-all.bat          full export
REM   5-export-all.bat dry      preview only
REM ---------------------------------------------------------------------------
setlocal EnableDelayedExpansion
set "HERE=%~dp0"
set "OUTDIR=%HERE%out"

set "EXE="
for /r "%HERE%tool" %%F in (OneNoteMarkdownExporter.exe) do if exist "%%F" set "EXE=%%F"
if not defined EXE (echo ERROR: exporter not installed. Run 1-setup.bat first. & pause & exit /b 1)

set "DRY="
if /i "%~1"=="dry" set "DRY=--dry-run"

echo.
echo Exporting ALL notebooks to %OUTDIR%
if defined DRY echo MODE: DRY RUN - no files will be written
echo This can take a while on a large notebook set.
echo.
"!EXE!" --all --output "%OUTDIR%" --overwrite --verbose !DRY!
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (
  echo Done. Next: run scripts/onenote/import-from-windows.sh inside WSL.
) else (
  echo Exporter exited with code %RC%.
)
pause
exit /b %RC%
