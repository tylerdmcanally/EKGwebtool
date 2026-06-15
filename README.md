# EKG Caliper Studio

A static, browser-based tool for reviewing ECG/EKG image files with calibrated calipers, waveform highlights, notes, and PNG/PDF export. It is designed for GitHub Pages and does not need a backend, drivers, or local installs for end users.

## First Pass Scope

- Upload or drag-drop an EKG/rhythm strip image.
- Set paper speed, gain, horizontal box spacing, and vertical box spacing.
- Align a movable grid overlay to the uploaded image by dragging over a known number of small boxes.
- Calibrate box spacing by dragging across a known number of small boxes.
- Add interval, R-R/rate, and amplitude calipers.
- Add marching calipers that set an interval once and repeat that spacing across the strip.
- Highlight P waves, QRS complexes, ST segments, T waves, or custom areas.
- Add notes, erase annotations, clear/undo, zoom, pan, and fit.
- Export an annotated PNG or one-page PDF report.
- Share through the browser Web Share API when available; otherwise download the PDF and open an email draft.

## Clinical Measurement Defaults

The app defaults to 25 mm/s and 10 mm/mV. At 25 mm/s, one small 1 mm box is 40 ms and one large 5 mm box is 200 ms. At 10 mm/mV, one small vertical box is 0.1 mV. These defaults are editable because uploaded images may come from different paper speeds, gains, screenshots, or resized scans.

For reliable image measurement, use **Align Grid** first. Set `Cal boxes` to the number of small boxes you are spanning, commonly 5 for one large ECG box, then drag a rectangle over that same box span on the uploaded strip. This sets the overlay origin plus horizontal and vertical pixel spacing. Leave `Lock square boxes` off unless the image is known to be undistorted.

ECG interpretation is broader than caliper measurement. A systematic review usually includes rate, rhythm regularity, P-wave presence/morphology, PR interval, QRS duration/morphology, QT/QTc context, ST-segment/T-wave changes, artifact, and calibration. This app helps document and measure those findings; it does not diagnose.

## GitHub Pages Hosting

1. Commit `index.html`, `styles.css`, `app.js`, and `README.md`.
2. Push to a GitHub repository.
3. In GitHub, open `Settings > Pages`.
4. Choose `Deploy from a branch`, then select the branch and `/root`.
5. Save. GitHub will publish the static site after the Pages build completes.

## Limitations

- No uploaded image is stored or shared by the site. Sharing is file-based through the user's browser.
- Camera perspective, skew, and nonuniform resizing can affect measurements. Use the calibration tool on the actual image before measuring.
- The app assumes a straight horizontal time axis and vertical voltage axis.
- This is for education, review, and documentation only. It is not a diagnostic medical device or a replacement for clinician interpretation.

## Reference Points Used

- NCBI Bookshelf StatPearls, "Electrocardiogram": https://www.ncbi.nlm.nih.gov/books/NBK549803/
- AHA/ACCF/HRS ECG standardization statement, Part I technical standards: https://doi.org/10.1161/CIRCULATIONAHA.106.180200
