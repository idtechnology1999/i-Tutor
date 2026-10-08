import React from 'react';

/** Set by the registration flow: the steps that apply to this student and
    where they are. Screens keep their own step number as a fallback. */
export const OnboardingStepsContext = React.createContext<{ labels: string[]; current: number } | null>(null);
