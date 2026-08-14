from flask import Flask, Response, request
from student.model import predict_risk

app = Flask(__name__)
BLOCK_THRESHOLD = 0.60


def extract_features():
    uri = request.headers.get("X-Original-URI", "/")
    path, _, query = uri.partition("?")
    special = "%<>'\"()[]{};"
    return {
        "method": request.headers.get("X-Original-Method", "GET"),
        "path": path,
        "query_length": len(query),
        "body_length": int(request.headers.get("X-Original-Body-Length") or 0),
        "has_encoded_chars": int("%" in uri),
        "special_char_count": sum(uri.count(char) for char in special),
        "rate_1m": 1,
        "source_reputation": 0.50,
    }


@app.post("/check")
def check():
    features = extract_features()
    risk = float(predict_risk(features))
    risk = max(0.0, min(1.0, risk))
    if risk >= BLOCK_THRESHOLD:
        return Response(status=403, headers={"X-WAF-Risk": f"{risk:.2f}"})
    return Response(status=204, headers={"X-WAF-Risk": f"{risk:.2f}"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
