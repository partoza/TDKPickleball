import { Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-700 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <img src="/assets/images/tdk-logo.png" alt="The Dirty Kitchen Logo" className="h-16 w-auto" />
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Two Indoor Courts for Games, Trainings, and Events. Experience the best game in town.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 fill-primary/10" />
              <span className="text-slate-600">Juna Subdivision, Matina, Davao City</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0 fill-primary/10" />
              <span className="text-slate-600">+63 917 123 4567</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0 fill-primary/10" />
              <span className="text-slate-600">hello@thedirtykitchen.com</span>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Follow Us</h3>
          <p className="text-sm text-slate-500">Stay updated with our latest news and events.</p>
          <div className="flex gap-3">
            <a
              href="#"
              className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Facebook className="h-5 w-5 text-white fill-white" />
            </a>
            <a
              href="#"
              className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Instagram className="h-5 w-5 text-white fill-white" />
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
