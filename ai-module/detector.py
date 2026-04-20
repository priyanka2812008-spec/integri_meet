import random
import time

def process_image(base64_img):
    """
    Simulates the AI OpenCV overlay detection process.
    In a real scenario, this would decode base64, convert to cv2 image,
    and run a YOLO or Haar-cascade model to detect cheating devices/overlays.
    """
    # Simulate processing time
    time.sleep(0.5)

    # 7% chance of lens cover/blur detection
    is_lens_covered = random.random() < 0.07
    is_suspicious = random.random() < 0.05 or is_lens_covered
    
    status_msg = 'Clear'
    if is_lens_covered:
        status_msg = 'Lens covered or high blur detected!'
    elif is_suspicious:
        status_msg = 'Suspicious overlay detected!'

    return {
        'suspicious': is_suspicious,
        'confidence': round(random.uniform(0.75, 0.99), 2) if is_suspicious else round(random.uniform(0.1, 0.4), 2),
        'message': status_msg
    }
