'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Poll } from '@/types/poll';

interface RankPollVoteProps {
  poll: Poll;
  onSubmitRanking: (rankedOptionIds: string[]) => void;
  hasRanked: boolean;
  userRanking: string[] | undefined;
  className?: string;
}

// Sortable item component
function SortableOption({ option, index, isMobile, onMoveUp, onMoveDown, totalOptions }: {
  option: Poll['options'][0];
  index: number;
  isMobile: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  totalOptions: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: option.id, disabled: isMobile });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isMobile ? attributes : {})}
      {...(!isMobile ? listeners : {})}
      className={`bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-3 ${!isMobile ? 'cursor-move hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md' : ''} transition-all flex items-center gap-4 w-full`}
    >
      <div className="flex-shrink-0 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.title}</h3>
        {option.imageUrl && (
          <img
            src={option.imageUrl}
            alt={option.title}
            className="w-16 h-16 object-cover rounded-lg mt-2"
          />
        )}
      </div>
      {isMobile ? (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={index === 0}
            aria-label="Move up"
            className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown?.(index)}
            disabled={index === totalOptions - 1}
            aria-label="Move down"
            className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="text-gray-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
    </div>
  );
}

export const RankPollVote = ({ poll, onSubmitRanking, hasRanked, userRanking, className = '' }: RankPollVoteProps) => {
  const [options, setOptions] = useState(poll.options);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOptions((items) => {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      return newItems;
    });
  };

  const moveDown = (index: number) => {
    if (index === options.length - 1) return;
    setOptions((items) => {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
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
      <div className={`w-full space-y-3 ${className}`}>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
          <p className="text-green-800 dark:text-green-300 font-medium">✓ You have submitted your ranking</p>
        </div>
        {rankedOptions.map((option, index) => (
          <div
            key={option.id}
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.title}</h3>
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
    <div className={`w-full ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-blue-800 text-sm">
          <strong>How to rank:</strong> {isMobile ? 'Use the up/down buttons to reorder options.' : 'Drag the options to reorder them.'} Your top choice should be at the top (position 1).
        </p>
      </div>

      {!isMobile ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={options.map(opt => opt.id)} strategy={verticalListSortingStrategy}>
            {options.map((option, index) => (
              <SortableOption
                key={option.id}
                option={option}
                index={index}
                isMobile={isMobile}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                totalOptions={options.length}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <SortableContext items={options.map(opt => opt.id)} strategy={verticalListSortingStrategy}>
          {options.map((option, index) => (
            <SortableOption
              key={option.id}
              option={option}
              index={index}
              isMobile={isMobile}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              totalOptions={options.length}
            />
          ))}
        </SortableContext>
      )}

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
