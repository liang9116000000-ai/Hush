@echo off
echo ========================================
echo 安装 PaddleOCR 服务
echo ========================================
echo.

echo [1/3] 检查 Python...
python --version
if errorlevel 1 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] 安装依赖包...
pip install paddlepaddle paddleocr flask flask-cors

echo.
echo [3/3] 安装完成！
echo.
echo ========================================
echo 使用方法:
echo 1. 运行: python ocr_server_paddle.py
echo 2. 在应用设置中配置:
echo    OCR API Base URL: http://localhost:5000/api/ocr
echo ========================================
echo.
pause
