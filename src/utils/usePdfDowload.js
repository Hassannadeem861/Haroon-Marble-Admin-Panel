import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

/**
 * usePdfDownload()
 * ---------------------------------------------------------------
 * Shared PDF-export logic — pass any DOM ref (the printable sheet) and a
 * filename, it renders that element to a multi-page A4 PDF and downloads
 * it. Used by SalarySlip.jsx and WorkOrderReport.jsx so this logic exists
 * in exactly one place.
 *
 * Captures the LIVE element directly (no cloning / off-screen container —
 * that approach caused a createPattern crash on gradients/broken images
 * and, after working around that, a blank capture).
 *
 * Pagination is "smart": instead of blindly slicing the tall canvas at
 * fixed page-height intervals (which can cut a table row or line of text
 * in half right at the page boundary — the cause of "half data missing"
 * when the PDF is opened/shared), it searches near each ideal boundary
 * for a mostly-blank row (a natural gap between rows/sections) and cuts
 * there instead.
 */
export const usePdfDownload = () => {
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async (elementRef, filename) => {
    if (!elementRef?.current) return;
    setDownloading(true);

    // Temporarily hide anything marked .rpt-no-print / .ssp-no-print so
    // it doesn't show up in the exported PDF, then restore it after.
    const noPrintEls = Array.from(elementRef.current.querySelectorAll(".rpt-no-print, .ssp-no-print"));
    const previousVisibility = noPrintEls.map((el) => el.style.visibility);
    noPrintEls.forEach((el) => {
      el.style.visibility = "hidden";
    });

    try {
      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const ctx = canvas.getContext("2d");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pageWidthMm;
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

      // Look for a safe (mostly-blank / background-colored) row to cut at,
      // searching upward from the ideal boundary by up to ~18% of a page.
      const findSafeBreak = (idealY) => {
        const maxShift = Math.floor(pageHeightPx * 0.18);
        const bandTop = Math.max(0, idealY - maxShift);
        const bandHeight = idealY - bandTop;
        if (bandHeight <= 0) return idealY;

        let bandData;
        try {
          bandData = ctx.getImageData(0, bandTop, canvas.width, bandHeight).data;
        } catch {
          return idealY; // canvas tainted or inaccessible — fall back to naive cut
        }

        const rowBytes = canvas.width * 4;
        // Walk from the bottom of the band (closest to ideal boundary) upward.
        for (let row = bandHeight - 1; row >= 0; row--) {
          const rowStart = row * rowBytes;
          let isBlank = true;
          // Sample every 6th pixel in the row for speed.
          for (let x = 0; x < canvas.width; x += 6) {
            const i = rowStart + x * 4;
            const r = bandData[i];
            const g = bandData[i + 1];
            const b = bandData[i + 2];
            if (!(r > 245 && g > 245 && b > 245)) {
              isBlank = false;
              break;
            }
          }
          if (isBlank) return bandTop + row;
        }
        return idealY; // no blank row found — fall back to naive cut
      };

      let renderedY = 0;
      let isFirstPage = true;

      while (renderedY < canvas.height) {
        const idealNext = Math.min(renderedY + pageHeightPx, canvas.height);
        const breakY = idealNext >= canvas.height ? canvas.height : findSafeBreak(idealNext);
        const sliceHeightPx = Math.max(1, breakY - renderedY);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        pageCanvas.getContext("2d").drawImage(
          canvas,
          0,
          renderedY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        );

        const sliceImgData = pageCanvas.toDataURL("image/png");
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(sliceImgData, "PNG", 0, 0, pageWidthMm, sliceHeightMm);

        renderedY = breakY;
        isFirstPage = false;
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(`PDF download nahi ho saki: ${error?.message || "Unknown error"}`);
    } finally {
      noPrintEls.forEach((el, i) => {
        el.style.visibility = previousVisibility[i];
      });
      setDownloading(false);
    }
  };

  return { downloadPdf, downloading };
};