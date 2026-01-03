import exifread
import os

class AnalyzerMetadata:
    def get_metadata_risk(self, file_path):
        """
        Extracts specific EXIF tags for the Metadata Audit table.
        """
        audit_data = []
        risk_score = 0
        
        try:
            with open(file_path, 'rb') as f:
                # details=False keeps the processing fast for the scan phase
                tags = exifread.process_file(f, details=False)
                
                # Critical privacy headers to audit
                privacy_map = {
                    'GPS GPSLatitude': 'GPS Location',
                    'Image Make': 'Camera Make',
                    'Image Model': 'Camera Model',
                    'Image Software': 'Software/OS',
                    'EXIF DateTimeOriginal': 'Timestamp',
                    'Image Artist': 'Owner/Artist'
                }

                for tag, label in privacy_map.items():
                    if tag in tags:
                        value = str(tags[tag])
                        # If GPS is found, we flag it as high risk
                        risk_level = "High" if "GPS" in label else "Medium"
                        audit_data.append({"tag": label, "value": value, "risk": risk_level})
                        risk_score += 20
                        
        except Exception as e:
            print(f"[METADATA_ERR] {e}")

        return {
            "score": min(risk_score, 100),
            "audit": audit_data,
            "summary": f"Detected {len(audit_data)} sensitive EXIF headers."
        }