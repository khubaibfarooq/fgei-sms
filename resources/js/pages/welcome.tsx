import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export default function Welcome() {
  const { auth } = usePage<SharedData>().props;

  return (
    <>
      <Head title="Welcome" />
      <div style={{
        backgroundImage: 'url("/images/fgei banner.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'overlay',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Optional: dark overlay for readability
      }} className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-background to-gray-50 dark:to-gray-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl text-center space-y-8 z-10">
          {/* Header section */}
          <div className="space-y-5">
            <h1 className="text-5xl text-white font-bold tracking-tight bg-clip-text bg-gradient-to-r from-primary to-primary/80">
              FGEI School Management System
            </h1>
            <p className="text-lg text-white max-w-2xl mx-auto">
              The primary mandate of the FGEI (C/G) Directorate is to provide quality education to the children of Pakistan Armed Forces personnel and civilian children living in cantonments. The directorate exerts administrative, academic, technical, and financial oversight over all its affiliated educational institutions
            </p>
          </div>

          {/* CTA section */}
          {auth.user ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="https://hrms.fgei.gov.pk/login"
                className="px-8 py-3 rounded-lg border border-border bg-white dark:bg-gray-800 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                Sign In
              </a>

            </div>
          )}


        </div>
      </div>
    </>
  );
}