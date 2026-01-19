@echo off
echo ========================================
echo 启动所有服务
echo ========================================
echo.

echo [1/2] 启动主服务器 (端口 3000)...
start "主服务器" cmd /k "cd server && npm start"
timeout /t 2 /nobreak >nul

echo [2/2] 启动 OCR 服务 (端口 5000)...
start "OCR服务" cmd /k "cd ocr-service && npm start"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ 所有服务已启动！
echo ========================================
echo.
echo 📝 主服务器: http://localhost:3000
echo 🔍 OCR 服务: http://localhost:5000
echo.
echo 💡 提示:
echo   - 两个服务窗口会自动打开
echo   - 关闭窗口即可停止服务
echo   - 首次运行 OCR 会下载模型（约 10MB）
echo.
echo ========================================
pause
