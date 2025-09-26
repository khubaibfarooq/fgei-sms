import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';

export default function Error403() {
  return (
    <>
      <Head title="403 - Access denied" />
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-bold text-red-500">403</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to access this page.</p>
        <Link href="/dashboard">
          <Button className="mt-6">Return to Dashboard</Button>
        </Link>
      </div>
    </>
  );
}
