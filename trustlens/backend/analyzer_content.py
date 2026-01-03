import cv2
import numpy as np
import logging
import re
import shutil
from collections import defaultdict
import pytesseract   

# Fix Tesseract Path for macOS/Linux/Windows
tesseract_exe = shutil.which("tesseract")
if tesseract_exe:
    pytesseract.pytesseract.tesseract_cmd = tesseract_exe

try:
    from pyzbar.pyzbar import decode as decode_barcode
except ImportError:
    decode_barcode = None

# MediaPipe Import Logic with Fallback
MP_AVAILABLE = False
try:
    import mediapipe as mp
    if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_detection'):
        mp_face_detection = mp.solutions.face_detection
        MP_AVAILABLE = True
    else:
        # try explicit import if available
        try:
            from mediapipe.python.solutions import face_detection as mp_face_detection
            MP_AVAILABLE = True
        except ImportError:
            pass
except ImportError:
    pass

class AnalyzerContent:
    def __init__(self):
        self.use_mp = MP_AVAILABLE
        if self.use_mp:
            try:
                self.face_detector = mp_face_detection.FaceDetection(
                    model_selection=1, 
                    min_detection_confidence=0.7
                )
            except Exception as e:
                logging.warning(f"MediaPipe initialization failed: {e}. Falling back to OpenCV.")
                self.use_mp = False
        
        if not self.use_mp:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )

    def analyze_faces(self, image_rgb: np.ndarray):
        h, w, _ = image_rgb.shape
        detections = []
        
        if self.use_mp:
            try:
                results = self.face_detector.process(image_rgb)
                if results.detections:
                    for detection in results.detections:
                        bbox = detection.location_data.relative_bounding_box
                        x = max(0, int(bbox.xmin * w))
                        y = max(0, int(bbox.ymin * h))
                        width = int(bbox.width * w)
                        height = int(bbox.height * h)
                        detections.append({
                            "type": "FACE",
                            "box": [x, y, width, height],
                            "confidence": detection.score[0] if detection.score else 0.0
                        })
                return detections, False # is_child logic placeholder
            except Exception as e:
                logging.error(f"MediaPipe processing error: {e}. Fallback to OpenCV.")
                # Fallthrough to OpenCV
        
        # OpenCV Fallback
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        # TIGHTER PARAMETERS: scaleFactor 1.2, minNeighbors 8 to ignore hands/noise
        faces = self.face_cascade.detectMultiScale(gray, 1.2, 8)
        for (x, y, w_box, h_box) in faces:
             detections.append({
                "type": "FACE",
                "box": [int(x), int(y), int(w_box), int(h_box)],
                "confidence": 0.8 
            })
            
        # SORTING FIX: Ensure deterministic order (Left-to-Right, Top-to-Bottom)
        detections.sort(key=lambda d: (d['box'][1], d['box'][0]))
            
        return detections, False

    def scan_barcodes(self, image_rgb: np.ndarray):
        detections = []
        
        def add_unique_detection(x, y, w, h, data):
            # Avoid duplicates by checking overlap
            is_new = True
            for existing in detections:
                ex, ey, ew, eh = existing['box']
                if abs(x - ex) < 20 and abs(y - ey) < 20:
                    is_new = False
                    break
            if is_new:
                detections.append({
                    "type": "BARCODE",
                    "box": [int(x), int(y), int(w), int(h)],
                    "data": str(data)
                })

        # Method 1: Pyzbar (if available)
        if decode_barcode:
            def detect_pyzbar(img_data):
                results = decode_barcode(img_data)
                for barcode in results:
                    (x, y, w, h) = barcode.rect
                    add_unique_detection(x, y, w, h, barcode.data.decode("utf-8"))

            gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
            detect_pyzbar(gray)
            
            # Morphological Closing fallback for pyzbar
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            closed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
            detect_pyzbar(closed)

        # Method 2: OpenCV BarcodeDetector (Modern OpenCV)
        try:
            # Note: BarcodeDetector might require opencv-contrib-python or specific builds
            if hasattr(cv2, 'barcode_BarcodeDetector'):
                bd = cv2.barcode_BarcodeDetector()
                ok, decoded_info, decoded_type, corners = bd.detectAndDecode(image_rgb)
                if ok:
                    for info, corners_set in zip(decoded_info, corners):
                        if info:
                            x = np.min(corners_set[:, 0])
                            y = np.min(corners_set[:, 1])
                            w = np.max(corners_set[:, 0]) - x
                            h = np.max(corners_set[:, 1]) - y
                            add_unique_detection(x, y, w, h, info)
        except Exception as e:
            logging.debug(f"OpenCV BarcodeDetector failed: {e}")

        # Method 3: OpenCV QRCodeDetector
        try:
            qrd = cv2.QRCodeDetector()
            ok, decoded_info, points, _ = qrd.detectAndDecodeMulti(image_rgb)
            if ok:
                for info, corners_set in zip(decoded_info, points):
                    if info:
                        x = np.min(corners_set[:, 0])
                        y = np.min(corners_set[:, 1])
                        w = np.max(corners_set[:, 0]) - x
                        h = np.max(corners_set[:, 1]) - y
                        add_unique_detection(x, y, w, h, info)
        except Exception as e:
            logging.debug(f"OpenCV QRCodeDetector failed: {e}")

        return detections

    def scan_text_pii(self, image_rgb: np.ndarray):
        detections = []
        if not pytesseract:
            return detections
            
        # Regex patterns for sensitive data
        cc_pattern = re.compile(r'\b(?:\d[ -]*?){13,19}\b')
        phone_pattern = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
        ssn_pattern = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

        try:
            data = pytesseract.image_to_data(image_rgb, output_type=pytesseract.Output.DICT)
            lines = defaultdict(list)
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30 and data['text'][i].strip():
                    key = (data['block_num'][i], data['par_num'][i], data['line_num'][i])
                    lines[key].append(i)

            for key, word_indices in lines.items():
                line_text = " ".join([data['text'][i] for i in word_indices]).strip()
                
                if cc_pattern.search(line_text) or phone_pattern.search(line_text) or \
                   ssn_pattern.search(line_text) or email_pattern.search(line_text):
                    
                    min_x = min(data['left'][i] for i in word_indices)
                    min_y = min(data['top'][i] for i in word_indices)
                    max_x = max(data['left'][i] + data['width'][i] for i in word_indices)
                    max_y = max(data['top'][i] + data['height'][i] for i in word_indices)
                    
                    detections.append({
                        "type": "PII",
                        "box": [min_x, min_y, max_x - min_x, max_y - min_y],
                        "text": "SENSITIVE"
                    })

        except Exception as e:
            logging.error(f"OCR Error: {e}")
            
        return detections
