import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bg1 from "../../assets/bg1.png";
import bg2 from "../../assets/bg2.png";
import bg3 from "../../assets/bg3.png";
import bg4 from "../../assets/bg4.png";
import bg5 from "../../assets/bg5.png";

gsap.registerPlugin(ScrollTrigger);

const heroImages = [
  {
    src: bg1,
    alt: "Raw clay texture close-up",
    caption: "Clay",
    japanese: "土",
    meaning: "Tsuchi — Earth / Clay"
  },
  {
    src: bg2,
    alt: "Hands shaping clay on pottery wheel",
    caption: "Movement",
    japanese: "練",
    meaning: "Neru — To Knead & Flow"
  },
  {
    src: bg3,
    alt: "Ceramic surface texture",
    caption: "FORM",
    japanese: "形",
    meaning: "Katachi — Shape / Form"
  },
  {
    src: bg4,
    alt: "Kiln firing or heated ceramic",
    caption: "Transformation",
    japanese: "火",
    meaning: "Hi — The Alchemy of Fire"
  },
  {
    src: bg5,
    alt: "Finished ceramic tableware",
    caption: "Stillness",
    japanese: "禅",
    meaning: "Zen — Balance, harmony, completio"
  }
];

export function HeroScrollZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const images = imagesRef.current.filter(Boolean);
      const totalImages = images.length;
      
      images.forEach((imageWrapper, index) => {
        if (!imageWrapper) return;
        
        const image = imageWrapper.querySelector(".hero-image");
        const overlay = imageWrapper.querySelector(".hero-overlay");
        const captionGroup = imageWrapper.querySelector(".caption-group");
        const japanese = imageWrapper.querySelector(".hero-japanese");
        const verticalText = imageWrapper.querySelectorAll(".vertical-text");
        
        gsap.set(imageWrapper, { 
          opacity: index === 0 ? 1 : 0, 
          zIndex: totalImages - index 
        });
        gsap.set(image, { scale: 1 });
        
        const segmentSize = 100 / totalImages;
        const startPercent = index * segmentSize;
        const endPercent = (index + 1) * segmentSize;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: `${startPercent}% top`,
            end: `${endPercent}% top`,
            scrub: 0.8,
          }
        });
        
        tl.to(image, {
          scale: 2.5,
          ease: "none",
          duration: 1,
        }, 0);
        
        tl.to(overlay, {
          opacity: 0.85,
          ease: "none",
          duration: 1,
        }, 0);
        
        tl.to(japanese, {
          opacity: 0,
          scale: 1.5,
          ease: "power2.in",
          duration: 0.4,
        }, 0.3);
        
        tl.to(captionGroup, {
          opacity: 0,
          y: -60,
          filter: "blur(10px)",
          ease: "power2.in",
          duration: 0.4,
        }, 0.35);
        
        tl.to(verticalText, {
          opacity: 0,
          ease: "power2.in",
          duration: 0.3,
        }, 0.3);
        
        if (index < totalImages - 1) {
          tl.to(imageWrapper, {
            opacity: 0,
            ease: "power2.inOut",
            duration: 0.3,
          }, 0.7);
          
          const nextWrapper = images[index + 1];
          if (nextWrapper) {
            const nextImage = nextWrapper.querySelector(".hero-image");
            const nextCaptionGroup = nextWrapper.querySelector(".caption-group");
            const nextJapanese = nextWrapper.querySelector(".hero-japanese");
            const nextVerticalText = nextWrapper.querySelectorAll(".vertical-text");
            
            gsap.set(nextCaptionGroup, { opacity: 0, y: 60, filter: "blur(10px)" });
            gsap.set(nextJapanese, { opacity: 0, scale: 0.8 });
            gsap.set(nextVerticalText, { opacity: 0 });
            gsap.set(nextImage, { scale: 1 });
            
            tl.to(nextWrapper, {
              opacity: 1,
              ease: "power2.inOut",
              duration: 0.3,
            }, 0.7);
            
            tl.to(nextJapanese, {
              opacity: 1,
              scale: 1,
              ease: "power2.out",
              duration: 0.3,
            }, 0.8);
            
            tl.to(nextCaptionGroup, {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              ease: "power2.out",
              duration: 0.3,
            }, 0.85);
            
            tl.to(nextVerticalText, {
              opacity: 1,
              ease: "power2.out",
              duration: 0.2,
            }, 0.9);
          }
        }
      });
      
      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "90% top",
          end: "100% top",
          scrub: 0.8,
        }
      })
      .fromTo(textRef.current, {
        opacity: 0,
        y: 80,
        scale: 0.95,
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power3.out",
      });
      
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative h-[600vh] bg-charcoal">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.035]" 
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} 
        />
        
        {heroImages.map((img, index) => (
          <div
            key={index}
            ref={(el) => { imagesRef.current[index] = el; }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <div className="hero-image absolute inset-0 will-change-transform origin-center">
              <img
                src={img.src}
                alt={img.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
            
            <div className="hero-overlay absolute inset-0 bg-charcoal/20" />
            
            <div className="hero-japanese absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[40vw] md:text-[30vw] font-serif text-cream/[0.20] select-none leading-none">
                {img.japanese}
              </span>
            </div>
            
            <div className="caption-group relative z-10 flex flex-col items-center text-center">
              <h2 className="text-cream text-5xl md:text-7xl lg:text-8xl tracking-[0.3em] uppercase font-extralight mb-4">
                {img.caption}
              </h2>
              <div className="flex items-center gap-6">
                <div className="w-16 h-px bg-cream/40" />
                <p className="text-cream/70 text-base md:text-xl tracking-[0.25em] font-light">
                  {img.meaning}
                </p>
                <div className="w-16 h-px bg-cream/40" />
              </div>
            </div>

            <div className="vertical-text absolute left-8 md:left-16 top-1/2 -translate-y-1/2 z-20 hidden md:block">
              <span className="[writing-mode:vertical-rl] text-cream/40 text-xs tracking-[0.4em] uppercase font-light">
                Basho — {img.japanese}
              </span>
            </div>

            <div className="vertical-text absolute right-8 md:right-16 top-1/2 -translate-y-1/2 z-20 hidden md:block">
              <span className="[writing-mode:vertical-rl] text-cream/40 text-xs tracking-[0.4em] uppercase font-light">
                手作り陶器
              </span>
            </div>
            
            <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
              <span className="text-cream/50 text-xs tracking-[0.3em] font-medium">0{index + 1}</span>
              <div className="w-32 h-[2px] bg-cream/10 relative overflow-hidden rounded-full">
                <div 
                  className="absolute inset-y-0 left-0 bg-cream/50 rounded-full transition-all duration-700" 
                  style={{ width: `${((index + 1) / heroImages.length) * 100}%` }}
                />
              </div>
              <span className="text-cream/50 text-xs tracking-[0.3em] font-medium">0{heroImages.length}</span>
            </div>
          </div>
        ))}
        
        <div
          ref={textRef}
          className="absolute inset-0 flex flex-col items-center justify-center z-[60] pointer-events-none opacity-0 bg-charcoal/90"
        >
          <div className="text-center px-6">
            <p className="text-cream/50 text-sm md:text-base tracking-[1em] uppercase mb-8 font-light">
              手作りの陶器
            </p>
            <h1 className="text-cream text-6xl md:text-8xl lg:text-[12rem] font-extralight tracking-tight mb-4 leading-[0.85]">
              Basho
            </h1>
            <p className="text-cream/80 text-2xl md:text-4xl tracking-[0.5em] font-extralight mb-16">
              by Shivangi
            </p>
            
            <div className="flex flex-col items-center gap-8">
              <div className="w-px h-24 bg-gradient-to-b from-cream/50 to-transparent" />
              <p className="text-cream/50 text-lg md:text-2xl max-w-2xl font-extralight leading-relaxed tracking-wide">
                Where the clay meets the hand, a poem begins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}