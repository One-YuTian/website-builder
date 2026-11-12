@echo off
setlocal DisableDelayedExpansion
set "BUILDER_NODE="
if defined CODEX_MCP_NODE_PATH if exist "%CODEX_MCP_NODE_PATH%" set "BUILDER_NODE=%CODEX_MCP_NODE_PATH%"
if defined BUILDER_NODE goto run
if defined CODEX_BROWSER_USE_NODE_PATH if exist "%CODEX_BROWSER_USE_NODE_PATH%" set "BUILDER_NODE=%CODEX_BROWSER_USE_NODE_PATH%"
if defined BUILDER_NODE goto run
if defined CODEX_ELECTRON_RESOURCES_PATH if exist "%CODEX_ELECTRON_RESOURCES_PATH%\cua_node\bin\node.exe" set "BUILDER_NODE=%CODEX_ELECTRON_RESOURCES_PATH%\cua_node\bin\node.exe"
if defined BUILDER_NODE goto run
if defined CODEX_CLI_PATH for %%I in ("%CODEX_CLI_PATH%") do if exist "%%~dpIcua_node\bin\node.exe" set "BUILDER_NODE=%%~dpIcua_node\bin\node.exe"
if defined BUILDER_NODE goto run
if defined USERPROFILE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "BUILDER_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if defined BUILDER_NODE goto run
if defined LOCALAPPDATA for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do if exist "%%~fD\bin\node.exe" set "BUILDER_NODE=%%~fD\bin\node.exe"
if defined BUILDER_NODE goto run
echo Website Builder: Codex managed Node runtime unavailable. Update/restart Codex or set CODEX_MCP_NODE_PATH. 1>&2
exit /b 127
:run
if "%~1"=="" (
  "%BUILDER_NODE%" "%~dp0..\dist\server\index.js"
) else (
  "%BUILDER_NODE%" %*
)
exit /b %errorlevel%
