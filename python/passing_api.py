from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from io import BytesIO
import base64
import os

app = Flask(__name__)

# Ensure there's a folder for uploads
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    print(request)

    print(request)
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        file.save( file.filename)
        filename = secure_filename(file.filename)
        # filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # file.save(filepath)
        # Process the file as needed
        return jsonify({'message': 'File successfully uploaded', 'filename': filename}), 200

@app.route('/get-normal-map')
def get_normal_map(normal_map):
    img_io = BytesIO()
    normal_map.save(img_io, format="PNG")
    img_io.seek(0)
    img_data = base64.b64encode(img_io.getvalue()).decode('utf-8')
    return jsonify({'image': f'data:image/png;base64,{img_data}'})

if __name__ == '__main__':
    app.run(debug=True)
