import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <section 
        className="relative flex-1 flex flex-col justify-center items-center overflow-hidden bg-cover bg-center py-20"
        style={{ backgroundImage: 'url("/assets/images/contact-image.png")' }}
      >
        {/* White Overlay */}
        <div className="absolute inset-0 bg-white/70 z-0 border-b border-primary/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent z-0"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 w-full max-w-6xl text-center flex flex-col items-center">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-4 drop-shadow-sm">Contact Us</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary drop-shadow-sm">Let’s get you on court.</h1>
            <p className="mt-6 text-lg md:text-xl text-black leading-relaxed">
              Questions about a booking, training, or court availability? Reach The Dirty Kitchen team directly on Facebook.
            </p>
          </div>
          
          <div className="mb-10 max-w-2xl w-full hover:-translate-y-1 transition-transform duration-300 drop-shadow-2xl">
            <a 
              href="https://www.facebook.com/profile.php?id=61592414877242" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <img 
                src="/assets/images/facebook.png" 
                alt="The Dirty Kitchen Facebook Page" 
                className="w-full h-auto rounded-xl object-cover ring-1 ring-black/5"
              />
            </a>
          </div>

          <Button 
            asChild
            size="lg"
            className="h-14 md:h-16 px-8 md:px-10 text-base md:text-xl font-bold rounded-full shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <a 
              href="https://www.facebook.com/profile.php?id=61592414877242" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 md:h-11 md:w-11 mr-3 md:mr-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
              </svg>
              Message us on Facebook
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
