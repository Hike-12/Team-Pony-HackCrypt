import React, { useEffect, useState } from 'react'
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import PixelBlast from '@/components/ui/PixelBlast';

const getTheme = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

const Landing = () => {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <PixelBlast
          variant="square"
          pixelSize={3}
          color={theme === 'dark' ? '#333333' : '#cccccc'} 
          patternScale={2}
          patternDensity={1}
          liquid={false}
          enableRipples={true}
          edgeFade={0.5}
          style={{ width: '100vw', height: '100vh' }}
        />
      </div>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

export default Landing