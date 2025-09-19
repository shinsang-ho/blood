import React, { useState, useCallback } from 'react';
import { CardZone } from './components/CardZone';
import { ExecutionZone } from './components/ExecutionZone';
import { BloodCard, ActionCard, PlacedCard, Line, ActionType } from './types';
import { createInitialDeck, ACTION_CARDS } from './constants';

const App: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [masterDeck] = useState<BloodCard[]>(() => createInitialDeck());
  const [deck, setDeck] = useState<BloodCard[]>([]);
  const [placedCards, setPlacedCards] = useState<{ [player: number]: PlacedCard[] }>({ 1: [], 2: [] });
  const [lines, setLines] = useState<{ [player: number]: Line[] }>({ 1: [], 2: [] });
  const [currentAction, setCurrentAction] = useState<ActionCard | null>(null);
  
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStartCardId, setLineStartCardId] = useState<string | null>(null);

  const handleDrawAction = useCallback(() => {
    if (currentAction) return;

    const randomAction: ActionType = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
    setCurrentAction({ type: 'action', value: randomAction });

    const placedCardIds = new Set([
      ...placedCards[1].map(c => c.id),
      ...placedCards[2].map(c => c.id),
    ]);

    const availableCards = masterDeck.filter(card => !placedCardIds.has(card.id));

    // Shuffle the available cards
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

  const handlePlacedCardDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, cardId: string) => {
    e.dataTransfer.setData('placedCardId', cardId);
    const cardElement = e.currentTarget as HTMLDivElement;
    const rect = cardElement.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, player: 1 | 2) => {
    e.preventDefault();
    if (player !== currentPlayer) return;

    const newCardId = e.dataTransfer.getData('newCardId');
    const placedCardId = e.dataTransfer.getData('placedCardId');
    const zone = e.currentTarget.getBoundingClientRect();
    
    if (newCardId) {
      const newCardValue = e.dataTransfer.getData('newCardValue');
      const x = e.clientX - zone.left - 32;
      const y = e.clientY - zone.top - 48;
      
      setPlacedCards(prev => ({
        ...prev,
        [player]: [...prev[player], { id: newCardId, bloodType: newCardValue as any, position: { x, y } }],
      }));
      setDeck(prevDeck => prevDeck.filter(card => card.id !== newCardId));
    } else if (placedCardId) {
      const offsetX = parseFloat(e.dataTransfer.getData('offsetX'));
      const offsetY = parseFloat(e.dataTransfer.getData('offsetY'));
      const x = e.clientX - zone.left - offsetX;
      const y = e.clientY - zone.top - offsetY;

      setPlacedCards(prev => ({
        ...prev,
        [player]: prev[player].map(card => 
          card.id === placedCardId ? { ...card, position: { x, y } } : card
        ),
      }));
    }
  }, [currentPlayer]);

  const handleDropInCardZone = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const placedCardId = e.dataTransfer.getData('placedCardId');
      
      const newCardId = e.dataTransfer.getData('newCardId');
      if (!placedCardId || newCardId) return;

      const playerPlacedCards = placedCards[currentPlayer];
      const cardToReturn = playerPlacedCards.find(c => c.id === placedCardId);

      if (cardToReturn) {
          setPlacedCards(prev => ({
              ...prev,
              [currentPlayer]: prev[currentPlayer].filter(c => c.id !== placedCardId),
          }));

          const newDeckCard: BloodCard = {
              id: cardToReturn.id,
              type: 'blood',
              value: cardToReturn.bloodType,
          };
          setDeck(prev => [...prev, newDeckCard]);

          setLines(prev => ({
              ...prev,
              [currentPlayer]: prev[currentPlayer].filter(line => line.from !== placedCardId && line.to !== placedCardId)
          }));
      }
  }, [currentPlayer, placedCards]);


  const toggleLineDrawing = () => {
    setIsDrawingLine(prev => !prev);
    setLineStartCardId(null);
  };

  const handleCardClickForLine = (cardId: string, player: 1 | 2) => {
    if (!isDrawingLine || player !== currentPlayer) return;

    if (!lineStartCardId) {
      setLineStartCardId(cardId);
    } else {
      if (lineStartCardId !== cardId) {
        const lineExists = lines[player].some(
          line => (line.from === lineStartCardId && line.to === cardId) || (line.from === cardId && line.to === lineStartCardId)
        );
        if (lineExists) {
          setLines(prev => ({
            ...prev,
            [player]: prev[player].filter(
              line => !((line.from === lineStartCardId && line.to === cardId) || (line.from === cardId && line.to === lineStartCardId))
            )
          }));
        } else {
          setLines(prev => ({
            ...prev,
            [player]: [...prev[player], { from: lineStartCardId, to: cardId }],
          }));
        }
      }
      setLineStartCardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
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
            isDrawingLine={isDrawingLine}
            onCardClick={handleCardClickForLine}
            lineStartCardId={lineStartCardId}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
