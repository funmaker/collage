import React from 'react';

export default ({error}) => (
    <React.Fragment>
        <p>{error.status} - {error.message}</p>
        <code>{error.stack}</code>
    </React.Fragment>
);
