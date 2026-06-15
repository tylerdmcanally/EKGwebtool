# EKG Caliper Studio

A static, browser-based tool for reviewing ECG/EKG image files with calibrated calipers, waveform highlights, notes, and PNG/PDF export. It is designed for GitHub Pages and does not need a backend, drivers, or local installs for end users.

## First Pass Scope

- Upload or drag-drop an EKG/rhythm strip image.
- Redact visible PHI or identifiers with black mask rectangles before export.
- Add a one-click top header redaction for common EKG printout demographics.
- Require PHI scrub review before PNG, PDF, or share export.
- Auto-detect visible ECG paper grids on image load and align the measurement overlay.
- Set paper speed or use a known time marker on the strip to calibrate intervals.
- Set gain for voltage measurement.
- Show a grid overlay while measuring uploaded strips.
- Add interval, R-R/rate, and amplitude calipers.
- Add marching calipers that set an interval once and repeat that spacing across the strip.
- Highlight P waves, QRS complexes, ST segments, T waves, or custom areas.
- Add notes, erase annotations, clear/undo, zoom, pan, and fit.
- Keep the strip visible while the control panel scrolls independently on desktop.
- Use the workspace quick tools or keyboard shortcuts to switch between selection, pan, interval, R-R, marching, voltage, and highlight modes without leaving the strip.
- Use the sidebar for selected-mark management, marching settings, and color-coded highlight type chips, with duplicate sidebar tool buttons collapsed by default.
- Select marks from the strip or measurement list, drag selected endpoints to adjust them, then delete the selected mark from the panel, workspace toolbar, or Delete/Backspace key.
- Export an annotated PNG or one-page PDF report.
- Share through the browser Web Share API when available; otherwise download the PDF and open an email draft.

## Privacy Handling

The app is static and client-side: uploaded images are processed in the browser and are not sent to a server by this site. The export workflow still treats visible identifiers as sensitive. Uploaded source filenames are not included in generated reports, and exported files use a generic `ekg-report` name.

Use **Redact area** to draw black masks over names, MRNs, DOBs, accession numbers, facility labels, timestamps tied to the patient, or any other visible identifier. **Block top header** adds a quick full-width mask over the common demographics area. Redactions are included in PNG, PDF, and share exports. **Apply redactions** bakes active masks into the working image and removes the editable mask layer.

Exports are blocked until **PHI scrub reviewed** is checked. This is a workflow control, not automated de-identification or OCR. The user still needs to visually inspect the entire image before exporting or sharing.

## Clinical Measurement Defaults

The app defaults to 25 mm/s and 10 mm/mV. At 25 mm/s, one small 1 mm box is 40 ms and one large 5 mm box is 200 ms. At 10 mm/mV, one small vertical box is 0.1 mV. These defaults are editable because uploaded images may come from different paper speeds, gains, screenshots, or resized scans.

When an ECG image loads, the app automatically tries to detect the visible paper grid. It estimates horizontal and vertical small-box spacing from regular grid-line peaks across the strip, then aligns the overlay. Confirm the overlay lines match the strip before measuring. Use **Auto-detect Grid** only when you want to retry detection. If the bold overlay lines are off by one small box, use **Shift overlay** to nudge the grid left, right, up, or down. If auto-detect cannot find a reliable grid, or if the image is telemetry without a visible grid, use manual time calibration.

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
- PHI redaction is manual. The app does not certify HIPAA de-identification and cannot guarantee that all identifiers are removed.
- Camera perspective, skew, and nonuniform resizing can affect measurements. Use the calibration tool on the actual image before measuring.
- The app assumes a straight horizontal time axis and vertical voltage axis.
- This is for education, review, and documentation only. It is not a diagnostic medical device or a replacement for clinician interpretation.

## Reference Points Used

- NCBI Bookshelf StatPearls, "Electrocardiogram": https://www.ncbi.nlm.nih.gov/books/NBK549803/
- AHA/ACCF/HRS ECG standardization statement, Part I technical standards: https://doi.org/10.1161/CIRCULATIONAHA.106.180200
- HHS OCR HIPAA de-identification guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
