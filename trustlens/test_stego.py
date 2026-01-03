import cv2
import numpy as np

def apply_stego(img, secret):
    print("Encoding...")
    binary_secret = ''.join(format(ord(c), '08b') for c in secret) + '1111111111111110'
    flat = img.flatten()
    if len(binary_secret) > len(flat):
        print("Message too long")
        return img
    
    # Fast numpy injection
    # Create an array of the bits
    secret_bits = np.array([int(b) for b in binary_secret], dtype=np.uint8)
    
    # Modify the first N pixels
    flat[:len(secret_bits)] = (flat[:len(secret_bits)] & ~1) | secret_bits
    return flat.reshape(img.shape)

def verify_stego(img):
    print("Decoding...")
    flat = img.flatten()
    
    # Extract LSBs efficiently? 
    # Iterate is slow.
    # Let's try to extract the first X bits where X is reasonable max length (e.g. 1000 bits)
    # The signature is "SAFE_" + session_id (36 chars) approx. 40 chars * 8 = 320 bits.
    # Plus terminator 16 bits. Total ~340 bits.
    # Reading 1000 pixels is instant. Reading 10,000,000 is slow.
    
    lsbs = flat[:2000] & 1 # Get LSBs of first 2000 pixels
    binary_string = "".join(lsbs.astype(str))
    
    terminator = '1111111111111110'
    if terminator in binary_string:
        clean_bin = binary_string.split(terminator)[0]
        # Decode
        chars = []
        for i in range(0, len(clean_bin), 8):
            byte = clean_bin[i:i+8]
            if len(byte) == 8:
                chars.append(chr(int(byte, 2)))
        return "".join(chars)
    return "NOT_FOUND"

# Test
img = np.zeros((500,500,3), dtype=np.uint8) + 100 # Grey image
secret = "SAFE_TEST_123"

# Encode
encoded = apply_stego(img.copy(), secret)

# Save/Load to test persistence
cv2.imwrite("test_stego.png", encoded)
loaded = cv2.imread("test_stego.png")

# Decode
result = verify_stego(loaded)
print(f"Result: {result}")
