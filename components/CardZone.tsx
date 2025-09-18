import React from 'react';
import { BloodCard, ActionCard } from '../types';
import { CardDisplay } from './CardDisplay';

interface CardZoneProps {
  deck: BloodCard[];
  currentAction: ActionCard | null;
  onDrawAction: () => void;
  onDeckCardDragStart: (e: React.DragEvent<HTMLDivElement>, card: BloodCard) => void;
  isActionCardDisabled: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const CardZone: React.FC<CardZoneProps> = ({ deck, currentAction, onDrawAction, onDeckCardDragStart, isActionCardDisabled, onDrop, onDragOver }) => {
  return (
    <div 
      className="bg-slate-800 p-4 rounded-lg shadow-inner w-full h-full flex flex-col items-center"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <h2 className="text-2xl font-bold mb-4 text-slate-300">카드존</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-center mb-2">실행 카드</h3>
        {currentAction ? (
          <CardDisplay card={currentAction} />
        ) : (
          <button
            onClick={onDrawAction}
            disabled={isActionCardDisabled}
            className="w-24 h-32 bg-green-600 text-white rounded-lg shadow-lg flex items-center justify-center font-bold text-lg hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            실행
          </button>
        )}
      </div>

      <div className="border-t border-slate-600 w-full my-4"></div>

      <div className="flex-grow overflow-y-auto w-full">
        <h3 className="text-lg font-semibold text-center mb-2">혈액형 카드</h3>
        {deck.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 justify-items-center">
            {deck.map((card) => (
              <CardDisplay 
                key={card.id} 
                card={card} 
                isDraggable={true} 
                onDragStart={(e) => onDeckCardDragStart(e, card)}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center mt-4">실행 카드를 클릭하여 게임을 시작하세요.</p>
        )}
      </div>
    </div>
  );
};