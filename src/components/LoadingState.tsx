const LoadingState = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="flex justify-center gap-1 mb-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-8 bg-primary rounded-full"
            style={{
              animation: "pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[11px] tracking-[3px] uppercase text-muted-foreground mb-2">
        Analyzing market data and generating report…
      </p>
      <p className="text-[10px] text-muted-foreground/60 font-mono">
        Fetching real-time data from multiple sources
      </p>
    </div>
  </div>
);

export default LoadingState;
