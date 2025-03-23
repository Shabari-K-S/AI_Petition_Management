import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white dark:bg-background-100">
      {/* Background Elements */}
      <div className="blurry-gradient top-20 left-1/4"></div>
      <div className="blurry-gradient-2 bottom-20 right-1/4"></div>
      
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center">
          {/* Left Column - Text Content */}
          <div className="w-full lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
            <ScrollReveal>
              <span className="inline-block px-4 py-1.5 mb-5 text-xs rounded-full bg-primary-300 text-primary-100 dark:bg-background-300 dark:text-accent-100 font-medium uppercase tracking-wider">
                Official Government Portal
              </span>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-black dark:text-text-100">
                Public <span className="text-primary-100 dark:text-accent-100">Grievance</span> Resolution Portal
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={400}>
              <p className="text-gray-600 dark:text-text-200 text-lg mb-8 max-w-lg">
                AI Petition Manager - A free initiative by college students to ensure swift resolution of citizen grievances. Submit, track, and resolve your concerns through our official digital platform.
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={600}>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <a href='/grievance/new' className="bg-primary-100 hover:bg-primary-200 dark:bg-accent-100 dark:hover:bg-accent-200 text-white px-6 py-4 text-base rounded-lg flex flex-row items-center justify-center">
                  Submit Grievance
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a 
                  href='/chatbot'
                  className="border-primary-200 dark:border-background-300 text-primary-100 dark:text-accent-100 hover:bg-primary-300 dark:hover:bg-background-300 px-10 py-4 text-base border rounded-lg"
                >
                  Chatbot
                </a>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={800}>
              <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-500 dark:text-text-200">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary-100 dark:text-accent-100 mr-2" />
                  <span>100% Free Service</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary-100 dark:text-accent-100 mr-2" />
                  <span>Secure & Verified</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
          
          {/* Right Column - Image/Visual */}
          <div className="w-full lg:w-1/2">
            <ScrollReveal animation="fade-in-right">
              <div className="relative">
                <div className="relative z-10 bg-white dark:bg-background-200 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-background-300">
                  <img 
                    src="https://images.unsplash.com/photo-1527576539890-dfa815648363?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Government Grievance Management System" 
                    className="w-full max-h-[80vh] object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary-300 dark:bg-background-300 rounded-lg z-0"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gray-100 dark:bg-background-200 rounded-lg z-0"></div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;