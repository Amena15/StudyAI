import React, { createContext, useContext, useState } from 'react';

// Temporary bypass: Pretend the user is on the free tier while we develop
const MOCK_IS_PREMIUM = false; 

interface SubscriptionContextType {
  isPremium: boolean;
  customerInfo: any | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading] = useState(false);

  const checkSubscription = async () => {
    // Do nothing for now, avoiding Apple/RevenueCat network calls
  };

  return (
    <SubscriptionContext.Provider value={{ 
      isPremium: MOCK_IS_PREMIUM, 
      customerInfo: null, 
      loading, 
      checkSubscription 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};


// import React, { createContext, useContext, useState, useEffect } from 'react';
// import Purchases, { CustomerInfo } from 'react-native-purchases';
// import { useAuth } from './AuthContext';

// const REVENUECAT_API_KEY = 'test_hbXmwViyGcYhbMelvTqKvYvluvQ';

// interface SubscriptionContextType {
//   isPremium: boolean;
//   customerInfo: CustomerInfo | null;
//   loading: boolean;
//   checkSubscription: () => Promise<void>;
// }

// const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { user, token } = useAuth();
//   const [isPremium, setIsPremium] = useState(false);
//   const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (user && token) {
//       Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: user.id });
//       checkSubscription();
//     }
//   }, [user, token]);

//   const checkSubscription = async () => {
//     try {
//       const info = await Purchases.getCustomerInfo();
//       setCustomerInfo(info);
//       setIsPremium(!!info.entitlements.active['StudyAI Pro']);
//     } catch (error) {
//       console.error('Failed to check subscription:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SubscriptionContext.Provider value={{ isPremium, customerInfo, loading, checkSubscription }}>
//       {children}
//     </SubscriptionContext.Provider>
//   );
// };

// export const useSubscription = () => {
//   const context = useContext(SubscriptionContext);
//   if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
//   return context;
// };

