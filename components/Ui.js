'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [bag, setBag] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('nomad-bag');
      if (saved) setBag(JSON.parse(saved));
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        window.localStorage.setItem('nomad-bag', JSON.stringify(bag));
      } catch (e) {}
    }
  }, [bag, loaded]);

  const addToBag = (p) => {
    setBag((b) => {
      const ex = b.find((x) => x.id === p.id);
      return ex
        ? b.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
        : b.concat([{ ...p, qty: 1 }]);
    });
    setBagOpen(true);
  };
  const setQty = (id, qty) =>
    setBag((b) => b.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));
  const removeItem = (id) => setBag((b) => b.filter((x) => x.id !== id));
  const clearBag = () => setBag([]);

  return (
    <UiContext.Provider
      value={{
        bag,
        addToBag,
        setQty,
        removeItem,
        clearBag,
        bagOpen,
        setBagOpen,
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}
