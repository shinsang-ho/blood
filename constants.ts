
import { BloodType, ActionType, BloodCard } from './types';

export const BLOOD_TYPES: BloodType[] = ['AA', 'AO', 'BB', 'BO', 'AB', 'OO'];
export const ACTION_CARDS: ActionType[] = ['결혼', '사망', '출생']; // Marriage, Death, Birth

export const createInitialDeck = (): BloodCard[] => {
  const deck: BloodCard[] = [];
  BLOOD_TYPES.forEach(type => {
    for (let i = 0; i < 4; i++) {
      deck.push({ type: 'blood', value: type, id: `${type}-${i}` });
    }
  });
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
