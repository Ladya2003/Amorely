import React, { createContext, useState, useContext, ReactNode } from 'react';

interface NavigationContextType {
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  showBottomNav: true,
  setShowBottomNav: () => {}
});

export const useNavigation = () => useContext(NavigationContext);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [showBottomNav, setShowBottomNav] = useState<boolean>(true);

  return (
    <NavigationContext.Provider value={{ showBottomNav, setShowBottomNav }}>
      {children}
    </NavigationContext.Provider>
  );
};
