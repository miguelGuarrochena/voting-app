import { SpinWheel } from '@/components/SpinWheel';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SpinWheelPage() {
  return (
    <ProtectedRoute>
      <SpinWheel />
    </ProtectedRoute>
  );
}
