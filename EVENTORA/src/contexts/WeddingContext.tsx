import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface Wedding {
  id: string;
  name: string;
  date: string;
  location: string;
  budgetTotal: number;
  budgetSpent: number;
  status: 'planning' | 'live' | 'archived' | 'cancelled';
  ownerIds: string[];
  plannerIds: string[];
  customDomain?: {
    url: string;
    status: 'pending' | 'verified' | 'active';
    dnsConfig: {
      type: string;
      value: string;
    };
  };
  vendorRatings?: {
    [vendorName: string]: number;
  };
  bankingProfile?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    swiftCode?: string;
  };
}

interface WeddingContextType {
  currentWedding: Wedding | null;
  weddings: Wedding[];
  setCurrentWedding: (wedding: Wedding | null) => void;
  loading: boolean;
}

const WeddingContext = createContext<WeddingContextType>({
  currentWedding: null,
  weddings: [],
  setCurrentWedding: () => {},
  loading: true,
});

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWeddings([]);
      setCurrentWedding(null);
      setLoading(false);
      return;
    }

    const path = 'weddings';
    const q = query(
      collection(db, path),
      where('ownerIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wedding));
      setWeddings(docs);
      if (docs.length > 0 && !currentWedding) {
        setCurrentWedding(docs[0]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <WeddingContext.Provider value={{ currentWedding, weddings, setCurrentWedding, loading }}>
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => useContext(WeddingContext);
