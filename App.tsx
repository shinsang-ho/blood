import React, { useState, useCallback, useRef } from 'react';
import { CardZone } from './components/CardZone';
import { ExecutionZone } from './components/ExecutionZone';
import { BloodCard, ActionCard, PlacedCard, Line, ActionType, BloodType } from './types';
import { createInitialDeck, ACTION_CARDS } from './constants';
import { CardDisplay } from './components/CardDisplay';

const App: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [masterDeck] = useState<BloodCard[]>(() => createInitialDeck());
  const [deck, setDeck] = useState<BloodCard[]>([]);
  const [placedCards, setPlacedCards] = useState<{ [player: number]: PlacedCard[] }>({ 1: [], 2: [] });
  const [lines, setLines] = useState<{ [player: number]: Line[] }>({ 1: [], 2: [] });
  const [currentAction, setCurrentAction] = useState<ActionCard | null>(null);
  
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStartCardId, setLineStartCardId] = useState<string | null>(null);

  // State for touch drag and drop
  const [ghost, setGhost] = useState<{ card: BloodCard; x: number; y: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    dragData: any;
    originalElement: HTMLElement;
  } | null>(null);


  const handleDrawAction = useCallback(() => {
    if (currentAction) return;

    const randomAction: ActionType = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
    setCurrentAction({ type: 'action', value: randomAction });

    const placedCardIds = new Set([
      ...placedCards[1].map(c => c.id),
      ...placedCards[2].map(c => c.id),
    ]);

    const availableCards = masterDeck.filter(card => !placedCardIds.has(card.id));

    for (let i = availableCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
    }

    setDeck(availableCards);
  }, [currentAction, masterDeck, placedCards]);

  const handlePassTurn = () => {
    setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
    setCurrentAction(null);
    setDeck([]);
    setIsDrawingLine(false);
    setLineStartCardId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDeckCardDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, card: BloodCard) => {
    e.dataTransfer.setData('newCardId', card.id);
    e.dataTransfer.setData('newCardValue', card.value);
  }, []);

  const handlePlacedCardDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, cardId: string, player: 1|2) => {
    e.dataTransfer.setData('placedCardId', cardId);
    e.dataTransfer.setData('sourcePlayer', player.toString());
    const cardElement = e.currentTarget as HTMLDivElement;
    const rect = cardElement.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
  }, []);

  const dropInExecutionZone = useCallback((
    player: 1 | 2,
    dragData: { newCardId?: string; newCardValue?: BloodType; placedCardId?: string; sourcePlayer?: 1 | 2; offsetX?: number; offsetY?: number },
    dropCoords: { clientX: number, clientY: number },
    zoneElement: HTMLElement
  ) => {
      if (player !== currentPlayer) return;
  
      const { newCardId, placedCardId } = dragData;
      const zone = zoneElement.getBoundingClientRect();
      
      if (newCardId && dragData.newCardValue) {
        const x = dropCoords.clientX - zone.left - 32; // card width / 2
        const y = dropCoords.clientY - zone.top - 48; // card height / 2
        
        setPlacedCards(prev => ({
          ...prev,
          [player]: [...prev[player], { id: newCardId, bloodType: dragData.newCardValue as any, position: { x, y } }],
        }));
        setDeck(prevDeck => prevDeck.filter(card => card.id !== newCardId));

      } else if (placedCardId) {
        if (dragData.sourcePlayer !== player) return; // Can't move other player's card to your zone
        const offsetX = dragData.offsetX ?? 0;
        const offsetY = dragData.offsetY ?? 0;
        const x = dropCoords.clientX - zone.left - offsetX;
        const y = dropCoords.clientY - zone.top - offsetY;
  
        setPlacedCards(prev => ({
          ...prev,
          [player]: prev[player].map(card => 
            card.id === placedCardId ? { ...card, position: { x, y } } : card
          ),
        }));
      }
  }, [currentPlayer]);

  const dropInCardZone = useCallback((dragData: { placedCardId?: string; sourcePlayer?: 1 | 2 }) => {
    if (!dragData.placedCardId || !dragData.sourcePlayer || dragData.sourcePlayer !== currentPlayer) return;

    const playerPlacedCards = placedCards[dragData.sourcePlayer];
    const cardToReturn = playerPlacedCards.find(c => c.id === dragData.placedCardId);

    if (cardToReturn) {
        setPlacedCards(prev => ({
            ...prev,
            [dragData.sourcePlayer!]: prev[dragData.sourcePlayer!].filter(c => c.id !== dragData.placedCardId),
        }));

        const newDeckCard: BloodCard = {
            id: cardToReturn.id,
            type: 'blood',
            value: cardToReturn.bloodType,
        };
        setDeck(prev => [...prev, newDeckCard]);

        setLines(prev => ({
            ...prev,
            [dragData.sourcePlayer!]: prev[dragData.sourcePlayer!].filter(line => line.from !== dragData.placedCardId && line.to !== dragData.placedCardId)
        }));
    }
  }, [currentPlayer, placedCards]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, player: 1 | 2) => {
    e.preventDefault();
    const sourcePlayer = parseInt(e.dataTransfer.getData('sourcePlayer'));
    const dragData = {
      newCardId: e.dataTransfer.getData('newCardId'),
      newCardValue: e.dataTransfer.getData('newCardValue') as BloodType,
      placedCardId: e.dataTransfer.getData('placedCardId'),
      sourcePlayer: isNaN(sourcePlayer) ? undefined : (sourcePlayer as 1 | 2),
      offsetX: parseFloat(e.dataTransfer.getData('offsetX')),
      offsetY: parseFloat(e.dataTransfer.getData('offsetY')),
    };
    dropInExecutionZone(player, dragData, { clientX: e.clientX, clientY: e.clientY }, e.currentTarget);
  }, [dropInExecutionZone]);

  const handleDropInCardZone = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const sourcePlayer = parseInt(e.dataTransfer.getData('sourcePlayer'));
      const dragData = {
          placedCardId: e.dataTransfer.getData('placedCardId'),
          sourcePlayer: isNaN(sourcePlayer) ? undefined : (sourcePlayer as 1 | 2),
      };
      if (dragData.placedCardId) {
        dropInCardZone(dragData);
      }
  }, [dropInCardZone]);

  // --- Touch Event Handlers ---

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (ghostRef.current) {
      const touch = e.touches[0];
      ghostRef.current.style.transform = `translate(${touch.clientX}px, ${touch.clientY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);

    setGhost(null);

    if (dragInfo.current) {
      dragInfo.current.originalElement.style.opacity = '1';

      const touch = e.changedTouches[0];
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

      if (dropTarget) {
        const executionZoneEl = dropTarget.closest<HTMLElement>('[data-drop-zone="execution"]');
        if (executionZoneEl) {
          const player = parseInt(executionZoneEl.dataset.player!) as 1 | 2;
          dropInExecutionZone(player, dragInfo.current.dragData, { clientX: touch.clientX, clientY: touch.clientY }, executionZoneEl);
        } else {
          const cardZoneEl = dropTarget.closest<HTMLElement>('[data-drop-zone="card"]');
          if (cardZoneEl && dragInfo.current.dragData.placedCardId) {
            dropInCardZone(dragInfo.current.dragData);
          }
        }
      }
      dragInfo.current = null;
    }
  }, [handleTouchMove, dropInExecutionZone, dropInCardZone]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, card: BloodCard | PlacedCard, type: 'new' | 'placed', player?: 1 | 2) => {
      e.preventDefault();
      const originalElement = e.currentTarget;
      const touch = e.touches[0];

      const cardData = type === 'new' ? card as BloodCard : {id: (card as PlacedCard).id, type: 'blood' as const, value: (card as PlacedCard).bloodType};

      setGhost({
        card: cardData,
        x: touch.clientX,
        y: touch.clientY,
      });

      const rect = originalElement.getBoundingClientRect();
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      dragInfo.current = {
        originalElement: originalElement,
        dragData: {
          [type === 'new' ? 'newCardId' : 'placedCardId']: card.id,
          newCardValue: type === 'new' ? (card as BloodCard).value : (card as PlacedCard).bloodType,
          sourcePlayer: player,
          offsetX,
          offsetY,
        }
      };

      originalElement.style.opacity = '0.5';

      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove, handleTouchEnd]);

  // FIX: Define toggleLineDrawing to handle the "Draw Line" button click.
  const toggleLineDrawing = useCallback(() => {
    setIsDrawingLine(prev => !prev);
    setLineStartCardId(null);
  }, []);

  // FIX: Define handleCardClickForLine to manage creating lines between cards.
  const handleCardClickForLine = useCallback((cardId: string, player: 1 | 2) => {
    if (!isDrawingLine || player !== currentPlayer) return;

    if (!lineStartCardId) {
      // Start a new line
      setLineStartCardId(cardId);
    } else {
      // Finish a line, but don't connect a card to itself
      if (lineStartCardId !== cardId) {
        // Avoid duplicate lines
        const lineExists = lines[player].some(
          line => (line.from === lineStartCardId && line.to === cardId) || (line.from === cardId && line.to === lineStartCardId)
        );

        if (!lineExists) {
          setLines(prev => ({
            ...prev,
            [player]: [...prev[player], { from: lineStartCardId, to: cardId }],
          }));
        }
      }
      // Reset for the next line
      setLineStartCardId(null);
    }
  }, [isDrawingLine, currentPlayer, lineStartCardId, lines]);

  return (
    <>
      {ghost && (
        <div 
          ref={ghostRef}
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            transform: `translate(${ghost.x}px, ${ghost.y}px)`, 
            zIndex: 1000, 
            pointerEvents: 'none',
            marginLeft: '-2rem', // w-16 is 4rem, so offset by half
            marginTop: '-3rem' // h-24 is 6rem, so offset by half
          }}
        >
          <CardDisplay card={ghost.card} />
        </div>
      )}
      <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 md:p-8 flex flex-col">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-indigo-500">
            혈액형 카드 게임
          </h1>
          <p className="text-slate-400 mt-2 text-xl">
            <span className={`font-bold transition-colors duration-300 ${currentPlayer === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>Player 1</span>
            <span className="mx-4">&</span>
            <span className={`font-bold transition-colors duration-300 ${currentPlayer === 2 ? 'text-yellow-400' : 'text-slate-500'}`}>Player 2</span>
          </p>
          <p className="text-yellow-400 font-bold text-lg mt-1">Player {currentPlayer}의 턴</p>
        </header>

        <main className="flex-grow flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-semibold mb-2 text-center text-slate-400">Player 1 실행존</h3>
            <ExecutionZone
              player={1}
              isActive={currentPlayer === 1}
              placedCards={placedCards[1]}
              lines={lines[1]}
              onDrop={handleDrop}
              onPlacedCardDragStart={handlePlacedCardDragStart}
              onCardTouchStart={(e, card, player) => handleTouchStart(e, card, 'placed', player)}
              isDrawingLine={isDrawingLine}
              onCardClick={handleCardClickForLine}
              lineStartCardId={lineStartCardId}
            />
          </div>
          
          <div className="flex flex-col md:w-[350px] md:max-w-[350px] shrink-0 gap-4">
              <CardZone 
                deck={deck}
                currentAction={currentAction}
                onDrawAction={handleDrawAction}
                onDeckCardDragStart={handleDeckCardDragStart}
                onDeckCardTouchStart={(e, card) => handleTouchStart(e, card, 'new')}
                isActionCardDisabled={deck.length > 0}
                onDrop={handleDropInCardZone}
                onDragOver={handleDragOver}
              />
              <div className="bg-slate-800 p-4 rounded-lg shadow-inner flex flex-col gap-3">
                  <button
                      onClick={toggleLineDrawing}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed ${
                        isDrawingLine
                          ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      disabled={!currentAction}
                  >
                      {isDrawingLine ? '선 그리기 취소' : '선 그리기'}
                  </button>
                  <button
                      onClick={handlePassTurn}
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition-colors"
                  >
                      턴 넘기기
                  </button>
              </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-semibold mb-2 text-center text-slate-400">Player 2 실행존</h3>
            <ExecutionZone
              player={2}
              isActive={currentPlayer === 2}
              placedCards={placedCards[2]}
              lines={lines[2]}
              onDrop={handleDrop}
              onPlacedCardDragStart={handlePlacedCardDragStart}
              onCardTouchStart={(e, card, player) => handleTouchStart(e, card, 'placed', player)}
              isDrawingLine={isDrawingLine}
              onCardClick={handleCardClickForLine}
              lineStartCardId={lineStartCardId}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
