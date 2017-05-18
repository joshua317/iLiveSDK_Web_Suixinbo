@echo off

::清理注册表
echo 开始清理注册表...
reg import "cleanReg.reg"

::查询IE设置的ActiveXCache目录
for /f "delims=" %%i in ('reg.exe query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings" /V "ActiveXCache"') do set ActiveXCacheDir="%%i"
set ActiveXCacheDir=%ActiveXCacheDir:~31,-1%

::清理inf文件
echo 开始清理inf文件...
if exist "%ActiveXCacheDir%\iLiveSDK.inf" del "%ActiveXCacheDir%\iLiveSDK.inf" /f /s /q
if exist "%ActiveXCacheDir%\iLiveSDK_activex.inf" del "%ActiveXCacheDir%\iLiveSDK_activex.inf" /f /s /q
if exist "%ActiveXCacheDir%\WXVoiceSDK.inf" del "%ActiveXCacheDir%\WXVoiceSDK.inf" /f /s /q
if exist "%ActiveXCacheDir%\WXVoiceSDK_activex.inf" del "%ActiveXCacheDir%\WXVoiceSDK_activex.inf" /f /s /q

::清理iLiveSDK的dll文件
echo 开始清理iLiveSDK文件...
if exist %APPDATA%\Tencent\iLiveSDK_activex rmdir %APPDATA%\Tencent\iLiveSDK_activex /s /q
if exist %APPDATA%\Tencent\iLiveSDK rmdir %APPDATA%\Tencent\iLiveSDK /s /q

::清理WXVoiceSDK的dll文件
echo 开始清理WXVoiceSDK文件...
if exist %APPDATA%\Tencent\WXVoiceSDK_activex rmdir %APPDATA%\Tencent\WXVoiceSDK_activex /s /q
if exist %APPDATA%\Tencent\WXVoiceSDK rmdir %APPDATA%\Tencent\WXVoiceSDK /s /q

pause
::echo 执行完成，按任意键退出...
::pause>nul

