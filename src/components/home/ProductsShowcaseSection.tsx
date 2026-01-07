import "./productsShowcaseScroll.css";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { splitElementIntoLines, type SplitLinesResult } from "@/lib/splitLines";
import { productImages } from "@/lib/productImages";

let gsapPluginsRegistered = false;
function ensureGsapPluginsRegistered(): void {
  if (gsapPluginsRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  gsapPluginsRegistered = true;
}

type CssVarStyle = React.CSSProperties & Record<`--${string}`, string>;
function cssVars(vars: Record<`--${string}`, string>): CssVarStyle {
  return vars as CssVarStyle;
}

type Slide = {
  id: string;
  title: string;
  desc: string;
  imageUrl: string;
};

const ProductsShowcaseSection = () => {
  type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    in_stock: boolean;
    created_at: string | null;
  };

  const { data: products } = useQuery({
    queryKey: ["products-showcase-scroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,image_url,in_stock,created_at")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const slides = useMemo<Slide[]>(() => {
    const source = products ?? [];

    // Use the same bundled image mapping the rest of the app uses.
    // Filter out items without a bundled asset to satisfy the “use /assets images” constraint.
    const mapped = source
      .map((p) => {
        const imageUrl = productImages[p.name];
        if (!imageUrl) return null;
        return {
          id: p.id,
          title: p.name,
          desc: p.description ?? "",
          imageUrl,
        } satisfies Slide;
      })
      .filter((x): x is Slide => x !== null);

    // Keep exactly 4 slides (4 scroll steps/images) as requested.
    return mapped.slice(0, 4);
  }, [products]);

  const scrollingWrapperRef = useRef<HTMLElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const bgImageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const posterImageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const descRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const progressRef = useRef<number>(0);
  const splitCleanupsRef = useRef<Array<SplitLinesResult>>(/* initial */ []);

  useEffect(() => {
    ensureGsapPluginsRegistered();

    const wrapper = scrollingWrapperRef.current;
    const poster = posterRef.current;
    const cta = ctaRef.current;
    if (!wrapper || !poster || !cta) return;

    const bgImages = bgImageRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    const posterImages = posterImageRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    const titleEls = titleRefs.current.filter(
      (el): el is HTMLHeadingElement => el !== null
    );
    const descEls = descRefs.current.filter(
      (el): el is HTMLParagraphElement => el !== null
    );

    const totalImage = slides.length;
    if (totalImage < 2) return;

    // Reset progress to match the first slide.
    progressRef.current = 0;

    const maskArray: string[] = [
      `linear-gradient(0deg, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%,#000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%,#000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%)`,
      `linear-gradient(
        0deg,
        black 0% 1.45%, transparent 1.45% 3.33%, black 3.33% 4.59%, transparent 4.59% 6.66%, black 6.66% 7.72%, transparent 7.72% 10%, black 10% 10.85%, transparent 10.85% 13.33%, black 13.33% 13.99%, transparent 13.99% 16.66%, black 16.66% 17.12%, transparent 17.12% 20%, black 20% 20.25%, transparent 20.25% 23.33%, black 23.33% 23.39%, transparent 23.39% 26.66%, black 26.66% 26.66%, transparent 26.66% 30%, black 30% 30%, transparent 30% 33.33%, black 33.33% 33.33%, transparent 33.33% 36.66%, black 36.66% 36.66%, transparent 36.66% 40%, black 40% 40%, transparent 40% 43.33%, black 43.33% 43.33%, transparent 43.33% 46.66%, black 46.66% 46.66%, transparent 46.66% 50%, black 50% 50%, transparent 50% 53.33%, black 53.33% 53.33%, transparent 53.33% 56.66%, black 56.66% 56.66%, transparent 56.66% 60%, black 60% 60%, transparent 60% 63.33%, black 63.33% 63.33%, transparent 63.33% 66.66%, black 66.66% 66.66%, transparent 66.66% 70%, black 70% 70%, transparent 70% 73.33%, black 73.33% 73.33%, transparent 73.33% 76.66%, black 76.66% 76.66%, transparent 76.66% 80%, black 80% 80%, transparent 80% 83.33%, black 83.33% 83.33%, transparent 83.33% 86.66%, black 86.66% 86.66%, transparent 86.66% 90%, black 90% 90%, transparent 90% 93.33%, black 93.33% 93.33%, transparent 93.33% 96.66%, black 96.66% 96.66%, transparent 96.66% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 2.99%, transparent 2.99% 3.33%, black 3.33% 6.12%, transparent 6.12% 6.66%, black 6.66% 9.25%, transparent 9.25% 10%, black 10% 12.39%, transparent 12.39% 13.33%, black 13.33% 15.52%, transparent 15.52% 16.66%, black 16.66% 18.65%, transparent 18.65% 20%, black 20% 21.79%, transparent 21.79% 23.33%, black 23.33% 24.92%, transparent 24.92% 26.66%, black 26.66% 28.05%, transparent 28.05% 30%, black 30% 31.19%, transparent 31.19% 33.33%, black 33.33% 34.32%, transparent 34.32% 36.66%, black 36.66% 37.45%, transparent 37.45% 40%, black 40% 40.59%, transparent 40.59% 43.33%, black 43.33% 43.72%, transparent 43.72% 46.66%, black 46.66% 46.85%, transparent 46.85% 50%, black 50% 50%, transparent 50% 53.33%, black 53.33% 53.33%, transparent 53.33% 56.66%, black 56.66% 56.66%, transparent 56.66% 60%, black 60% 60%, transparent 60% 63.33%, black 63.33% 63.33%, transparent 63.33% 66.66%, black 66.66% 66.66%, transparent 66.66% 70%, black 70% 70%, transparent 70% 73.33%, black 73.33% 73.33%, transparent 73.33% 76.66%, black 76.66% 76.66%, transparent 76.66% 80%, black 80% 80%, transparent 80% 83.33%, black 83.33% 83.33%, transparent 83.33% 86.66%, black 86.66% 86.66%, transparent 86.66% 90%, black 90% 90%, transparent 90% 93.33%, black 93.33% 93.33%, transparent 93.33% 96.66%, black 96.66% 96.66%, transparent 96.66% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 3.33%, transparent 3.33% 3.33%, black 3.33% 6.66%, transparent 6.66% 6.66%, black 6.66% 10%, transparent 10% 10%, black 10% 13.33%, transparent 13.33% 13.33%, black 13.33% 16.66%, transparent 16.66% 16.66%, black 16.66% 20%, transparent 20% 20%, black 20% 23.32%, transparent 23.32% 23.33%, black 23.33% 26.46%, transparent 26.46% 26.66%, black 26.66% 29.59%, transparent 29.59% 30%, black 30% 32.72%, transparent 32.72% 33.33%, black 33.33% 35.86%, transparent 35.86% 36.66%, black 36.66% 38.99%, transparent 38.99% 40%, black 40% 42.12%, transparent 42.12% 43.33%, black 43.33% 45.26%, transparent 45.26% 46.66%, black 46.66% 48.39%, transparent 48.39% 50%, black 50% 51.52%, transparent 51.52% 53.33%, black 53.33% 54.66%, transparent 54.66% 56.66%, black 56.66% 57.79%, transparent 57.79% 60%, black 60% 60.92%, transparent 60.92% 63.33%, black 63.33% 64.06%, transparent 64.06% 66.66%, black 66.66% 67.19%, transparent 67.19% 70%, black 70% 70.32%, transparent 70.32% 73.33%, black 73.33% 73.46%, transparent 73.46% 76.66%, black 76.66% 76.66%, transparent 76.66% 80%, black 80% 80%, transparent 80% 83.33%, black 83.33% 83.33%, transparent 83.33% 86.66%, black 86.66% 86.66%, transparent 86.66% 90%, black 90% 90%, transparent 90% 93.33%, black 93.33% 93.33%, transparent 93.33% 96.66%, black 96.66% 96.66%, transparent 96.66% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 3.33%, transparent 3.33% 3.33%, black 3.33% 6.66%, transparent 6.66% 6.66%, black 6.66% 10%, transparent 10% 10%, black 10% 13.33%, transparent 13.33% 13.33%, black 13.33% 16.66%, transparent 16.66% 16.66%, black 16.66% 20%, transparent 20% 20%, black 20% 23.33%, transparent 23.33% 23.33%, black 23.33% 26.66%, transparent 26.66% 26.66%, black 26.66% 30%, transparent 30% 30%, black 30% 33.33%, transparent 33.33% 33.33%, black 33.33% 36.66%, transparent 36.66% 36.66%, black 36.66% 40%, transparent 40% 40%, black 40% 43.33%, transparent 43.33% 43.33%, black 43.33% 46.66%, transparent 46.66% 46.66%, black 46.66% 49.92%, transparent 49.92% 50%, black 50% 53.06%, transparent 53.06% 53.33%, black 53.33% 56.19%, transparent 56.19% 56.66%, black 56.66% 59.32%, transparent 59.32% 60%, black 60% 62.46%, transparent 62.46% 63.33%, black 63.33% 65.59%, transparent 65.59% 66.66%, black 66.66% 68.72%, transparent 68.72% 70%, black 70% 71.86%, transparent 71.86% 73.33%, black 73.33% 74.99%, transparent 74.99% 76.66%, black 76.66% 78.12%, transparent 78.12% 80%, black 80% 81.26%, transparent 81.26% 83.33%, black 83.33% 84.39%, transparent 84.39% 86.66%, black 86.66% 87.52%, transparent 87.52% 90%, black 90% 90.66%, transparent 90.66% 93.33%, black 93.33% 93.79%, transparent 93.79% 96.66%, black 96.66% 96.92%, transparent 96.92% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 3.33%, transparent 3.33% 3.33%, black 3.33% 6.66%, transparent 6.66% 6.66%, black 6.66% 10%, transparent 10% 10%, black 10% 13.33%, transparent 13.33% 13.33%, black 13.33% 16.66%, transparent 16.66% 16.66%, black 16.66% 20%, transparent 20% 20%, black 20% 23.33%, transparent 23.33% 23.33%, black 23.33% 26.66%, transparent 26.66% 26.66%, black 26.66% 30%, transparent 30% 30%, black 30% 33.33%, transparent 33.33% 33.33%, black 33.33% 36.66%, transparent 36.66% 36.66%, black 36.66% 40%, transparent 40% 40%, black 40% 43.33%, transparent 43.33% 43.33%, black 43.33% 46.66%, transparent 46.66% 46.66%, black 46.66% 50%, transparent 50% 50%, black 50% 53.33%, transparent 53.33% 53.33%, black 53.33% 56.66%, transparent 56.66% 56.66%, black 56.66% 60%, transparent 60% 60%, black 60% 63.33%, transparent 63.33% 63.33%, black 63.33% 66.66%, transparent 66.66% 66.66%, black 66.66% 70%, transparent 70% 70%, black 70% 73.33%, transparent 73.33% 73.33%, black 73.33% 76.53%, transparent 76.53% 76.66%, black 76.66% 79.66%, transparent 79.66% 80%, black 80% 82.79%, transparent 82.79% 83.33%, black 83.33% 85.93%, transparent 85.93% 86.66%, black 86.66% 89.06%, transparent 89.06% 90%, black 90% 92.19%, transparent 92.19% 93.33%, black 93.33% 95.33%, transparent 95.33% 96.66%, black 96.66% 98.46%, transparent 98.46% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 3.33%, transparent 3.33% 3.33%, black 3.33% 6.66%, transparent 6.66% 6.66%, black 6.66% 10%, transparent 10% 10%, black 10% 13.33%, transparent 13.33% 13.33%, black 13.33% 16.66%, transparent 16.66% 16.66%, black 16.66% 20%, transparent 20% 20%, black 20% 23.33%, transparent 23.33% 23.33%, black 23.33% 26.66%, transparent 26.66% 26.66%, black 26.66% 30%, transparent 30% 30%, black 30% 33.33%, transparent 33.33% 33.33%, black 33.33% 36.66%, transparent 36.66% 36.66%, black 36.66% 40%, transparent 40% 40%, black 40% 43.33%, transparent 43.33% 43.33%, black 43.33% 46.66%, transparent 46.66% 46.66%, black 46.66% 50%, transparent 50% 50%, black 50% 53.33%, transparent 53.33% 53.33%, black 53.33% 56.66%, transparent 56.66% 56.66%, black 56.66% 60%, transparent 60% 60%, black 60% 63.33%, transparent 63.33% 63.33%, black 63.33% 66.66%, transparent 66.66% 66.66%, black 66.66% 70%, transparent 70% 70%, black 70% 73.33%, transparent 73.33% 73.33%, black 73.33% 76.66%, transparent 76.66% 76.66%, black 76.66% 80%, transparent 80% 80%, black 80% 83.33%, transparent 83.33% 83.33%, black 83.33% 86.66%, transparent 86.66% 86.66%, black 86.66% 90%, transparent 90% 90%, black 90% 93.33%, transparent 93.33% 93.33%, black 93.33% 96.66%, transparent 96.66% 96.66%, black 96.66% 100%, transparent 100% 100%)`,
      `linear-gradient(
        0deg,
        black 0% 3.33%, transparent 3.33% 3.33%, black 3.33% 6.66%, transparent 6.66% 6.66%, black 6.66% 10%, transparent 10% 10%, black 10% 13.33%, transparent 13.33% 13.33%, black 13.33% 16.66%, transparent 16.66% 16.66%, black 16.66% 20%, transparent 20% 20%, black 20% 23.33%, transparent 23.33% 23.33%, black 23.33% 26.66%, transparent 26.66% 26.66%, black 26.66% 30%, transparent 30% 30%, black 30% 33.33%, transparent 33.33% 33.33%, black 33.33% 36.66%, transparent 36.66% 36.66%, black 36.66% 40%, transparent 40% 40%, black 40% 43.33%, transparent 43.33% 43.33%, black 43.33% 46.66%, transparent 46.66% 46.66%, black 46.66% 50%, transparent 50% 50%, black 50% 53.33%, transparent 53.33% 53.33%, black 53.33% 56.66%, transparent 56.66% 56.66%, black 56.66% 60%, transparent 60% 60%, black 60% 63.33%, transparent 63.33% 63.33%, black 63.33% 66.66%, transparent 66.66% 66.66%, black 66.66% 70%, transparent 70% 70%, black 70% 73.33%, transparent 73.33% 73.33%, black 73.33% 76.66%, transparent 76.66% 76.66%, black 76.66% 80%, transparent 80% 80%, black 80% 83.33%, transparent 83.33% 83.33%, black 83.33% 86.66%, transparent 86.66% 86.66%, black 86.66% 90%, transparent 90% 90%, black 90% 93.33%, transparent 93.33% 93.33%, black 93.33% 96.66%, transparent 96.66% 96.66%, black 96.66% 100%, transparent 100% 100%)`,
    ];

    const ctx = gsap.context(() => {
      // Split titles/descriptions into visual lines (SplitText replacement).
      const splitAll = (): void => {
        splitCleanupsRef.current.forEach((s) => s.revert());
        splitCleanupsRef.current = [];

        for (const el of titleEls) {
          splitCleanupsRef.current.push(
            splitElementIntoLines(el, {
              lineMaskClassName: "pss-lineMask",
              lineClassName: "pss-lines",
            })
          );
        }
        for (const el of descEls) {
          splitCleanupsRef.current.push(
            splitElementIntoLines(el, {
              lineMaskClassName: "pss-lineMask",
              lineClassName: "pss-lines",
            })
          );
        }

        const firstTitleLines =
          titleEls[0]?.querySelectorAll<HTMLElement>(".pss-lines");
        const firstDescLines = descEls[0]?.querySelectorAll<HTMLElement>(".pss-lines");
        if (firstTitleLines) gsap.set(firstTitleLines, { y: 0 });
        if (firstDescLines) gsap.set(firstDescLines, { y: 0 });
      };

      splitAll();

      const animateProgress = (newVal: number, oldVal: number): void => {
        const forward = newVal > oldVal;

        const oldTitleLines = titleEls[oldVal]?.querySelectorAll<HTMLElement>(
          ".pss-lines"
        );
        const newTitleLines = titleEls[newVal]?.querySelectorAll<HTMLElement>(
          ".pss-lines"
        );
        const oldDescLines = descEls[oldVal]?.querySelectorAll<HTMLElement>(
          ".pss-lines"
        );
        const newDescLines = descEls[newVal]?.querySelectorAll<HTMLElement>(
          ".pss-lines"
        );

        if (oldTitleLines) {
          gsap.to(oldTitleLines, {
            y: forward ? "-150%" : "150%",
            stagger: 0,
            ease: "expo.out",
            duration: 1.25,
            overwrite: true,
          });
        }
        if (newTitleLines) {
          gsap.to(newTitleLines, {
            y: 0,
            delay: 0.3,
            duration: 1,
            ease: "expo.out",
            overwrite: true,
            stagger: {
              each: forward ? 0.15 : 0.1,
              from: forward ? "start" : "end",
            },
          });
        }

        if (oldDescLines) {
          gsap.to(oldDescLines, {
            y: forward ? "-150%" : "150%",
            stagger: 0,
            ease: "expo.out",
            duration: 1.25,
            overwrite: true,
          });
        }
        if (newDescLines) {
          gsap.to(newDescLines, {
            y: 0,
            delay: 0.3,
            duration: 1,
            ease: "expo.out",
            overwrite: true,
            stagger: {
              each: forward ? 0.1 : 0.05,
              from: forward ? "start" : "end",
            },
          });
        }
      };

      const setProgress = (next: number): void => {
        const prev = progressRef.current;
        if (next === prev) return;
        progressRef.current = next;
        animateProgress(next, prev);
      };

      const backgroundImages = bgImages.slice(1); // not(:first-child)
      const posterRevealImages = posterImages.slice(1); // not(:first-child)

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "center center",
          end: `+=${(totalImage - 1) * 100}%`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
        defaults: {
          ease: "none",
        },
      });

      timelineRef.current = timeline;

      gsap.from(poster, {
        yPercent: 200,
        ease: "power4.out",
        willChange: "transform",
        duration: 1.6,
        scrollTrigger: {
          trigger: wrapper,
          start: "top center",
        },
      });

      // CTA starts hidden and becomes visible only near the end, scrubbed with the timeline.
      gsap.set(cta, { autoAlpha: 0, y: 20, pointerEvents: "none" });

      for (let index = 0; index < totalImage - 1; index += 1) {
        const bg = backgroundImages[index];
        const posterImg = posterRevealImages[index];
        if (!bg || !posterImg) continue;

        for (const mask of maskArray) {
          timeline.to(bg, {
            "--mask-image": mask,
            duration: 1,
          });
        }

        timeline.to(
          bg,
          {
            transform: "scale(1)",
            duration: (maskArray.length - 1) * 1,
          },
          "-=100%"
        );

        timeline.fromTo(
          posterImg,
          { "--mask-clip-path": "inset(100% 0 0 0)" },
          {
            "--mask-clip-path": "inset(0% 0 0 0)",
            transform: "scale(1.1)",
            duration: (maskArray.length - 1) * 1,
          },
          "-=100%"
        );

        timeline.to(
          bg,
          {
            onStart: () => {
              setProgress(progressRef.current + 1);
            },
            onReverseComplete: () => {
              setProgress(progressRef.current - 1);
            },
            duration: 0.1,
          },
          `-=${((maskArray.length - 1) * 1) / 2}`
        );
      }

      // Scrubbed CTA reveal once the last product is reached.
      timeline.to(cta, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        onStart: () => {
          cta.style.pointerEvents = "auto";
        },
        onReverseComplete: () => {
          cta.style.pointerEvents = "none";
        },
      });

      // Parallax-ish transforms for first and last background image (matches original).
      const firstBg = bgImages[0];
      if (firstBg) {
        gsap.fromTo(
          firstBg,
          {
            yPercent: -30,
            transform: "scale(1.1)",
          },
          {
            yPercent: 0,
            transform: "scale(1)",
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: "center center",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      const lastBg = bgImages[bgImages.length - 1];
      const st = timeline.scrollTrigger;
      const pinSpacer = st && "spacer" in st ? (st.spacer as Element | null) : null;

      if (lastBg) {
        gsap.fromTo(
          lastBg,
          {
            yPercent: 0,
          },
          {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
              trigger: pinSpacer ?? wrapper,
              start: `100% bottom`,
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      // Re-split on ScrollTrigger refresh so line breaks stay correct.
      ScrollTrigger.addEventListener("refreshInit", splitAll);
      // Remove listener on revert via ctx cleanup.
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", splitAll);
      };
    }, wrapper);

    return () => {
      ctx.revert();
      timelineRef.current = null;
      splitCleanupsRef.current.forEach((s) => s.revert());
      splitCleanupsRef.current = [];
    };
  }, [slides]);

  const initialMask =
    "linear-gradient(0deg, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%,#000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%,#000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%, #000 0% 0%, transparent 0% 0%)";

  return (
    <section className="pss-root">
      <section
        ref={(el) => {
          scrollingWrapperRef.current = el;
        }}
        className="pss-scrollingWrapper"
      >
        {/* If no real products are available yet, render nothing to avoid mismatched refs/animations. */}
        {slides.length === 0 ? null : (
          <>
        <div className="pss-bg">
          <div className="pss-bgWrapper">
            {slides.map((slide, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={slide.id}
                  ref={(el) => {
                    bgImageRefs.current[index] = el;
                  }}
                  className={`pss-bgImage ${!isFirst ? "pss-bgImageNotFirst" : ""}`}
                  style={
                    !isFirst
                      ? cssVars({ "--mask-image": initialMask })
                      : undefined
                  }
                >
                  <img src={slide.imageUrl} alt="" />
                </div>
              );
            })}
          </div>
        </div>


        <div
          ref={(el) => {
            posterRef.current = el;
          }}
          className="pss-poster"
        >
          <div className="pss-titleWrapper">
            {slides.map((slide, index) => (
              <h3
                key={slide.id}
                ref={(el) => {
                  titleRefs.current[index] = el;
                }}
                className="pss-title"
              >
                {slide.title}
              </h3>
            ))}
          </div>

          <div className="pss-imageWrapper">
            <div className="pss-imageInner">
              {slides.map((slide, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={slide.id}
                    ref={(el) => {
                      posterImageRefs.current[index] = el;
                    }}
                    className={`pss-posterImage ${
                      !isFirst ? "pss-posterImageNotFirst" : ""
                    }`}
                    style={
                      !isFirst
                        ? cssVars({
                            "--mask-clip-path": "inset(100% 0 0 0)",
                          })
                        : undefined
                    }
                  >
                    <img src={slide.imageUrl} alt="" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pss-descWrapper">
            {slides.map((slide, index) => (
              <p
                key={slide.id}
                ref={(el) => {
                  descRefs.current[index] = el;
                }}
                className="pss-desc"
              >
                {slide.desc}
              </p>
            ))}
          </div>
        </div>

        {/* CTA: appears on the final product only (scrubbed via timeline). */}
        <div
          ref={(el) => {
            ctaRef.current = el;
          }}
          className="pss-cta"
        >
          <Link to="/products" className="pss-ctaLink">
            View all products
          </Link>
        </div>
          </>
        )}
      </section>
    </section>
  );
};

export default ProductsShowcaseSection;
