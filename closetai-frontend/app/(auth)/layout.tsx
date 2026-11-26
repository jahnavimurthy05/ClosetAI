export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#252525] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="font-serif text-6xl font-light text-white tracking-widest uppercase">
              Closet
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="h-px flex-1 bg-[#A99B8C]" />
              <span className="text-[#A99B8C] text-sm tracking-[0.4em] uppercase font-light">
                AI
              </span>
              <div className="h-px flex-1 bg-[#A99B8C]" />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-white/60 text-lg font-light tracking-wide leading-relaxed">
            Your personal fashion stylist,
            <br />
            available 24/7
          </p>

          {/* Feature bullets */}
          <div className="mt-12 space-y-4 text-left">
            {[
              'Smart wardrobe cataloguing with AI',
              'Personalised outfit recommendations',
              'Weather-aware styling advice',
              'Calendar-based outfit planning',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D9B7B0] flex-shrink-0" />
                <span className="text-white/50 text-sm font-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form Area */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F6F2] p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-serif text-4xl font-light text-[#252525] tracking-widest uppercase">
              ClosetAI
            </h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
