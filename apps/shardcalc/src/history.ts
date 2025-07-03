import { createSignal } from "solid-js";

export interface HistoryControls {
  selectNewShard: (shardId: string) => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;
}
export function historyControls(props: {
  selectedShard: string;
  selectShard: (shardId: string) => void;
}): HistoryControls {
  const [history, setHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(0);

  function selectNewShard(shardId: string) {
    if (shardId !== props.selectedShard) {
      const newHistory = [...history().slice(0, historyIndex() + 1), shardId];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      props.selectShard(shardId);
    }
  }

  function canGoBack() {
    return historyIndex() > 0;
  }

  function canGoForward() {
    return historyIndex() < history().length - 1;
  }

  function goBack() {
    if (canGoBack()) {
      const newIndex = historyIndex() - 1;
      setHistoryIndex(newIndex);
      const newShard = history()[newIndex];
      props.selectShard(newShard);
    }
  }

  function goForward() {
    if (canGoForward()) {
      const newIndex = historyIndex() + 1;
      setHistoryIndex(newIndex);
      const newShard = history()[newIndex];
      props.selectShard(newShard);
    }
  }

  return {
    selectNewShard,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };
}
