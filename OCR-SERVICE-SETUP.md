# OCR 服务配置指南

DeepSeek OCR 功能需要一个外部 OCR 服务来识别图片和 PDF 中的文字。

## 流程说明

```
图片/PDF → OCR 服务（识别文字）→ DeepSeek（纠错/结构化）→ 最终结果
```

## 选项 1：使用 PaddleOCR（推荐）

### 1. 安装 PaddleOCR

```bash
pip install paddlepaddle paddleocr
```

### 2. 创建 OCR 服务

创建文件 `ocr-server/server.py`：

```python
from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import os

app = Flask(__name__)
ocr = PaddleOCR(use_angle_cls=True, lang='ch')  # 中文识别

@app.route('/api/ocr', methods=['POST'])
def ocr_recognize():
    if 'file' not in request.files:
        return jsonify({'error': {'message': '未上传文件'}}), 400
    
    file = request.files['file']
    
    # 保存临时文件
    temp_path = f'/tmp/{file.filename}'
    file.save(temp_path)
    
    try:
        # OCR 识别
        result = ocr.ocr(temp_path, cls=True)
        
        # 提取文字
        text_lines = []
        for line in result[0]:
            text_lines.append(line[1][0])
        
        text = '\n'.join(text_lines)
        
        return jsonify({'text': text})
    
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 500
    
    finally:
        # 删除临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 3. 运行服务

```bash
python server.py
```

### 4. 配置应用

在应用设置中配置：
- **OCR API Base URL**: `http://localhost:5000/api/ocr`

## 选项 2：使用云 OCR 服务

### 阿里云 OCR

```python
from flask import Flask, request, jsonify
from aliyunsdkcore.client import AcsClient
from aliyunsdkocr.request.v20191230 import RecognizeGeneralRequest
import base64

app = Flask(__name__)

# 配置阿里云
ACCESS_KEY_ID = 'your_access_key_id'
ACCESS_KEY_SECRET = 'your_access_key_secret'
client = AcsClient(ACCESS_KEY_ID, ACCESS_KEY_SECRET, 'cn-shanghai')

@app.route('/api/ocr', methods=['POST'])
def ocr_recognize():
    if 'file' not in request.files:
        return jsonify({'error': {'message': '未上传文件'}}), 400
    
    file = request.files['file']
    file_content = file.read()
    base64_data = base64.b64encode(file_content).decode('utf-8')
    
    try:
        request_obj = RecognizeGeneralRequest.RecognizeGeneralRequest()
        request_obj.set_ImageURL(f'data:image/jpeg;base64,{base64_data}')
        
        response = client.do_action_with_exception(request_obj)
        result = json.loads(response)
        
        # 提取文字
        text = '\n'.join([item['text'] for item in result['Data']['content']])
        
        return jsonify({'text': text})
    
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 选项 3：使用 Tesseract OCR

```python
from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import os

app = Flask(__name__)

@app.route('/api/ocr', methods=['POST'])
def ocr_recognize():
    if 'file' not in request.files:
        return jsonify({'error': {'message': '未上传文件'}}), 400
    
    file = request.files['file']
    temp_path = f'/tmp/{file.filename}'
    file.save(temp_path)
    
    try:
        # 使用 Tesseract 识别
        image = Image.open(temp_path)
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        
        return jsonify({'text': text})
    
    except Exception as e:
        return jsonify({'error': {'message': str(e)}}), 500
    
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## API 接口规范

OCR 服务必须符合以下规范：

### 请求
- **方法**: POST
- **Content-Type**: multipart/form-data
- **参数**: `file` (文件字段)

### 响应

成功：
```json
{
  "text": "识别出的文字内容"
}
```

失败：
```json
{
  "error": {
    "message": "错误信息"
  }
}
```

## 部署到生产环境

### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM python:3.9

WORKDIR /app

RUN pip install flask paddlepaddle paddleocr

COPY server.py .

EXPOSE 5000

CMD ["python", "server.py"]
```

构建和运行：

```bash
docker build -t ocr-service .
docker run -p 5000:5000 ocr-service
```

### 使用 Vercel/Netlify

如果使用 Serverless，可以将 OCR 服务部署为独立的 Function。

## 配置应用

1. 打开应用设置（左下角）
2. 找到"DeepSeek OCR 配置"
3. 填入 OCR API Base URL（例如：`http://localhost:5000/api/ocr`）
4. 保存设置

## 使用

1. 选择"DeepSeek OCR"模型
2. 点击附件按钮上传图片或 PDF
3. 等待识别和处理完成
