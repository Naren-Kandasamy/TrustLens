from config import Config
import datetime

class RiskEngine:
    def calculate_trust_score(self, forensics, content_detections, is_child, pii_list, barcodes, metadata):
        score = 100
        threats = []
        report_log = [] 

        # --- 1. METADATA CHECK ---
        if metadata.get('gps_found'):
            score -= Config.WEIGHT_GPS
            threats.append("GPS Location Data Embedded")
            report_log.append("[!] LOCATION DATA: DETECTED (High Risk)")
        elif metadata.get('is_stripped', False):
            report_log.append("[+] METADATA: STRIPPED/CLEAN (Safe)")
        else:
            report_log.append(f"[i] DEVICE INFO: {metadata.get('device_info', 'Unknown')}")
            report_log.append("[+] LOCATION DATA: NONE (Safe)")

        # --- 2. FACIAL RECOGNITION ---
        faces = [d for d in content_detections if d['type'] == 'FACE']
        if len(faces) > 0:
            if is_child:
                score -= Config.WEIGHT_CHILD
                threats.append("Child Detected (Sharenting Risk)")
                report_log.append(f"[!] SUBJECTS: {len(faces)} FOUND - CHILD DETECTED (Risk)")
            else:
                score -= 5 
                report_log.append(f"[i] SUBJECTS: {len(faces)} ADULTS DETECTED (Privacy Note)")
        else:
            report_log.append("[+] SUBJECTS: NONE (Privacy Safe)")

        # --- 3. FORENSICS ---
        if forensics.get('ela_manipulated'):
            score -= Config.WEIGHT_DEEPFAKE
            threats.append("Potential Digital Manipulation")
            report_log.append("[!] INTEGRITY: ANOMALIES DETECTED (Possible Edit)")
        else:
            report_log.append("[+] INTEGRITY: VERIFIED ORGANIC (No Edits)")

        # --- 4. DATA MINING ---
        if barcodes:
            score -= Config.WEIGHT_BARCODE
            threats.append(f"{len(barcodes)} Barcodes Found")
            report_log.append(f"[!] HIDDEN DATA: {len(barcodes)} BARCODES FOUND")
        else:
            report_log.append("[+] HIDDEN DATA: NONE (Safe)")

        if pii_list:
            score -= Config.WEIGHT_PII
            threats.append("Personal Text (PII) Found")
            report_log.append(f"[!] TEXT SCAN: PII DETECTED")
        else:
            report_log.append("[+] TEXT SCAN: CLEAN (Safe)")

        # --- FINAL REPORT GENERATION ---
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_color = "RED" if score < 50 else "AMBER" if score < 85 else "GREEN"
        
        full_report = f"""
/// TRUSTLENS ANALYSIS LOG ///
TIMESTAMP: {timestamp}
STATUS: {status_color} (SCORE: {max(score, 0)})
------------------------------------------
{chr(10).join(report_log)}
------------------------------------------
CONCLUSION: {'SAFE TO SHARE' if score >= 85 else 'REVIEW RECOMMENDED'}
"""
        return max(score, 0), threats, full_report