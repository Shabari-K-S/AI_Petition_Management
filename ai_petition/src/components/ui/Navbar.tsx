import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Navbar = () => {
  const {user} = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };


    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  console.log(user);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
      isScrolled 
        ? 'bg-white/80 dark:bg-background-200/80 backdrop-blur-md shadow-sm' 
        : 'bg-transparent dark:bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-primary-100 dark:text-accent-100" />
          <span className="font-medium text-xl text-black dark:text-text-100">AI Petition Manager</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors">
            Features
          </a>
          <a href="#testimonials" className="text-gray-600 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors">
            Testimonials
          </a>
          {
            !user ? (
              <Button
                onClick={() => navigate('/login')} 
                className="bg-primary-100 hover:bg-primary-200 dark:bg-accent-100 dark:hover:bg-accent-200 text-white"
              >
                Sign In
              </Button>
            ):(
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="bg-primary-100 hover:bg-primary-200 dark:bg-accent-100 dark:hover:bg-accent-200 text-white"
              >
                Goto Dashboard
              </Button>
            )
          }
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700 dark:text-text-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-black dark:text-text-100" />
          ) : (
            <Menu className="h-6 w-6 text-black dark:text-text-100" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-background-200 shadow-lg p-4 animate-slide-in-right">
          <nav className="flex flex-col space-y-4">
            <a 
              href="#features" 
              className="text-gray-600 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#testimonials" 
              className="text-gray-600 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            {
              !user ? ( 
              <Button
                onClick={() => {navigate('/login'); setIsMobileMenuOpen(false)}} 
                className="bg-primary-100 hover:bg-primary-200 dark:bg-accent-100 dark:hover:bg-accent-200 text-white"
              >
                Sign In
              </Button>
              ):(
                <Button 
                  onClick={() => {navigate('/dashboard'); setIsMobileMenuOpen(false)}} 
                  className="bg-primary-100 hover:bg-primary-200 dark:bg-accent-100 dark:hover:bg-accent-200 text-white"
                >
                  Goto Dashboard
                </Button>
              )
            }
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;