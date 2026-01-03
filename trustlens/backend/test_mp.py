import mediapipe as mp
try:
    import mediapipe.python.solutions as solutions
    print("Imported mediapipe.python.solutions")
    print(solutions.face_detection)
except ImportError as e:
    print(f"Failed to import mediapipe.python.solutions: {e}")

try:
    from mediapipe import solutions
    print("Imported from mediapipe import solutions")
except ImportError as e:
    print(f"Failed to import from mediapipe import solutions: {e}")