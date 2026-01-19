#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PaddleOCR 服务器 - 高精度中文 OCR
安装: pip install paddlepaddle paddleocr flask flask-cors
运行: python ocr_server_paddle.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import os
import tempfile

app = Flask(__name__)
CORS(app)

# 初始化 PaddleOCR（中英文混合识别）
ocr = PaddleOCR(
    use_angle_cls=True,  # 启用方向分类
    lang='ch',           # 中文
    use_gpu=False,       # CPU 模式（如果有 GPU 可改为 True）
    show_log=False       # 不显示日志
)

@app.route('/api/ocr', methods=['POST'])
def ocr_recognize():
    """OCR 识别接口"""
    if 'file' not in request.files:
        return jsonify({'error': {'message': '未上传文件'}}), 400
    
    file = request.files['file']
    
    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        file.save(tmp.name)
        temp_path = tmp.name
    
    try:
        # OCR 识别
        result = ocr.ocr(temp_path, cls=True)
        
        if not result or not result[0]:
            return jsonify({'error': {'message': '未识别到文字'}}), 400
        
        # 提取文字（按行）
        text_lines = []
        for line in result[0]:
            text = line[1][0]  # 获取识别的文字
            confidence = line[1][1]  # 获取置信度
            
            # 只保留置信度 > 0.5 的结果
            if confidence > 0.5:
                text_lines.append(text)
        
        text = '\n'.join(text_lines)
        
        return jsonify({'text': text})
    
    except Exception as e:
        return jsonify({'error': {'message': f'识别失败: {str(e)}'}}), 500
    
    finally:
        # 删除临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'service': 'PaddleOCR'})

if __name__ == '__main__':
    print('🚀 PaddleOCR 服务启动中...')
    print('📝 OCR API: http://localhost:5000/api/ocr')
    print('💡 提示: 首次运行会下载模型文件（约 10MB）')
    app.run(host='0.0.0.0', port=5000, debug=False)
