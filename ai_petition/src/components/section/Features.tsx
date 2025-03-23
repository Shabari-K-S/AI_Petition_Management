import { FileText, ChartBar, Search, UserCheck, Clock, ShieldCheck } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: FileText,
    title: 'Petition Management',
    description: 'Organize and track all your petitions in one centralized dashboard with powerful filtering options.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50'
  },
  {
    icon: ChartBar,
    title: 'Analytics & Insights',
    description: 'Get detailed analytics and actionable insights to understand petition performance and impact.',
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    icon: Search,
    title: 'AI-Powered Search',
    description: 'Find any petition instantly with our advanced AI search that understands context and intent.',
    color: 'text-petition-400',
    bg: 'bg-petition-100'
  },
  {
    icon: UserCheck,
    title: 'Signature Verification',
    description: 'Automatically verify signatures and detect duplicates to ensure petition integrity.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  },
  {
    icon: Clock,
    title: 'Automated Workflows',
    description: 'Set up custom workflows to automate repetitive tasks and save valuable time.',
    color: 'text-rose-500',
    bg: 'bg-rose-50'
  },
  {
    icon: ShieldCheck,
    title: 'Security & Compliance',
    description: 'Rest easy with enterprise-grade security and full compliance with privacy regulations.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-background-100">
      <div className="container px-4 mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 mb-5 text-xs rounded-full bg-primary-300 text-primary-100 dark:bg-background-300 dark:text-accent-100 font-medium uppercase tracking-wider">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black dark:text-text-100">
              Everything you need to manage petitions effectively
            </h2>
            <p className="text-gray-600 dark:text-text-200 text-lg">
              Our AI-powered platform streamlines every aspect of petition management, from creation to analysis.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100} className="h-full">
              <div className="glass-card h-full rounded-xl p-8 card-hover bg-white dark:bg-background-200 shadow-sm dark:shadow-none">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5", feature.bg)}>
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black dark:text-text-100">{feature.title}</h3>
                <p className="text-gray-600 dark:text-text-200">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;