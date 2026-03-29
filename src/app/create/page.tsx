import { CreatePollForm } from '@/components/create-poll-form';

export default function CreatePollPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create a New Poll</h1>
      <CreatePollForm />
    </div>
  );
}
