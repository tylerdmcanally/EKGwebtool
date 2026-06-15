# EKG Caliper Studio

A static, browser-based tool for reviewing ECG/EKG image files with calibrated calipers, waveform highlights, notes, and PNG/PDF export. It is designed for GitHub Pages and does not need a backend, drivers, or local installs for end users.

## First Pass Scope

- Upload or drag-drop an EKG/rhythm strip image.
- Auto-detect visible ECG paper grids and align the measurement overlay.
- Set paper speed or use a known time marker on the strip to calibrate intervals.
- Set gain for voltage measurement.
- Show a grid overlay while measuring uploaded strips.
- Add interval, R-R/rate, and amplitude calipers.
- Add marching calipers that set an interval once and repeat that spacing across the strip.
- Highlight P waves, QRS complexes, ST segments, T waves, or custom areas.
- Add notes, erase annotations, clear/undo, zoom, pan, and fit.
- Keep the strip visible while the control panel scrolls independently on desktop.
- Select marks from the strip or measurement list, then delete the selected mark from the panel or directly over the workspace.
- Export an annotated PNG or one-page PDF report.
- Share through the browser Web Share API when available; otherwise download the PDF and open an email draft.

## Clinical Measurement Defaults

The app defaults to 25 mm/s and 10 mm/mV. At 25 mm/s, one small 1 mm box is 40 ms and one large 5 mm box is 200 ms. At 10 mm/mV, one small vertical box is 0.1 mV. These defaults are editable because uploaded images may come from different paper speeds, gains, screenshots, or resized scans.

Use **Auto-detect Grid** first when the ECG paper grid is visible. The app estimates horizontal and vertical small-box spacing from regular grid-line peaks in the image, then aligns the overlay. Confirm the overlay lines match the strip before measuring. If the bold overlay lines are off by one small box, use **Shift overlay** to nudge the grid left, right, up, or down. If auto-detect cannot find a reliable grid, or if the image is telemetry without a visible grid, use manual time calibration.

For interval calibration, use **Set Time Scale**. In the common path, choose **Standard speed (25/50 mm/s)**, confirm the recording speed, enter how many large boxes you will trace, then drag left-to-right across exactly that many large boxes. For telemetry or nonstandard strips, choose **Known time marker on strip**, enter the known duration and how many large boxes it covers, then drag across those same boxes. The app calculates `small boxes = large boxes * 5`, `px per small box = dragged pixels / small boxes`, and `ms per small box = known ms / small boxes`. For example, 400 ms across two large boxes is 400 ms across 10 small boxes, or 40 ms per small box, which derives 25 mm/s.

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
