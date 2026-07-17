export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 ${className}`}>
      {children}
    </div>
  );
}
