@echo off
echo ========================================
echo 安装 PaddleOCR 依赖
echo ========================================
echo.

echo 检查 Python...
python --version
if errorlevel 1 (
    echo.
    echo ❌ 错误: 未找到 Python
    echo.
    echo 请先安装 Python 3.8+ 
    echo 下载地址: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo.
echo 安装依赖包...
pip install -r paddle-ocr-service/requirements.txt

echo.
echo ========================================
echo ✅ 安装完成！
echo ========================================
echo.
echo 下一步: 双击 start-services.bat 启动服务
echo.
pause
