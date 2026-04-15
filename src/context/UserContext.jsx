import { createContext, useContext, useState } from 'react';
import { currentUser as initialUser, transactions as initialTransactions } from '../data/mockData';

const UserContext = createContext();

const REQUIRED_PROFILE_FIELDS = ['businessType', 'businessStage', 'primaryGoal'];

export function UserProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [registeredEvents, setRegisteredEvents] = useState([...initialUser.eventsAttended]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingIntent, setOnboardingIntent] = useState(null); // { type: 'apply', event } | null

  const isProfileComplete = REQUIRED_PROFILE_FIELDS.every(f => user.profile?.[f]);

  const openOnboarding = (intent = null) => {
    setOnboardingIntent(intent);
    setIsOnboardingOpen(true);
  };
  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
    setOnboardingIntent(null);
  };

  const updateProfile = (updates) => {
    setUser(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  };

  const registerForEvent = (event) => {
    if (registeredEvents.includes(event.id)) return false;
    if (event.type === 'paid' && user.coinBalance < event.coinCost) return false;

    const newTransactions = [];

    if (event.type === 'paid') {
      newTransactions.push({
        id: `t-${Date.now()}-spent`,
        type: 'spent',
        amount: event.coinCost,
        description: `Registered: ${event.title}`,
        date: new Date().toISOString().split('T')[0],
        icon: event.emoji,
      });
    }

    newTransactions.push({
      id: `t-${Date.now()}-earned`,
      type: 'earned',
      amount: event.coinsEarned,
      description: `Attended: ${event.title}`,
      date: new Date().toISOString().split('T')[0],
      icon: event.emoji,
    });

    const spent = event.type === 'paid' ? event.coinCost : 0;
    const newBalance = user.coinBalance - spent + event.coinsEarned;

    setUser(prev => ({ ...prev, coinBalance: newBalance }));
    setTransactions(prev => [...newTransactions, ...prev]);
    setRegisteredEvents(prev => [...prev, event.id]);

    return true;
  };

  const buyCoins = (pkg) => {
    const tx = {
      id: `t-${Date.now()}-buy`,
      type: 'purchased',
      amount: pkg.coins,
      description: `Purchased ${pkg.coins} Fud Coins`,
      date: new Date().toISOString().split('T')[0],
      price: pkg.price,
    };
    setUser(prev => ({ ...prev, coinBalance: prev.coinBalance + pkg.coins }));
    setTransactions(prev => [tx, ...prev]);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        transactions,
        registeredEvents,
        registerForEvent,
        buyCoins,
        isProfileComplete,
        updateProfile,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        onboardingIntent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
