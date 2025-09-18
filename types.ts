
export type BloodType = 'AA' | 'AO' | 'BB' | 'BO' | 'AB' | 'OO';
export type ActionType = '결혼' | '사망' | '출생';

export interface BloodCard {
  type: 'blood';
  value: BloodType;
  id: string;
}

export interface ActionCard {
  type: 'action';
  value: ActionType;
}

export type Card = BloodCard | ActionCard;

export interface PlacedCard {
  id: string;
  bloodType: BloodType;
  position: { x: number; y: number };
}

export interface Line {
  from: string;
  to: string;
}
