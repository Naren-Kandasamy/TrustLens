# TrustLens

> **The Universal Safety Suite for Digital Visuals**

TrustLens is a comprehensive privacy and security tool designed to analyze, protect, and verify digital images. It combines advanced computer vision, machine learning, and cryptographic steganography to help users detect hidden risks (like metadata and PII), protect their identity against AI scraping, and digitally sign their assets to prove authenticity.

---

## Key Features

### 1. Deep Diagnostic Scan
Automatically detects hidden threats within your images:
*   **Facial Recognition:** Identifies faces (and potential minors) using **MediaPipe** / **OpenCV**.
*   **Data Mining:** Extracts embedded **EXIF Metadata** (GPS, Device Info) and decodes **QR/Barcodes**.
*   **PII Detection:** Uses **OCR (Tesseract)** to find phone numbers, emails, and credit card patterns.
*   **Forensics:** Analyzes Error Levels (ELA) to detect potential deepfake manipulation.

### 2. Smart Protection Tools
Apply granular privacy filters to your assets:
*   **Selective Redaction:** Blur specific faces or sensitive data with a click.
*   **AI Cloaking:** Inject adversarial noise to disrupt facial recognition algorithms while keeping the image visible to humans.
*   **Metadata Stripping:** Automatically removes location and device data.

### 3. Digital Notary (Zero-Trust)
*   **Steganographic Signing:** Embeds an invisible, tamper-proof **HMAC-SHA256** signature directly into the image pixels.
*   **Verification:** Re-validates images to prove they haven't been altered since they were signed.

---

## Architecture

The project is split into a high-performance Python backend and a modern React frontend.

### Backend (Python / FastAPI)
*   **Framework:** FastAPI (Async/Await)
*   **Computer Vision:** OpenCV, NumPy, PIL, MediaPipe
*   **Forensics:** Error Level Analysis (ELA)
*   **Security:** HMAC Cryptography, Steganography (LSB)

### Frontend (React / Vite)
*   **Framework:** React 19 + TypeScript
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Visualization:** Interactive Canvas overlays for bounding boxes.

---

## Installation

### Prerequisites
*   **Python 3.10+**
*   **Node.js 18+**
*   **Tesseract OCR** (System dependency for text detection)
    *   *Mac:* `brew install tesseract`
    *   *Ubuntu:* `sudo apt install tesseract-ocr`
    *   *Windows:* [Download Installer](https://github.com/UB-Mannheim/tesseract/wiki)

### 1. Clone the Repository
```bash
git clone https://github.com/Naren-Kandasamy/TrustLens
cd trustlens
```

### 2. Setup Backend
Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Frontend
Navigate to the frontend directory and install Node modules.

```bash
cd ../newfrontend

# Install dependencies
npm install
```

---

## Usage

### Start the Backend Server
From the `backend/` directory:
```bash
python server.py
# Server runs on http://localhost:8000
```
*Note: Ensure you are in your virtual environment (`source .venv/bin/activate`).*

### Start the Frontend Application
From the `newfrontend/` directory:
```bash
npm run dev
# App runs on http://localhost:5173
```

1.  Open your browser to `http://localhost:5173`.
2.  **Drag & Drop** an image to start a scan.
3.  Review the **Trust Score** and detected risks.
4.  Select items to **Redact** or **Cloak**.
5.  Download your protected, digitally signed asset.
6.  Use the **Verify** tab to check the integrity of any signed image.

---

## Disclaimer
TrustLens is a privacy-enhancing tool, but no security measure is absolute. The "AI Cloaking" feature is based on adversarial noise techniques which evolve constantly. Always exercise caution when sharing sensitive data online.


