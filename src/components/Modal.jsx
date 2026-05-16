import { useEffect } from 'react';

export default function Modal({ titulo, subtitulo, onClose, children }) {
  useEffect(() => {
    const handler = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">x</button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
