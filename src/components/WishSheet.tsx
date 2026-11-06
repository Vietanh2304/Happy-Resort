import { Sheet } from './Sheet';

export function WishSheet({ onSave, onClose }: { onSave: (text: string) => void; onClose: () => void }) {
  return (
    <Sheet title="🌠 Cùng ước một điều" onClose={onClose}>
      <p className="muted">Hai bạn vừa chạm sao băng cùng lúc! Viết điều ước của bạn nhé.</p>
      <form className="stack" onSubmit={e => { e.preventDefault(); onSave(new FormData(e.currentTarget).get('wish') as string); }}>
        <textarea name="wish" rows={2} maxLength={200} required placeholder="Mình ước…" />
        <button className="btn">Gửi điều ước lên trời ✨</button>
      </form>
    </Sheet>
  );
}
