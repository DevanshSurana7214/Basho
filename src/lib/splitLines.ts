export type SplitLinesResult = {
  lineElements: HTMLSpanElement[];
  revert: () => void;
};

function getTextContentPreserveSpaces(element: HTMLElement): string {
  // Normalize whitespace similarly to how the browser collapses it in normal flow.
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Splits an element's text into visual lines by measuring layout, and wraps each line.
 * Produces structure:
 *   <span class="pss-lineMask"><span class="pss-lines">...</span></span>
 * Returns the `.pss-lines` elements for animation, plus a revert() cleanup.
 */
export function splitElementIntoLines(
  element: HTMLElement,
  options?: {
    lineMaskClassName?: string;
    lineClassName?: string;
  }
): SplitLinesResult {
  const lineMaskClassName = options?.lineMaskClassName ?? "pss-lineMask";
  const lineClassName = options?.lineClassName ?? "pss-lines";

  const originalHtml = element.innerHTML;
  const originalAriaLabel = element.getAttribute("aria-label");
  const text = getTextContentPreserveSpaces(element);

  // If there's no text, do nothing.
  if (!text) {
    return {
      lineElements: [],
      revert: () => {
        element.innerHTML = originalHtml;
        if (originalAriaLabel === null) element.removeAttribute("aria-label");
        else element.setAttribute("aria-label", originalAriaLabel);
      },
    };
  }

  // Accessibility: keep the original sentence as label.
  element.setAttribute("aria-label", text);

  // Temporary word spans to measure line breaks.
  element.innerHTML = "";

  const words = text.split(" ");
  const wordSpans: HTMLSpanElement[] = [];

  for (let i = 0; i < words.length; i += 1) {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.textContent = i === words.length - 1 ? words[i] : `${words[i]} `;
    element.appendChild(span);
    wordSpans.push(span);
  }

  // Measure lines by offsetTop.
  const linesText: string[] = [];
  let currentTop: number | null = null;
  let buffer = "";

  for (const span of wordSpans) {
    const top = span.offsetTop;
    if (currentTop === null) {
      currentTop = top;
    }

    if (top !== currentTop) {
      linesText.push(buffer.trimEnd());
      buffer = "";
      currentTop = top;
    }

    buffer += span.textContent ?? "";
  }
  if (buffer) linesText.push(buffer.trimEnd());

  // Rebuild with line masks + line elements.
  element.innerHTML = "";

  const lineElements: HTMLSpanElement[] = [];
  for (const line of linesText) {
    const mask = document.createElement("span");
    mask.className = lineMaskClassName;

    const lineEl = document.createElement("span");
    lineEl.className = lineClassName;
    lineEl.textContent = line;

    mask.appendChild(lineEl);
    element.appendChild(mask);
    lineElements.push(lineEl);
  }

  return {
    lineElements,
    revert: () => {
      element.innerHTML = originalHtml;
      if (originalAriaLabel === null) element.removeAttribute("aria-label");
      else element.setAttribute("aria-label", originalAriaLabel);
    },
  };
}
