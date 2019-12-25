import React from 'react';

export default function ErrorPage({ error }) {
  return (
    <React.Fragment>
      <p>{error.status} - {error.message}</p>
      <code>{error.stack}</code>
    </React.Fragment>
  );
}
