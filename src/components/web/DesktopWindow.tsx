import React, { useEffect, useState } from 'react';
import { BrandMark } from './BrandMark';

interface Props {
  title: string;
  /** Red traffic light: close / exit. */
  onClose: () => void;
  children: React.ReactNode;
}

const clock = () =>
  new Date().toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * On computers the CBT runs like a desktop app: a wallpaper, a slim menu bar
 * and a window with traffic lights. On phones and tablets the frame
 * disappears and the page fills the screen as before (see exam-desktop.css).
 */
export const DesktopWindow: React.FC<Props> = ({ title, onClose, children }) => {
  const [now, setNow] = useState(clock);

  useEffect(() => {
    const t = window.setInterval(() => setNow(clock()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="dsk">
      <div className="dsk__menubar" aria-hidden>
        <span className="dsk__app">
          <BrandMark />
        </span>
        <span>File</span>
        <span>View</span>
        <span>Help</span>
        <span className="dsk__clock">{now}</span>
      </div>

      <div className="dsk__window">
        <div className="dsk__titlebar">
          <span className="dsk__lights">
            <button type="button" className="dsk__light dsk__light--close" onClick={onClose} aria-label="Close" />
            <i className="dsk__light dsk__light--min" aria-hidden />
            <i className="dsk__light dsk__light--max" aria-hidden />
          </span>
          <span className="dsk__title">{title}</span>
        </div>
        <div className="dsk__body">{children}</div>
      </div>
    </div>
  );
};
