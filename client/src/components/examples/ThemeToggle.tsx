import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm">Theme Toggle:</span>
        <ThemeToggle />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Click to switch between light and dark modes
      </p>
    </div>
  );
}