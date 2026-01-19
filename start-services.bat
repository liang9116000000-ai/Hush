@echo off
echo ========================================
echo 启动服务
echo ========================================
echo.

echo [1/2] 启动主服务器 (端口 3000)...
start "主服务器" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul

echo [2/2] 启动 PaddleOCR 服务 (端口 5000)...
start "PaddleOCR服务" cmd /k "cd paddle-ocr-service && python server.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ 所有服务已启动！
echo ========================================
echo.
echo 📝 主服务器: http://localhost:3000
echo 🔍 OCR 服务: http://localhost:5000
echo.
echo 💡 配置步骤:
echo   1. 打开 http://localhost:3000
echo   2. 点击左下角设置
echo   3. OCR API Base URL: http://localhost:5000/api/ocr
echo   4. 选择 DeepSeek OCR 模型
echo   5. 上传图片测试
echo.
echo ⚠️  注意:
echo   - 首次运行会下载 PaddleOCR 模型（约 10MB）
echo   - 需要安装 Python 和依赖: pip install -r paddle-ocr-service/requirements.txt
echo.
echo ========================================
pause
