import React from 'react';
import { isChunkError, reloadForNewVersion } from '../lib/stale-reload';

/* Anything that breaks while drawing the page shows this, never a white screen. */
export class ErrorScreen extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // A page's code from an older version of the site: reload to get the new one.
    if (isChunkError(error)) reloadForNewVersion();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="error-screen" role="alert">
        <h1>Something went wrong</h1>
        <p>Reload the page to carry on.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
