import { INVESTMENT_STYLES, InvestmentStyle } from "@/lib/stockData";
import { Check } from "lucide-react";

interface Props {
  value: InvestmentStyle;
  onChange: (style: InvestmentStyle) => void;
  disabled?: boolean;
}

const InvestorProfileSelector = ({ value, onChange, disabled }: Props) => {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[10px] tracking-[2px] text-muted-foreground uppercase mb-1">Investment Style</p>
        <p className="text-[12px] text-muted-foreground">Select your primary investment approach to personalize analysis weighting.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INVESTMENT_STYLES.map((style) => {
          const selected = value === style.value;
          return (
            <button
              key={style.value}
              onClick={() => !disabled && onChange(style.value)}
              disabled={disabled}
              className={`relative text-left p-3 border rounded-md transition-colors ${
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {selected && (
                <Check className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-primary" />
              )}
              <p className="font-mono text-[11px] font-semibold tracking-[1px] text-foreground">{style.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InvestorProfileSelector;
