import cv2
import numpy as np

def extract_hidden_key(image_path):
    """
    Extracts the hidden steganographic key from the image pixels.
    """
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    flat_img = img_rgb.flatten()
    
    binary_data = ""
    for i in range(len(flat_img)):
        # Grab the last bit of every pixel
        binary_data += str(flat_img[i] & 1)
        
        # Check for our null-terminator '1111111111111110'
        if binary_data.endswith('1111111111111110'):
            break
            
    # Remove terminator and convert binary to string
    binary_data = binary_data[:-16]
    chars = [binary_data[i:i+8] for i in range(0, len(binary_data), 8)]
    decoded_str = "".join([chr(int(c, 2)) for c in chars])
    
    return decoded_str if decoded_str else "No Signature Found"

# Usage: print(f"Detected Signature: {extract_hidden_key('sanitized.jpg')}")