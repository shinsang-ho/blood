import React from 'react';
import { PlacedCard, Line } from '../types';
import { CardDisplay } from './CardDisplay';

interface ExecutionZoneProps {
  player: 1 | 2;
  isActive: boolean;
  placedCards: PlacedCard[];
  lines: Line[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, player: 1 | 2) => void;
  onPlacedCardDragStart: (e: React.DragEvent<HTMLDivElement>, cardId: string, player: 1 | 2) => void;
  onCardTouchStart: (e: React.TouchEvent<HTMLDivElement>, card: PlacedCard, player: 1 | 2) => void;
  isDrawingLine: boolean;
  onCardClick: (cardId: string, player: 1 | 2) => void;
  lineStartCardId: string | null;
}

export const ExecutionZone: React.FC<ExecutionZoneProps> = ({ player, isActive, placedCards, lines, onDrop, onPlacedCardDragStart, onCardTouchStart, isDrawingLine, onCardClick, lineStartCardId }) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const getCardPosition = (cardId: string) => {
    const card = placedCards.find(c => c.id === cardId);
    return card ? { x: card.position.x + 32, y: card.position.y + 48 } : null; // Center of card
  };
  
  const activeClasses = 'border-yellow-400 ring-2 ring-yellow-400/50';
  const inactiveClasses = 'border-slate-600 opacity-60';

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={(e) => onDrop(e, player)}
      data-drop-zone="execution"
      data-player={player}
      className={`bg-slate-800/50 border-2 border-dashed p-4 rounded-lg shadow-inner flex-grow h-full transition-all duration-300 relative ${isActive ? activeClasses : inactiveClasses}`}
      style={{ minHeight: '300px' }}
    >
        {placedCards.map(card => (
            <div
            key={card.id}
            style={{ position: 'absolute', left: `${card.position.x}px`, top: `${card.position.y}px`, cursor: isActive ? 'move' : 'default' }}
            className={isDrawingLine && isActive ? 'cursor-crosshair' : ''}
            draggable={isActive}
            onDragStart={(e) => {
                if (isActive) {
                    e.stopPropagation();
                    onPlacedCardDragStart(e, card.id, player);
                }
            }}
            onTouchStart={(e) => {
                if(isActive) {
                    e.stopPropagation();
                    onCardTouchStart(e, card, player);
                }
            }}
            >
            <CardDisplay
                card={{ type: 'blood', value: card.bloodType, id: card.id }}
                onClick={() => isDrawingLine && isActive && onCardClick(card.id, player)}
                isSelected={lineStartCardId === card.id}
            />
            </div>
        ))}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {lines.map((line, index) => {
            const fromPos = getCardPosition(line.from);
            const toPos = getCardPosition(line.to);
            if (fromPos && toPos) {
                return (
                <line
                    key={index}
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="#64748b"
                    strokeWidth="3"
                />
                );
            }
            return null;
            })}
        </svg>
    </div>
  );
};