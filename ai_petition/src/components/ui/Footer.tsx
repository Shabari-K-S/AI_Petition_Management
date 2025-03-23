import { Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="bg-white dark:bg-background-200 border-t-2 border-gray-200 dark:border-background-300 py-6">
      <div className="container mx-auto flex flex-col items-center space-y-4">
        <p className="text-gray-600 dark:text-text-200 text-center">
          AI Petition Manager - Streamlining petition management with AI-powered tools.
        </p>
        <div className="flex space-x-6">
          <a 
            href="#" 
            className="text-gray-400 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors"
          >
            <Twitter className="h-6 w-6" />
          </a>
          <a 
            href="#" 
            className="text-gray-400 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors"
          >
            <Facebook className="h-6 w-6" />
          </a>
          <a 
            href="#" 
            className="text-gray-400 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors"
          >
            <Linkedin className="h-6 w-6" />
          </a>
          <a 
            href="#" 
            className="text-gray-400 dark:text-text-200 hover:text-primary-100 dark:hover:text-accent-100 transition-colors"
          >
            <Instagram className="h-6 w-6" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;