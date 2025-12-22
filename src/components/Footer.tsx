import { Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-new.png";

const Footer = () => {
  return (
    <footer className="py-20 bg-footer text-footer-text border-t border-footer-muted/30 relative overflow-hidden">
      {/* Clay grain texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='clay'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23clay)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'soft-light'
        }}
      />
      <div className="container px-8 md:px-12 lg:px-16">
        <div className="grid md:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <Link to="/">
              <img src={logo} alt="Basho by Shivangi" className="h-14 w-auto brightness-0 invert opacity-90" />
            </Link>
            <p className="font-sans text-sm text-footer-text/70 max-w-sm leading-relaxed">
              Handcrafted Japanese-inspired pottery. Each piece tells a story of earth, fire, and wabi-sabi.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/bashobyyshivangi/" target="_blank" rel="noopener noreferrer"
                className="text-footer-muted hover:text-footer-text transition-colors duration-300">
                <Instagram size={18} />
              </a>
              <a href="mailto:hello@basho.in" className="text-footer-muted hover:text-footer-text transition-colors duration-300">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-footer-muted mb-6">Explore</h4>
            <ul className="space-y-3">
              {[
                { name: "Products", path: "/products" },
                { name: "Workshops", path: "/workshops" },
                { name: "Studio", path: "/studio" },
                { name: "Gallery", path: "/media" },
                { name: "About", path: "/about" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="font-sans text-sm text-footer-text/70 hover:text-footer-text transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business & Visit */}
          <div className="space-y-8">
            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-footer-muted mb-4">Business</h4>
              <Link 
                to="/corporate" 
                className="font-sans text-sm text-footer-text/70 hover:text-footer-text transition-colors duration-300"
              >
                Corporate & Collaborations
              </Link>
            </div>
            <div>
              <h4 className="text-xs tracking-[0.2em] uppercase text-footer-muted mb-4">Visit</h4>
              <div className="space-y-2 font-sans text-sm text-footer-text/70">
                <p>Piplod, Surat, Gujarat</p>
                <p>Tue - Sun: 10am - 6pm</p>
                <p className="text-warm-rust text-xs tracking-wider uppercase pt-2">By Appointment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-footer-muted/30 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-footer-text/60">
            © {new Date().getFullYear()} Basho by Shivangi
          </p>
          <div className="flex gap-6">
            <span className="font-sans text-xs text-footer-text/60 hover:text-footer-text cursor-pointer transition-colors">Privacy Policy</span>
            <span className="font-sans text-xs text-footer-text/60 hover:text-footer-text cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
