/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {FormEvent, MouseEvent, useState} from 'react';

import './style.scss';
import {Redirect} from 'react-router-dom';

export default function Header() {
  const [user, setUser] = useState('');
  const [redirect, setRedirect] = useState((null as unknown) as JSX.Element);

  const go = (e: FormEvent | MouseEvent) => {
    e.preventDefault();
    console.log('GO!');
    setRedirect(() => <Redirect to={'/' + encodeURI(user)} />);
  };

  return (
    <header id="header">
      {redirect}
      <nav className="header-nav">
        <div className="search-box">
          <form className="search-form" onSubmit={go}>
            <input
              type="text"
              placeholder="Get requirements"
              value={user}
              onChange={e => setUser(e.target.value)}
            />
            <input type="button" onClick={go} value="Go" />
          </form>
        </div>
      </nav>
    </header>
  );
}
