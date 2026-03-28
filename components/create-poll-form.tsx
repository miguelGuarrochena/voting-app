'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatForDateTimeInput, addDays } from '@/utils/date';
import { createEmptyReactions } from '@/src/types/poll';
import usePollStore from '@/store/pollStore';

type FormPollOption = {
  id: string;
  text: string;
  image: string;
  emoji?: string;
};

type PollOption = {
  id: string;
  label: string;
  image: string;
  reactions: Record<string, number>;
};

type Participant = {
  id: string;
  emailOrUsername: string;
};

export function CreatePollForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState(() => {
    // Set default expiration to 7 days from now
    const defaultDate = addDays(new Date(), 7);
    return formatForDateTimeInput(defaultDate);
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [options, setOptions] = useState<FormPollOption[]>([
    { id: crypto.randomUUID(), text: '', image: '' },
    { id: crypto.randomUUID(), text: '', image: '' },
  ]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const router = useRouter();
  const { createPoll } = usePollStore();

  const addOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: '', image: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(option => option.id !== id));
  };

  const updateOption = (id: string, updates: Partial<FormPollOption>) => {
    setOptions(
      options.map(option =>
        option.id === id ? { ...option, ...updates } : option
      )
    );
  };

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.trim()) return;
    setParticipants([
      ...participants,
      { id: crypto.randomUUID(), emailOrUsername: newParticipant },
    ]);
    setNewParticipant('');
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the new poll
    const newPoll = {
      title,
      description: description || undefined,
      expiresAt: new Date(expirationDate),
      isPublic: !isPrivate,
      createdBy: 'current-user', // In a real app, this would be the logged-in user
      visibility: (!isPrivate ? 'public' : 'private') as 'public' | 'private',
      options: options
        .filter(option => option.text.trim() !== '')
        .map(option => ({
          id: crypto.randomUUID(),
          pollId: '', // Will be set by the store
          title: option.text,
          imageUrl: option.image || undefined,
          reactions: createEmptyReactions(),
        })),
    };
    
    // Add to store
    createPoll(newPoll);
    
    // Redirect to the new poll
    router.push('/'); // Will redirect to home where the new poll will be shown
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Poll Basics Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Poll Basics</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="title">
            Poll Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            placeholder="What's your poll about?"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500 min-h-[100px]"
            placeholder="Add more details about your poll..."
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2" htmlFor="expiration">
            Expiration Date *
          </label>
          <input
            id="expiration"
            type="datetime-local"
            min={minDate}
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Poll Options Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Poll Options</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add at least 2 options. You can include text, emoji, or upload an image for each option.
        </p>

        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, { text: e.target.value })}
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <input
                    type="text"
                    value={option.emoji || ''}
                    onChange={(e) => updateOption(option.id, { emoji: e.target.value })}
                    className="w-16 p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="😊"
                    maxLength={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          updateOption(option.id, { image: event.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-sm text-gray-600"
                  />
                  {option.image && (
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={option.image} 
                        alt="Option preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                disabled={options.length <= 2}
                title={options.length <= 2 ? "You need at least 2 options" : "Remove option"}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addOption}
          className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
        >
          + Add Option
        </button>
      </div>

      {/* Visibility & Privacy Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Visibility & Privacy</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="public"
              name="visibility"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="public" className="ml-2 block text-gray-700">
              Public - Anyone with the link can view and vote
            </label>
          </div>
          
          <div className="flex items-start">
            <input
              type="radio"
              id="private"
              name="visibility"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
            />
            <div className="ml-2">
              <label htmlFor="private" className="block text-gray-700">
                Private - Only invited participants can view and vote
              </label>
              {isPrivate && (
                <div className="mt-3 ml-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="anonymous" className="ml-2 text-gray-700">
                      Anonymous voting (participants' votes are hidden)
                    </label>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">Invite Participants</h3>
                    <form onSubmit={addParticipant} className="flex gap-2">
                      <input
                        type="text"
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        placeholder="Enter email or username"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      >
                        Add
                      </button>
                    </form>

                    {participants.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Invited Participants:</h4>
                        <ul className="space-y-1">
                          {participants.map((participant) => (
                            <li key={participant.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span>{participant.emailOrUsername}</span>
                              <button
                                type="button"
                                onClick={() => removeParticipant(participant.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove participant"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          disabled={!title || !expirationDate || options.some(o => !o.text)}
        >
          Create Poll
        </button>
      </div>
    </form>
  );
}
