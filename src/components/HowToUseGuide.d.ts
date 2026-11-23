import React from 'react';

export interface GuideSection {
  id: string;
  title: string;
  lines: string[];
}

export const GUIDE_SECTIONS: GuideSection[];

export interface HowToUseGuideProps {
  open: boolean;
  onClose: () => void;
}

export const HowToUseGuide: React.FC<HowToUseGuideProps>;
