import { Eye } from "lucide-react";

const WatchlistButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 top-14 z-50 flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg shadow-lg hover:shadow-xl hover:border-primary/40 transition-all text-xs font-mono text-muted-foreground hover:text-foreground"
      title="Watchlist"
    >
      <Eye className="h-4 w-4 text-primary" />
      <span className="hidden sm:inline">Watchlist</span>
    </button>
  );
};

export default WatchlistButton;
