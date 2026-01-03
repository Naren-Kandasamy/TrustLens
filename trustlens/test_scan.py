import requests

url = "http://localhost:8000/api/scan"
# Create a dummy image (black square)
import cv2
import numpy as np
img = np.zeros((500, 500, 3), dtype=np.uint8)
# Draw a white square to simulate a face (face detection might not work on simple shapes, but let's try or just mock the file)
# Actually, I'll use one of the temp uploads if available, or just send a real image if I can find one.
# Since I don't have a guaranteed face image, I'll just check if the endpoint responds.

# Create a simple image
cv2.imwrite("test_scan.jpg", img)

with open("test_scan.jpg", "rb") as f:
    files = {"file": f}
    try:
        response = requests.post(url, files=files)
        print(response.status_code)
        print(response.json())
    except Exception as e:
        print(e)
