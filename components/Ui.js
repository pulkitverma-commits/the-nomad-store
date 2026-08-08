'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [bag, setBag] = useState([]);
  // Saved objects are stored as a plain array of product ids under
  // `nomad-saved`, hydrated and written back with the same pattern as the bag.
  const [saved, setSaved] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('nomad-bag');
      if (stored) setBag(JSON.parse(stored));
    } catch (e) {}
    try {
      const stored = window.localStorage.getItem('nomad-saved');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSaved(parsed.filter((x) => x != null));
      }
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

  useEffect(() => {
    if (loaded) {
      try {
        window.localStorage.setItem('nomad-saved', JSON.stringify(saved));
      } catch (e) {}
    }
  }, [saved, loaded]);

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

  const isSaved = (id) => saved.includes(id);
  const toggleSaved = (id) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.concat([id])));
  const removeSaved = (id) => setSaved((s) => s.filter((x) => x !== id));
  const clearSaved = () => setSaved([]);

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
        saved,
        isSaved,
        toggleSaved,
        removeSaved,
        clearSaved,
        // false until localStorage has been read, so components can avoid
        // rendering a count that flickers on hydration
        loaded,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  return useContext(UiContext);
}
