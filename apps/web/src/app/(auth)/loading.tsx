import { Spinner } from '@/components/ui/Spinner';

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4">
      <Spinner size="md" />
    </div>
  );
}
