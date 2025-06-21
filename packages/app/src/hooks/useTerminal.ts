import { useState, useCallback } from 'react';

export interface TerminalState {
  isOpen: boolean;
  height: number;
}

export interface TerminalActions {
  toggle: () => void;
  open: () => void;
  close: () => void;
  setHeight: (height: number) => void;
}

export function useTerminal(defaultHeight: number = 300): [TerminalState, TerminalActions] {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(defaultHeight);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateHeight = useCallback((newHeight: number) => {
    setHeight(newHeight);
  }, []);

  const state: TerminalState = {
    isOpen,
    height,
  };

  const actions: TerminalActions = {
    toggle,
    open,
    close,
    setHeight: updateHeight,
  };

  return [state, actions];
} 