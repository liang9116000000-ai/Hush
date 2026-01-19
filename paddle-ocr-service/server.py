#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PaddleOCR 高精度 OCR 服务
安装: pip install paddlepaddle paddleocr flask flask-cors
运行: python server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import os
import tempfile
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 初始化 PaddleOCR
# use_angle_cls=True: 支持旋转文字识别
# lang='ch': 中文和英文
# use_gpu=False: 使用 CPU（如果有 GPU 可改为 True）
logger.info('正在初始化 PaddleOCR...')
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='ch',
    use_gpu=False,
    show_log=False,
    det_db_thresh=0.3,      # 检测阈值
    det_db_box_thresh=0.5,  # 文本框阈值
    rec_batch_num=6         # 识别批次大小
)
logger.info('PaddleOCR 初始化完成!')

@app.route('/api/ocr', methods=['POST'])
def ocr_recognize():
    """OCR 识别接口"""
    if 'file' not in request.files:
        return jsonify({'error': {'message': '未上传文件'}}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': {'message': '文件名为空'}}), 400
    
    # 保存临时文件
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        temp_path = tmp.name
    
    try:
        logger.info(f'开始识别文件: {file.filename}')
        
        # 执行 OCR 识别
        result = ocr.ocr(temp_path, cls=True)
        
        if not result or not result[0]:
            logger.warning('未识别到文字')
            return jsonify({'error': {'message': '未识别到文字'}}), 400
        
        # 提取文字和置信度
        text_lines = []
        total_confidence = 0
        count = 0
        
        for line in result[0]:
            if line and len(line) >= 2:
                text = line[1][0]      # 识别的文字
                confidence = line[1][1]  # 置信度
                
                # 只保留置信度 > 0.5 的结果
                if confidence > 0.5:
                    text_lines.append(text)
                    total_confidence += confidence
                    count += 1
        
        if not text_lines:
            logger.warning('识别结果置信度过低')
            return jsonify({'error': {'message': '识别结果置信度过低'}}), 400
        
        text = '\n'.join(text_lines)
        avg_confidence = total_confidence / count if count > 0 else 0
        
        logger.info(f'识别成功! 文字长度: {len(text)}, 平均置信度: {avg_confidence:.2%}')
        
        return jsonify({
            'text': text,
            'confidence': avg_confidence,
            'lines': len(text_lines)
        })
    
    except Exception as e:
        logger.error(f'OCR 识别失败: {str(e)}', exc_info=True)
        return jsonify({
            'error': {'message': f'识别失败: {str(e)}'}
        }), 500
    
    finally:
        # 删除临时文件
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            logger.error(f'删除临时文件失败: {str(e)}')

@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'PaddleOCR',
        'version': '2.7.0',
        'lang': 'ch+en'
    })

@app.route('/', methods=['GET'])
def index():
    """首页"""
    return '''
    <html>
    <head><title>PaddleOCR 服务</title></head>
    <body>
        <h1>🚀 PaddleOCR 服务运行中</h1>
        <p>📝 OCR API: <code>POST /api/ocr</code></p>
        <p>💚 健康检查: <code>GET /api/health</code></p>
        <h2>使用方法:</h2>
        <ol>
            <li>在应用设置中配置 OCR API Base URL: <code>http://localhost:5000/api/ocr</code></li>
            <li>选择 "DeepSeek OCR" 模型</li>
            <li>上传图片进行识别</li>
        </ol>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print('=' * 60)
    print('🚀 PaddleOCR 服务启动中...')
    print('=' * 60)
    print(f'📝 OCR API: http://localhost:5000/api/ocr')
    print(f'💚 健康检查: http://localhost:5000/api/health')
    print(f'🌐 Web 界面: http://localhost:5000')
    print('=' * 60)
    print('💡 提示:')
    print('  - 首次运行会自动下载模型文件（约 10MB）')
    print('  - 支持中英文混合识别')
    print('  - 支持旋转、倾斜文字')
    print('  - 识别精度 95%+')
    print('=' * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
