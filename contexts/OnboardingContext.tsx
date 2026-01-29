import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface OnboardingData {
  // User Info
  firstName: string;
  lastName: string;
  sport: string;
  yearsExperience: number;
  meetsPerYear: number;

  // Sporting Info
  goal: string;
  biggestStruggle: string;
  nextComp: string;
  nextCompDate: Date;

  // Training Days
  trainingDays: Record<string, string>; // Day -> Time

  // Pain Point Discovery
  currentTrackingMethod: string;
  biggestFrustration: string;
  reflectionFrequency: string;
  whatHoldingBack: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetOnboarding: () => void;
  totalPages: number;
}

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  sport: 'Olympic Weightlifting',
  yearsExperience: 3,
  meetsPerYear: 2,
  goal: '',
  biggestStruggle: '',
  nextComp: '',
  nextCompDate: new Date(),
  trainingDays: {},
  currentTrackingMethod: '',
  biggestFrustration: '',
  reflectionFrequency: '',
  whatHoldingBack: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 9;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetOnboarding = useCallback(() => {
    setData(initialData);
    setCurrentPage(1);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        currentPage,
        setCurrentPage,
        updateData,
        nextPage,
        prevPage,
        resetOnboarding,
        totalPages,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
