import { Link } from "react-router-dom";
import { MapPin, Phone, Lock, Clock } from "lucide-react";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 mb-4 group cursor-pointer inline-flex">
              <div className="w-10 h-10 relative rounded-full overflow-hidden border border-primary/20 bg-stone-900 flex items-center justify-center">
                <img src="/images/logo.png" alt="Gole Khaja Ghar Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-black group-hover:text-primary transition-colors">
                Gole Khaja Ghar
              </span>
            </Link>
            <p className="text-stone-600 max-w-sm mb-6 leading-relaxed">
              Authentic Nepalese Restaurant & Khaja Ghar. Taste real traditional flavors! Freshly prepared Khaja sets, momos, chowmein, and local delicacies.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://www.facebook.com/raju.tamang.59406"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#1877F2] transition-colors p-1"
                title="Facebook"
              >
                <span className="sr-only">Facebook</span>
                <FacebookIcon className="w-6 h-6" />
              </a>
              <a
                href="https://wa.me/9779846011810"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#25D366] transition-colors p-1"
                title="WhatsApp"
              >
                <span className="sr-only">WhatsApp</span>
                <WhatsAppIcon className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-black mb-4 uppercase tracking-wider text-sm">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-stone-600 hover:text-primary transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-stone-600 hover:text-primary transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-stone-600 hover:text-primary transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-stone-600 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-stone-600 hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-black mb-4 uppercase tracking-wider text-sm">Contact & Hours</h3>
            <ul className="space-y-4 text-stone-600 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Sisuwa, Pokhara-29,<br />
                  Kaski, Nepal
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+9779804146136" className="hover:text-primary transition-colors font-bold">+977 9804146136</a>
                  <a href="tel:+9779846011810" className="hover:text-primary transition-colors font-bold">+977 984-6011810</a>
                </div>
              </li>
              <li className="flex items-start gap-3 border-t border-stone-100 pt-3 mt-3 text-stone-500">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-stone-800 font-bold">8:00 AM – 9:00 PM</p>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold leading-tight">
                    Closed 1st Tuesday of every month
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} Gole Khaja Ghar. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-black transition-colors">Terms & Conditions</Link>
            <Link to="/admin" className="hover:text-primary transition-colors text-stone-400" title="Admin Login">
              <Lock className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
