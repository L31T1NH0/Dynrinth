export default function ModLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflow: 'auto', minHeight: '100dvh' }}>
      {children}
    </div>
  );
}
