import { MapPinIcon as MapPin, PhoneIcon as Phone, EnvelopeIcon as Mail } from '@heroicons/react/24/solid';
import { TDK_LOGO_URL } from '@/lib/branding';

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-700 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <img src={TDK_LOGO_URL} alt="The Dirty Kitchen Pickleball Court" className="h-16 w-auto" />
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Two Indoor Courts for Games, Trainings, and Events. Experience the best game in town.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-primary uppercase tracking-widest">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-600">Juna Subdivision, Matina, Davao City</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-600">+63 917 123 4567</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-600">hello@thedirtykitchen.com</span>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-primary uppercase tracking-widest">Follow Us</h3>
          <p className="text-sm text-slate-500">Stay updated with our latest news and events.</p>
          <div className="flex flex-col gap-4">
            <a
              href="#"
              className="group flex items-center gap-3 text-slate-600 hover:text-primary transition-colors duration-300 w-fit"
            >
              <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                </svg>
              </div>
              <span className="font-medium text-sm">The Dirty Kitchen - Pickleball Court</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container mx-auto px-4 md:px-6 max-w-7xl mt-12 pt-6 border-t border-slate-200 text-sm text-slate-400 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <p>
          &copy; {new Date().getFullYear()} The Dirty Kitchen Pickleball Court. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
