import React, { createContext, useContext, useRef, type RefObject } from 'react';

export type RootNavigationRef = RefObject<{ dispatch: (action: any) => void; navigate: (name: string, params?: any) => void } | null>;

const RootNavigationContext = createContext<RootNavigationRef | null>(null);

export const useRootNavigation = () => useContext(RootNavigationContext);

export const RootNavigationProvider = RootNavigationContext.Provider;

export default RootNavigationContext;
