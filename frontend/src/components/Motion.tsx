import type { ReactNode } from "react";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Stagger({ children, className = "", delay = 0 }: StaggerProps) {
  return (
    <div className={`stagger-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function StaggerLines({ lines, className = "" }: { lines: ReactNode[]; className?: string }) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask block">
          <span className="line-rise block" style={{ animationDelay: `${0.1 + i * 0.11}s` }}>
            {line}
          </span>
        </span>
      ))}
    </div>
  );
}

export function ViewTransition({ viewKey, children }: { viewKey: string; children: ReactNode }) {
  return (
    <div key={viewKey} className="view-enter">
      {children}
    </div>
  );
}
