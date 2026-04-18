import { CreatePollForm } from '@/components/create/create-poll-form';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CreatePollPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg)] pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create a New Poll</h1>
            <p className="text-gray-600 text-sm sm:text-base">Share your thoughts and gather opinions from your community</p>
          </div>
          <CreatePollForm />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreatePollPage;
