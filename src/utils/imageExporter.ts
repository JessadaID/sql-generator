import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';

export type ExportFormat = 'png' | 'jpg' | 'pdf';

// Content zoom level — nodes appear at this magnification in the output image.
// 1.5 gives crisp, readable text similar to draw.io "Crop to Content".
const CONTENT_ZOOM = 1.5;

// Whitespace (px) around the content in the output image
const PADDING = 80;

// Capture the full diagram cropped tightly to all nodes (draw.io "Crop to Content" style).
// Image size is derived from actual content bounds, NOT from the screen viewport size.
export async function captureFullDiagram(
    nodes: Node[],
    format: ExportFormat,
    backgroundColor?: string
): Promise<void> {
    if (nodes.length === 0) throw new Error('No tables in diagram to export.');

    const el = document.querySelector<HTMLElement>('.react-flow__viewport');
    if (!el) throw new Error('Diagram element not found.');

    const bounds = getNodesBounds(nodes);

    // Output dimensions come from content size at CONTENT_ZOOM — not a fixed large canvas
    const imageWidth = Math.round(bounds.width * CONTENT_ZOOM + PADDING * 2);
    const imageHeight = Math.round(bounds.height * CONTENT_ZOOM + PADDING * 2);

    // Fix minZoom = maxZoom = CONTENT_ZOOM so getViewportForBounds uses exactly that zoom.
    // This ensures 1px in flow space = CONTENT_ZOOM px in the output image.
    const vp = getViewportForBounds(
        bounds,
        imageWidth,
        imageHeight,
        CONTENT_ZOOM,  // minZoom — clamp to this
        CONTENT_ZOOM,  // maxZoom — clamp to this
        PADDING
    );

    // Override the element's style so html-to-image captures exactly the content area
    const style: Partial<CSSStyleDeclaration> = {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
        transformOrigin: '0 0',
    };

    const filename = `schema-diagram.${format}`;

    if (format === 'png') {
        const dataUrl = await toPng(el, {
            cacheBust: true,
            width: imageWidth,
            height: imageHeight,
            style,
            // Omit backgroundColor entirely for transparent PNG
            ...(backgroundColor ? { backgroundColor } : {}),
        });
        triggerDownload(dataUrl, filename);

    } else if (format === 'jpg') {
        const dataUrl = await toJpeg(el, {
            cacheBust: true,
            quality: 0.95,
            width: imageWidth,
            height: imageHeight,
            style,
            backgroundColor: backgroundColor ?? '#0f172a',
        });
        triggerDownload(dataUrl, filename);

    } else {
        // PDF: capture as PNG then embed into jsPDF
        const dataUrl = await toPng(el, {
            cacheBust: true,
            width: imageWidth,
            height: imageHeight,
            style,
            backgroundColor: backgroundColor ?? '#0f172a',
        });
        const orientation = imageWidth > imageHeight ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [imageWidth, imageHeight] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
        pdf.save(filename);
    }
}

// Trigger a browser file download from a data URL
function triggerDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
