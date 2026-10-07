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
 * there instead. It also never cuts through a "block" (card, table row,
 * photo — see PDF_BLOCK_SELECTOR); the cut moves up to the block's top.
 *
 * Phone par bhi PDF laptop jaisi bane: capture fixed desktop width
 * (PDF_RENDER_WIDTH) par hota hai, aur html2canvas ka clone wide iframe
 * (PDF_WINDOW_WIDTH) mein render hota hai taake desktop media queries lagein.
 */
const PDF_RENDER_WIDTH = 800;
const PDF_WINDOW_WIDTH = 1024;
const PDF_BLOCK_SELECTOR =
  "tr, img, .rpt-summary-card, .rpt-meta-grid > div, .rpt-round-dates > div, .rpt-section-title, .rpt-note, .rpt-signatures, .rpt-footer-note";

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
      // Clickable areas ([data-pdf-link], e.g. photo thumbnails) aur blocks (jo page break par na
      // katein) ki position clone mein naapo — clone desktop width par hai, live element nahi.
      let linkBoxes = [];
      let blockBoxes = [];
      let cloneWidth = PDF_RENDER_WIDTH;

      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: PDF_WINDOW_WIDTH,
        onclone: (clonedDoc, clonedEl) => {
          clonedEl.style.width = `${PDF_RENDER_WIDTH}px`;
          clonedEl.style.maxWidth = "none";
          const rootRect = clonedEl.getBoundingClientRect();
          cloneWidth = rootRect.width;
          const boxOf = (el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left - rootRect.left, top: r.top - rootRect.top, width: r.width, height: r.height };
          };
          linkBoxes = Array.from(clonedEl.querySelectorAll("[data-pdf-link]")).map((el) => ({
            url: el.getAttribute("data-pdf-link"),
            ...boxOf(el),
          }));
          blockBoxes = Array.from(clonedEl.querySelectorAll(PDF_BLOCK_SELECTOR)).map(boxOf);
        },
      });
      const canvasPerCssPx = canvas.width / cloneWidth;

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
            // 250: card ka halka grey background (#F7F8FC) khaali jagah nahi hai.
            if (!(r > 250 && g > 250 && b > 250)) {
              isBlank = false;
              break;
            }
          }
          if (isBlank) return bandTop + row;
        }
        return idealY; // no blank row found — fall back to naive cut
      };

      // Cut kisi block (card / row / photo) ke beech se guzre to cut us block ke upar le jao.
      // Page se lamba block ya bohot upar jata cut ho to asal cut hi rakho (page khaali na rahe).
      const blocksPx = blockBoxes.map((box) => ({
        top: Math.floor(box.top * canvasPerCssPx),
        bottom: Math.ceil((box.top + box.height) * canvasPerCssPx),
      }));
      const avoidBlocks = (y, pageTop) => {
        let cut = y;
        let moved = true;
        while (moved) {
          moved = false;
          for (const block of blocksPx) {
            if (block.top < cut && block.bottom > cut && block.top > pageTop && block.bottom - block.top < pageHeightPx) {
              cut = block.top - 4;
              moved = true;
            }
          }
        }
        return cut > pageTop + pageHeightPx * 0.3 ? cut : y;
      };

      let renderedY = 0;
      let isFirstPage = true;

      while (renderedY < canvas.height) {
        const idealNext = Math.min(renderedY + pageHeightPx, canvas.height);
        const breakY = idealNext >= canvas.height ? canvas.height : avoidBlocks(findSafeBreak(idealNext), renderedY);
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

        // Is page par jo clickable areas aate hain un par link lagao (page ke kinare par kat jayein to wahi tak).
        linkBoxes.forEach((box) => {
          const top = box.top * canvasPerCssPx;
          const bottom = top + box.height * canvasPerCssPx;
          if (top < renderedY || top >= breakY) return;
          pdf.link(
            (box.left * canvasPerCssPx) / pxPerMm,
            (top - renderedY) / pxPerMm,
            (box.width * canvasPerCssPx) / pxPerMm,
            (Math.min(bottom, breakY) - top) / pxPerMm,
            { url: box.url },
          );
        });

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