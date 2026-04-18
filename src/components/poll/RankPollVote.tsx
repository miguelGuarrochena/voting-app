'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Poll } from '@/types/poll';

interface RankPollVoteProps {
  poll: Poll;
  onSubmitRanking: (rankedOptionIds: string[]) => void;
  hasRanked: boolean;
  userRanking: string[] | undefined;
}

// Sortable item component
function SortableOption({ option, index }: { option: Poll['options'][0]; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3 cursor-move hover:border-gray-300 hover:shadow-md transition-all flex items-center gap-4"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{option.title}</h3>
        {option.imageUrl && (
          <img
            src={option.imageUrl}
            alt={option.title}
            className="w-16 h-16 object-cover rounded-lg mt-2"
          />
        )}
      </div>
      <div className="text-gray-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
}

export const RankPollVote = ({ poll, onSubmitRanking, hasRanked, userRanking }: RankPollVoteProps) => {
  const [options, setOptions] = useState(poll.options);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOptions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const rankedOptionIds = options.map(opt => opt.id);
    onSubmitRanking(rankedOptionIds);
    setIsSubmitting(false);
  };

  // If user has already ranked, show read-only ordered list
  if (hasRanked && userRanking) {
    const rankedOptions = userRanking
      .map(id => poll.options.find(opt => opt.id === id))
      .filter((opt): opt is Poll['options'][0] => opt !== undefined);

    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-green-800 font-medium">✓ You have submitted your ranking</p>
        </div>
        {rankedOptions.map((option, index) => (
          <div
            key={option.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{option.title}</h3>
              {option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={option.title}
                  className="w-16 h-16 object-cover rounded-lg mt-2"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-blue-800 text-sm">
          <strong>How to rank:</strong> Drag the options to reorder them. Your top choice should be at the top (position 1).
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={options.map(opt => opt.id)} strategy={verticalListSortingStrategy}>
          {options.map((option, index) => (
            <SortableOption key={option.id} option={option} index={index} />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Ranking'}
      </button>
    </div>
  );
};
