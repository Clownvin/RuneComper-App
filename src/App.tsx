/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import './App.scss';
import Header from './components/header';
import {Route, Switch} from 'react-router-dom';

//Pages
import Home from './pages/home/index';
import CompRequirements from './pages/comp-reqs';

function App() {
  return (
    <div id="app">
      <Header />
      <section id="content">
        {/* <Aside /> */}
        <section id="page-content">
          <Switch>
            <Route path="/:user" component={CompRequirements} />
            <Route path="/" component={Home} />
          </Switch>
        </section>
      </section>
    </div>
  );
}

export default App;
