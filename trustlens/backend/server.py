from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, cv2, io, uuid, asyncio, numpy as np, base64, hashlib, hmac, sys
from PIL import Image

# macOS fix for zbar library
lib_path = os.path.join(os.path.dirname(__file__), "lib")
if os.path.exists(lib_path):
    os.environ["DYLD_LIBRARY_PATH"] = lib_path + ":" + os.environ.get("DYLD_LIBRARY_PATH", "")
    os.environ["PATH"] = lib_path + ":" + os.environ.get("PATH", "")
    sys.path.append(lib_path)

# Core Guardian Engines
from analyzer_content import AnalyzerContent
from analyzer_forensics import AnalyzerForensics
from analyzer_metadata import AnalyzerMetadata
from risk_engine import RiskEngine
from protection_tools import ProtectionTools

app = FastAPI()

# SECURITY CONFIGURATION
# This MUST match the key in protection_tools.py
SECRET_KEY = "SUPER_SECRET_KEY" 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

content_analyzer = AnalyzerContent()
forensics_analyzer = AnalyzerForensics()
metadata_analyzer = AnalyzerMetadata()
risk_engine = RiskEngine()
protection_tools = ProtectionTools()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def auto_stabilize(image_path):
    """Caps resolution at 2000px to prevent system memory overflow."""
    img = cv2.imread(image_path)
    if img is None: return None
    h, w = img.shape[:2]
    if max(h, w) > 2000:
        scale = 2000 / max(h, w)
        img = cv2.resize(img, (0,0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        cv2.imwrite(image_path, img)
    return img

@app.post("/api/scan")
async def scan_image(file: UploadFile = File(...)):
    """Diagnostic scan with Base64 thumbnails and precise coordinate mapping."""
    try:
        session_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{session_id}.jpg")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        img_bgr = await auto_stabilize(file_path)
        if img_bgr is None: raise HTTPException(status_code=400, detail="Invalid image")
        
        h, w, _ = img_bgr.shape
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        # Parallelize heavy analysis
        raw_faces, is_child = await asyncio.to_thread(content_analyzer.analyze_faces, img_rgb)
        barcodes = await asyncio.to_thread(content_analyzer.scan_barcodes, img_rgb)
        pii_text = await asyncio.to_thread(content_analyzer.scan_text_pii, img_rgb)
        
        all_detections = []
        
        # Process Faces
        for i, f in enumerate(raw_faces):
            conf = f.get('confidence', 0.0)
            bx, by, bw, bh = f['box']
            
            y1, y2 = max(0, int(by)), min(h, int(by + bh))
            x1, x2 = max(0, int(bx)), min(w, int(bx + bw))
            
            crop = img_bgr[y1:y2, x1:x2]
            crop_b64 = ""
            if crop.size > 0: 
                _, buffer = cv2.imencode('.jpg', crop)
                crop_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

            box_pct = [(bx / w) * 100, (by / h) * 100, (bw / w) * 100, (bh / h) * 100]

            all_detections.append({
                **f,
                'box': box_pct,
                'id': f"FACE_{i+1:02d}",
                'confidence': 0.0 if (np.isnan(conf) or conf is None) else float(conf),
                'thumbnail': crop_b64
            })

        # Process Barcodes
        for i, b in enumerate(barcodes):
            bx, by, bw, bh = b['box']
            box_pct = [(bx / w) * 100, (by / h) * 100, (bw / w) * 100, (bh / h) * 100]
            
            # Thumbnail for barcode
            y1, y2 = max(0, int(by)), min(h, int(by + bh))
            x1, x2 = max(0, int(bx)), min(w, int(bx + bw))
            crop = img_bgr[y1:y2, x1:x2]
            crop_b64 = ""
            if crop.size > 0:
                _, buffer = cv2.imencode('.jpg', crop)
                crop_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

            all_detections.append({
                **b,
                'box': box_pct,
                'id': f"BARCODE_{i+1:02d}",
                'thumbnail': crop_b64
            })

        # Process PII
        for i, p in enumerate(pii_text):
            bx, by, bw, bh = p['box']
            box_pct = [(bx / w) * 100, (by / h) * 100, (bw / w) * 100, (bh / h) * 100]
            all_detections.append({
                **p,
                'box': box_pct,
                'id': f"PII_{i+1:02d}",
                'thumbnail': "" # PII often too small/sensitive for thumbs
            })
            
        meta = metadata_analyzer.get_metadata_risk(file_path)
        ai_flag, _ = await asyncio.to_thread(forensics_analyzer.detect_deepfake_artifacts, img_rgb)
        score, _, report = risk_engine.calculate_trust_score({'ela_manipulated': ai_flag}, all_detections, is_child, pii_text, barcodes, meta)

        return {"session_id": session_id, "score": score, "detections": all_detections, "meta": meta, "report": report}
    except Exception as e:
        print(f"SCAN_ERROR: {e}")
        raise HTTPException(status_code=500, detail="Diagnostic Scan Interrupted")

@app.post("/api/protect")
async def protect_image(
    action: str = Form(...), 
    indices: str = Form(""), 
    session_id: str = Form(...),
    brush_data: str = Form("")
):
    """SEQUENTIAL ACTION ENGINE: Uses secure cryptographic signing tied to pixels."""
    try:
        target_file = os.path.join(UPLOAD_DIR, f"{session_id}.jpg")
        img_rgb = cv2.cvtColor(cv2.imread(target_file), cv2.COLOR_BGR2RGB)
        
        all_faces, _ = content_analyzer.analyze_faces(img_rgb)
        barcodes = content_analyzer.scan_barcodes(img_rgb)
        pii_text = content_analyzer.scan_text_pii(img_rgb)
        
        requested_actions = action.split(',')

        if "manual_brush" in requested_actions and brush_data:
            try:
                coords = [float(x) for x in brush_data.split(',') if x]
                points = [(coords[i], coords[i+1]) for i in range(0, len(coords), 2)]
                h, w = img_rgb.shape[:2]
                pixel_points = [(p[0] * w / 100, p[1] * h / 100) for p in points]
                img_rgb = protection_tools.apply_brush_blur(img_rgb, pixel_points)
            except Exception as e: print(f"BRUSH ERROR: {e}")

        if "visible_blur" in requested_actions or "blur_selected" in requested_actions:
            target_indices = [int(x) for x in indices.split(",") if x]
            selected = [all_faces[i] for i in target_indices if i < len(all_faces)]
            img_rgb = protection_tools.visible_blur(img_rgb, selected)
            
        if "redact_data" in requested_actions:
            img_rgb = protection_tools.visible_blur(img_rgb, barcodes + pii_text)

        if "ai_cloak" in requested_actions:
            img_rgb = protection_tools.ai_cloak(img_rgb, all_faces)

        if "secure_sign" in requested_actions:
            # We pass session_id to bind the signature to this specific process
            img_rgb = protection_tools.apply_steganography(img_rgb, session_id, SECRET_KEY)

        buf = io.BytesIO()
        final_pil = Image.fromarray(img_rgb)
        # Lossless PNG is required to preserve LSB integrity
        final_pil.save(buf, format='PNG', optimize=False)
        buf.seek(0)
        
        return StreamingResponse(
            buf, 
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=protected.png"}
        )
    except Exception as e:
        print(f"PROTECTION_FAILURE: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify")
async def verify_signature(file: UploadFile = File(...)):
    """
    STRICT VERIFIER: Recalculates HMAC to detect pixel-level tampering.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return {"status": "ERROR", "message": "Invalid Image"}
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # 1. EXTRACT hidden data
        flat_img = img_rgb.flatten()
        limit = min(len(flat_img), 4000)
        lsbs = flat_img[:limit] & 1
        binary_data = "".join(lsbs.astype(str))
        
        terminator = '1111111111111110'
        if terminator not in binary_data:
            return {"status": "FAILED", "message": "No TrustLens Signature Found"}

        extracted_bin = binary_data.split(terminator)[0]
        extracted_str = "".join([chr(int(extracted_bin[i:i+8], 2)) for i in range(0, len(extracted_bin), 8)])
        
        if not extracted_str.startswith("TRUSTLENS:"):
            return {"status": "FAILED", "message": "Invalid Signature Format"}

        # 2. THE INTEGRITY CHECK
        # We must zero out the LSBs of the first 4000 pixels to get the "original" state
        # before the signature was added, otherwise the hash won't match.
        temp_flat = flat_img.copy()
        temp_flat[:4000] &= 254 
        
        current_pixel_hash = hashlib.sha256(temp_flat.tobytes()).hexdigest()
        
        # Re-generate the HMAC locally using the secret key
        expected_mac = hmac.new(
            SECRET_KEY.encode(), 
            current_pixel_hash.encode(), 
            hashlib.sha256
        ).hexdigest()[:20]
        
        stored_mac = extracted_str.split(":")[1]

        # 3. VERDICT
        if stored_mac != expected_mac:
            return {
                "status": "FAILED", 
                "message": "TAMPER ALERT: Pixel data does not match the original signature!",
                "details": "The image has been modified after it was secured."
            }

        return {
            "status": "SUCCESS", 
            "message": "Authentic & Untampered",
            "signature": extracted_str
        }
        
    except Exception as e:
        print(f"VERIFY_ERROR: {e}")
        return {"status": "ERROR", "message": str(e)}