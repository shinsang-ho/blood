import React from 'react';
import { BloodCard, ActionCard } from '../types';

interface CardDisplayProps {
  card: BloodCard | ActionCard;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, card: BloodCard) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({ card, isDraggable = false, onDragStart, onTouchStart, onClick, className = '', isSelected = false }) => {
  const isAction = card.type === 'action';

  const baseClasses = 'w-16 h-24 rounded-lg shadow-lg flex items-center justify-center font-bold text-lg cursor-pointer transition-all duration-200 select-none';
  const actionClasses = 'bg-indigo-500 text-white hover:bg-indigo-400';
  const bloodClasses = 'bg-red-200 text-red-800 hover:bg-red-300 hover:shadow-xl';
  const selectedClasses = 'ring-4 ring-yellow-400';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart && card.type === 'blood') {
      onDragStart(e, card);
    }
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onTouchStart={onTouchStart}
      onClick={onClick}
      className={`${baseClasses} ${isAction ? actionClasses : bloodClasses} ${isSelected ? selectedClasses : ''} ${className}`}
    >
      {card.value}
    </div>
  );
};