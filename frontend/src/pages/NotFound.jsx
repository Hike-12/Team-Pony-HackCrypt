import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import PixelBlast from '@/components/ui/PixelBlast'

const getTheme = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

const NotFound = () => {
  const [theme, setTheme] = React.useState(getTheme());

  React.useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
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
      
      {/* <Navbar /> */}
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center space-y-8">
            {/* Large 404 Display */}
            <div className="space-y-4">
              <div className="relative h-32 flex items-center justify-center">
                <div className="text-9xl font-bold text-primary/20 absolute blur-sm">404</div>
                <div className="text-7xl md:text-8xl font-black bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60 relative z-10">
                  404
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Page Not Found
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Oops! It looks like you've wandered into uncharted territory. The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Decorative Element */}
            <div className="py-8">
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Error Details */}
            <div className="bg-card border rounded-xl p-6 md:p-8 text-left max-w-2xl mx-auto">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-destructive">⚠</span>
                What happened?
              </h2>
              <ul className="space-y-3 text-muted-foreground text-sm md:text-base">
                <li className="flex gap-3">
                  <span className="text-primary">→</span>
                  <span>The URL you're trying to access doesn't match any available routes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">→</span>
                  <span>The page may have been moved or removed from our system</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">→</span>
                  <span>You might have a typo in the URL address</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <Home className="size-4" />
                  <span>Back to Home</span>
                </Link>
              </Button>
              
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => window.history.back()}
              >
                <button>
                  <ArrowLeft className="size-4" />
                  <span>Go Back</span>
                </button>
              </Button>
            </div>

            {/* Additional Help */}
            <div className="pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Contact{' '}
                <a href="mailto:support@hackcrypt.com" className="text-primary hover:underline font-medium">
                  our support team
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

export default NotFound
