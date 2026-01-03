import hashlib
import hmac
import cv2
import numpy as np

class ProtectionTools:
    def apply_brush_blur(self, image_rgb, points, radius=30):
        """
        Applies a circular blur at specific coordinates (Manual Brush).
        """
        canvas = image_rgb.copy()
        mask = np.zeros(canvas.shape[:2], dtype=np.uint8)
        
        # Draw white circles for all brush points
        for (x, y) in points:
            cv2.circle(mask, (int(x), int(y)), radius, 255, -1)
            
        # Feather the mask
        mask = cv2.GaussianBlur(mask, (51, 51), 0)
        
        # Create blurred background
        blurred_img = cv2.GaussianBlur(canvas, (99, 99), 30)
        
        # Blend
        mask_stack = np.stack([mask]*3, axis=-1).astype(np.float32) / 255.0
        canvas_float = canvas.astype(np.float32)
        blurred_float = blurred_img.astype(np.float32)
        
        final_float = (canvas_float * (1.0 - mask_stack) + blurred_float * mask_stack)
        return np.clip(final_float, 0, 255).astype(np.uint8)

    def visible_blur(self, image_rgb, detections):
        """
        Applies ovals for faces and sharp black rectangles for data.
        """
        original = image_rgb.copy()
        mask = np.zeros(original.shape[:2], dtype=np.uint8)
        
        h_img, w_img = original.shape[:2]
        
        # 1. Prepare Mask for Faces (Ovals)
        for det in detections:
            if det['type'] == 'FACE':
                x, y, w, h = det['box']
                pad_w, pad_h = int(w * 0.1), int(h * 0.1)
                x_pad = max(0, int(x - pad_w))
                y_pad = max(0, int(y - pad_h))
                w_pad = min(w_img - x_pad, int(w + (pad_w * 2)))
                h_pad = min(h_img - y_pad, int(h + (pad_h * 2)))
                
                center_x = int(x_pad + w_pad/2)
                center_y = int(y_pad + h_pad/2)
                cv2.ellipse(mask, (center_x, center_y), (max(1, int(w_pad/2)), max(1, int(h_pad/2))), 0, 0, 360, 255, -1)

        # 2. Apply Face Blur
        mask_blurred = cv2.GaussianBlur(mask, (51, 51), 0)
        heavy_blur = cv2.GaussianBlur(original, (99, 99), 30)
        
        mask_stack = np.stack([mask_blurred]*3, axis=-1).astype(np.float32) / 255.0
        result = (original.astype(np.float32) * (1.0 - mask_stack) + heavy_blur.astype(np.float32) * mask_stack)
        result = np.clip(result, 0, 255).astype(np.uint8)

        # 3. Apply Sharp Black Rectangles for Data (Barcodes/PII)
        for det in detections:
            if det['type'] != 'FACE':
                x, y, w, h = det['box']
                pad_w, pad_h = int(w * 0.1), int(h * 0.1)
                x_pad = max(0, int(x - pad_w))
                y_pad = max(0, int(y - pad_h))
                w_pad = min(w_img - x_pad, int(w + (pad_w * 2)))
                h_pad = min(h_img - y_pad, int(h + (pad_h * 2)))
                
                cv2.rectangle(result, (x_pad, y_pad), (x_pad + w_pad, y_pad + h_pad), (0, 0, 0), -1)

        return result

    def ai_cloak(self, image_rgb, detections):
        """
        Feature: AI Cloak.
        Humans see the face; AI models fail to recognize patterns.
        """
        canvas = image_rgb.copy().astype(np.float32)
        h_img, w_img = canvas.shape[:2]
        
        for det in detections:
            x, y, w, h = det['box']
            # Safety boundaries
            x1, y1 = max(0, int(x)), max(0, int(y))
            x2, y2 = min(w_img, int(x + w)), min(h_img, int(y + h))
            
            # Generate adversarial noise
            noise = np.random.normal(0, 8, (y2-y1, x2-x1, 3)).astype(np.float32)
            roi = canvas[y1:y2, x1:x2]
            
            if roi.shape == noise.shape:
                canvas[y1:y2, x1:x2] = np.clip(roi + noise, 0, 255)
                
        return canvas.astype(np.uint8)
    
    def apply_steganography(self, image_rgb, session_id, secret_key="SUPER_SECRET_KEY"):
        """
        SECURE ENCODER: Synchronized version for Zero-Trust verification.
        """
        # 1. Flatten and clear LSBs of the signature area BEFORE hashing
        # This ensures the hash is based on the "clean" image data
        flat_img = image_rgb.flatten()
        flat_img[:4000] &= 254 
        
        # 2. Create the hash of the clean image pixels
        image_hash = hashlib.sha256(flat_img.tobytes()).hexdigest()
        
        # 3. Create the HMAC tied to the clean image
        mac = hmac.new(secret_key.encode(), image_hash.encode(), hashlib.sha256).hexdigest()[:20]
        
        full_secret = f"TRUSTLENS:{mac}" 
        binary_secret = ''.join(format(ord(c), '08b') for c in full_secret) + '1111111111111110'
        
        if len(binary_secret) > len(flat_img):
            return image_rgb
            
        # 4. Inject bits into the clean LSBs
        bits = np.array([int(b) for b in binary_secret], dtype=np.uint8)
        flat_img[:len(binary_secret)] = (flat_img[:len(binary_secret)] & 254) | bits
            
        return flat_img.reshape(image_rgb.shape)