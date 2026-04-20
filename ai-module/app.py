from flask import Flask, request, jsonify
from flask_cors import CORS
from detector import process_image

app = Flask(__name__)
CORS(app) # Allow cross-origin requests

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        # Simulate detection logic
        result = process_image(image_base64)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting AI Module Simulation on port 5001...")
    app.run(port=5001, debug=True)
