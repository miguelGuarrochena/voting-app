'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatForDateTimeInput, addDays } from '@/utils/date';
import { createEmptyReactions } from '@/types/poll';
import { useCreatePoll } from '@/hooks/useApi';
import ImagePickerModal from './ImagePickerModal';

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

export const CreatePollForm = () => {
  const [title, setTitle] = useState('');
  const [titleImage, setTitleImage] = useState('');
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
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{
    type: 'title' | 'option';
    optionId?: string;
  } | null>(null);
  const router = useRouter();
  const { createPoll, loading, error: submitError } = useCreatePoll();

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

  const handleTitleImageUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        titleImage: 'Only JPG and PNG images are allowed'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        titleImage: 'Image size must be less than 5MB'
      }));
      return;
    }

    // Clear any previous errors for title image
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.titleImage;
      return newErrors;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      setTitleImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (optionId: string) => {
    updateOption(optionId, { image: '' });
  };

  const removeTitleImage = () => {
    setTitleImage('');
  };

  const openImagePicker = (type: 'title' | 'option', optionId?: string) => {
    setImagePickerContext({ type, optionId });
    setImagePickerOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (imagePickerContext?.type === 'title') {
      setTitleImage(imageUrl);
    } else if (imagePickerContext?.type === 'option' && imagePickerContext.optionId) {
      updateOption(imagePickerContext.optionId, { image: imageUrl });
    }
    setImagePickerContext(null);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const isFormValid = () => {
    return title.trim().length >= 3 && 
           options.filter(opt => opt.text.trim() !== '').length >= 2 &&
           expirationDate &&
           !loading;
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
    
    try {
      // Create the new poll
      const newPoll = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        titleImage: titleImage || undefined,
        expiresAt: new Date(expirationDate),
        visibility: (!isPrivate ? 'public' : 'private') as 'public' | 'private',
        createdBy: 'current-user',
        options: options
          .filter(option => option.text.trim() !== '')
          .map(option => ({
            id: crypto.randomUUID(),
            pollId: '',
            title: option.text.trim(),
            imageUrl: option.image || undefined,
            votes: 0,
            reactions: createEmptyReactions(),
          })),
      });
      
      // Redirect to the new poll
      router.push('/');
    } catch (error) {
      console.error('Failed to create poll:', error);
      setErrors({ submit: 'Failed to create poll. Please try again.' });
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Poll Basics Section */}
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">Poll Basics</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2" htmlFor="title">
                Poll Title *
              </label>
              <div className="space-y-3">
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
                  className={`w-full px-4 py-3 border rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)] ${
                    errors.title ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-[var(--border)]'
                  }`}
                  placeholder="What's your poll about?"
                  maxLength={100}
                />
                
                {/* Title Image Upload */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleTitleImageUpload(file);
                      }
                    }}
                    className="text-sm text-[var(--text-muted)] file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-[var(--primary)] file:cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker('title')}
                    className="text-sm px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-full hover:bg-[var(--surface)] transition-colors font-medium border border-[var(--primary)]"
                  >
                    📷 Search Stock Images
                  </button>
                  {titleImage && (
                    <div className="relative group">
                      <div className="w-16 h-16 bg-[var(--surface-2)] rounded-lg overflow-hidden">
                        <img 
                          src={titleImage} 
                          alt="Title image preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeTitleImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs cursor-pointer"
                        title="Remove title image"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {errors.titleImage && (
                    <p className="text-xs text-red-600">{errors.titleImage}</p>
                  )}
                </div>
              </div>
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-[var(--text-muted)]">{title.length}/100 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2" htmlFor="description">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)] min-h-[100px]"
                placeholder="Add more details about your poll..."
                maxLength={500}
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">{description.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2" htmlFor="expiration">
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
                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors ${
                  errors.expiration ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-[var(--border)]'
                }`}
              />
              {errors.expiration && (
                <p className="mt-2 text-sm text-red-600">{errors.expiration}</p>
              )}
            </div>
          </div>
          
          {errors.options && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
              <p className="text-sm text-red-600">{errors.options}</p>
            </div>
          )}
        </div>

        {/* Poll Options Section */}
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-4">Poll Options</h2>
          <p className="font-body text-sm text-[var(--text-muted)] mb-6">
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
                      className="flex-1 px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
                      placeholder={`Option ${index + 1}`}
                      maxLength={50}
                    />
                    <input
                      type="text"
                      value={option.emoji || ''}
                      onChange={(e) => updateOption(option.id, { emoji: e.target.value })}
                      className="w-16 px-3 py-3 border border-[var(--border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors"
                      placeholder="😊"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(option.id, file);
                        }
                      }}
                      className="text-sm text-[var(--text-muted)] file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-[var(--primary)] file:cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker('option', option.id)}
                      className="text-sm px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-full hover:bg-[var(--surface)] transition-colors font-medium border border-[var(--primary)]"
                    >
                      📷 Stock Images
                    </button>
                    {option.image && (
                      <div className="relative group">
                        <div className="w-12 h-12 bg-[var(--surface-2)] rounded overflow-hidden">
                          <img 
                            src={option.image} 
                            alt="Option preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(option.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs cursor-pointer"
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
                  className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
            className="mt-6 px-6 py-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"
          >
            + Add Option
          </button>
        </div>

        {/* Visibility & Privacy Section */}
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">Visibility & Privacy</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)]"
              />
              <label htmlFor="public" className="ml-2 block text-sm font-medium text-[var(--text)]">
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
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)] mt-1"
              />
              <div className="ml-2">
                <label htmlFor="private" className="block text-sm font-medium text-[var(--text)]">
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
                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)]"
                      />
                      <label htmlFor="anonymous" className="ml-2 text-sm text-[var(--text)]">
                        Anonymous voting (participants' votes are hidden)
                      </label>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-medium text-sm text-[var(--text)] mb-2">Invite Participants</h3>
                      <form onSubmit={addParticipant} className="flex gap-2">
                        <input
                          type="text"
                          value={newParticipant}
                          onChange={(e) => setNewParticipant(e.target.value)}
                          className="flex-1 px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
                          placeholder="Enter email or username"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"
                        >
                          Add
                        </button>
                      </form>

                      {participants.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-sm font-medium text-[var(--text)]">Invited Participants:</h4>
                          <ul className="space-y-1">
                            {participants.map((participant) => (
                              <li key={participant.id} className="flex justify-between items-center bg-[var(--surface-2)] p-2 rounded-[var(--radius-sm)]">
                                <span className="text-sm text-[var(--text)]">{participant.emailOrUsername}</span>
                                <button
                                  type="button"
                                  onClick={() => removeParticipant(participant.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
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
          <div className="text-sm text-[var(--text-muted)]">
            <p>• Title is required (min. 3 characters)</p>
            <p>• At least 2 options required</p>
            <p>• Images must be JPG or PNG (max 5MB)</p>
          </div>
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`px-8 py-3 rounded-[var(--radius-md)] font-medium transition-all ${
              isFormValid()
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
        
        {(submitError || errors.submit) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)]">
            <div className="flex items-start gap-3">
              <div className="text-red-500 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">Failed to create poll</p>
                <p className="text-sm text-red-600">{submitError?.message || errors.submit}</p>
                <button
                  onClick={() => {
                    setErrors(prev => ({ ...prev, submit: '' }));
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Image Picker Modal */}
        <ImagePickerModal
          isOpen={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelectImage={handleImageSelect}
          title={imagePickerContext?.type === 'title' ? 'Choose Title Image' : 'Choose Option Image'}
        />
      </form>
    </div>
  );
}
