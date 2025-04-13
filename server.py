from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")


def clean_text(text):
    """Clean DeepSeek output for typing tests."""
    return text.strip().replace("\n", " ").replace("```", "")

@app.route("/generate-text", methods=["POST"])
def generate_text():
    try:
        data = request.json
        mode = data.get("mode", "sentence")
        include_punctuation = data.get("punctuation", False)
        include_numbers = data.get("numbers", False)
        length = data.get("length", "short")

        # prompt based on mode and settings
        if mode == "quote":
            prompt = f"Generate a {length} quote suitable for a typing test."
        else:
            prompt = f"Generate a {length} sentence for a typing test."
        if include_punctuation:
            prompt += " Include punctuation."
        if include_numbers:
            prompt += " Include numbers."

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "deepseek",
                "prompt": prompt,
                "stream": False
            }
        )
        response.raise_for_status()
        text = response.json().get("response", "")
        cleaned_text = clean_text(text)
        return jsonify({"text": cleaned_text})
    except Exception as e:
        return jsonify({
            "text": "The quick brown fox jumps over the lazy dog 123."
        }), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)