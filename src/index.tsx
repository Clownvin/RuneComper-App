/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.scss';
import App from './App';

import {BrowserRouter} from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  // eslint-disable-next-line no-undef
  document.getElementById('root')
);
