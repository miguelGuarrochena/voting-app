'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatForDateTimeInput, addDays } from '@/utils/date';
import { createEmptyReactions } from '@/types/poll';
import usePollStore from '@/store/pollStore';

type FormPollOption = {
  id: string;
  text: string;
  image: string;
  emoji?: string;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleImageUpload = (optionId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [optionId]: 'Only JPG and PNG images are allowed'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [optionId]: 'Image size must be less than 5MB'
      }));
      return;
    }

    // Clear any previous errors for this option
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[optionId];
      return newErrors;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      updateOption(optionId, { image: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (optionId: string) => {
    updateOption(optionId, { image: '' });
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const isFormValid = () => {
    return title.trim().length >= 3 && 
           options.filter(opt => opt.text.trim() !== '').length >= 2 &&
           expirationDate &&
           !isSubmitting;
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Poll title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Options validation
    const validOptions = options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else if (validOptions.length > 10) {
      newErrors.options = 'Maximum 10 options allowed';
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase());
    const duplicates = optionTexts.filter((text, index) => optionTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      newErrors.options = 'Duplicate options are not allowed';
    }

    // Expiration date validation
    if (!expirationDate) {
      newErrors.expiration = 'Expiration date is required';
    } else {
      const expiryTime = new Date(expirationDate).getTime();
      const now = new Date().getTime();
      const oneHourFromNow = now + (60 * 60 * 1000);
      
      if (expiryTime < oneHourFromNow) {
        newErrors.expiration = 'Poll must expire at least 1 hour from now';
      }
    }

    // Private poll validation
    if (isPrivate && participants.length === 0) {
      newErrors.participants = 'Private polls require at least one participant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the new poll
      const newPoll = {
        title: title.trim(),
        description: description.trim() || undefined,
        expiresAt: new Date(expirationDate),
        isPublic: !isPrivate,
        createdBy: 'current-user', // In a real app, this would be the logged-in user
        visibility: (!isPrivate ? 'public' : 'private') as 'public' | 'private',
        options: options
          .filter(option => option.text.trim() !== '')
          .map(option => ({
            id: crypto.randomUUID(),
            pollId: '', // Will be set by the store
            title: option.text.trim(),
            imageUrl: option.image || undefined,
            votes: 0,
            reactions: createEmptyReactions(),
          })),
      };
      
      // Add to store
      createPoll(newPoll);
      
      // Redirect to the new poll
      router.push('/'); // Will redirect to home where the new poll will be shown
    } catch (error) {
      setErrors({ submit: 'Failed to create poll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors(prev => ({ ...prev, title: '' }));
              }
            }}
            className={`w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors ${
              errors.title ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''
            }`}
            placeholder="What's your poll about?"
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{title.length}/100 characters</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 min-h-[100px] transition-colors"
            placeholder="Add more details about your poll..."
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">{description.length}/500 characters</p>
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
            onChange={(e) => {
              setExpirationDate(e.target.value);
              if (errors.expiration) {
                setErrors(prev => ({ ...prev, expiration: '' }));
              }
            }}
            className={`p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors ${
              errors.expiration ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''
            }`}
          />
          {errors.expiration && (
            <p className="mt-1 text-sm text-red-600">{errors.expiration}</p>
          )}
        </div>
        {errors.options && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.options}</p>
          </div>
        )}
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
                    className="flex-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                    placeholder={`Option ${index + 1}`}
                    maxLength={50}
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
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(option.id, file);
                      }
                    }}
                    className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {option.image && (
                    <div className="relative group">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={option.image} 
                          alt="Option preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(option.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {errors[option.id] && (
                    <p className="text-xs text-red-600">{errors[option.id]}</p>
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
              {isPrivate && participants.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Private polls require at least one participant
                </p>
              )}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-gray-600">
          <p>• Title is required (min. 3 characters)</p>
          <p>• At least 2 options required</p>
          <p>• Images must be JPG or PNG (max 5MB)</p>
        </div>
        <button
          type="submit"
          disabled={!isFormValid()}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isFormValid()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Creating...' : 'Create Poll'}
        </button>
      </div>
      {errors.submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}
    </form>
  );
}
