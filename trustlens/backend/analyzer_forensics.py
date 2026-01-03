import cv2
import numpy as np
from PIL import Image, ImageChops
import io

class AnalyzerForensics:
    def analyze_ela(self, image_rgb: np.ndarray, quality=90):
        """Standard Error Level Analysis."""
        original = Image.fromarray(image_rgb)
        buf = io.BytesIO()
        original.save(buf, format='JPEG', quality=quality)
        buf.seek(0)
        resaved = Image.open(buf)
        ela_img = ImageChops.difference(original, resaved)
        extrema = ela_img.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        return max_diff > 45

    def detect_deepfake_artifacts(self, image_rgb: np.ndarray):
        """
        Feature 3: Spectral Analysis (FFT).
        Detects unnatural noise patterns common in AI-generated faces.
        """
        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        
        # 2D Fast Fourier Transform
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1)
        
        h, w = magnitude_spectrum.shape
        center_h, center_w = h // 2, w // 2
        
        # Ignore natural low-frequency structures
        magnitude_spectrum[center_h-50:center_h+50, center_w-50:center_w+50] = 0
        
        # Variance of high-frequency noise
        score = np.var(magnitude_spectrum)
        
        # NEW THRESHOLD: Real sharp photos hit 1000-2000. AI artifacts hit >2500.
        is_ai = score > 2500 
        
        return is_ai, round(float(score), 2)