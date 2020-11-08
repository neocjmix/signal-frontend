import React, {useContext, useEffect} from 'react';
import './App.scss';
import {BrowserRouter, Link, Redirect, Route, Switch, useParams} from "react-router-dom";
import {direction, Popup} from "../component/Transition";
import FrontPage from "../view/FrontPage";
import Room from "../view/Room";
import Join from "../view/Join";
import Create from "../view/Create";
import CreateResult from "../view/CreateResult";
import AppStore, {AppContext, appContext} from "./AppStore";


export const BASENAME = "/signal/";

export interface RoomParams {
  code: string,
}

const CodeHeader = ({transparent = true, back}: { transparent?: boolean, back?: string }) => {
  const {code} = useParams<RoomParams>();
  const {setCurrentRoom} = useContext<AppContext>(appContext);

  useEffect(() => {
    setCurrentRoom(+code);
    return () => setCurrentRoom(null);
  }, [code, setCurrentRoom])

  return (
    <header className={`screen-header center ${transparent ? 'transparent' : ''}`}>
      <div className="inner">
        {back && <Link className="back-navigation" to={back}>〈</Link>}
        <h1 key="header-title">CODE : {code}</h1>
      </div>
    </header>
  );
};

export const App = () => {
  return (
    <AppStore>
      <BrowserRouter basename={BASENAME}>
        <div className="App">
          <Switch>
            <Route path="/" exact>
              <header className="screen-header center big">
                <div className="inner">
                  <h1 className="app-title" key="header-title">Signal</h1>
                </div>
              </header>
            </Route>
            <Route path="/join">
              <header className="screen-header center">
                <div className="inner">
                  <Link className="back-navigation" to="/">〈</Link>
                  <h1 key="header-title">CODE 입력</h1>
                </div>
              </header>
            </Route>
            <Route path="/:code(\d+)">
              <CodeHeader back="/join"/>
            </Route>
            <Route exact path="/create">
              <header className="screen-header center">
                <div className="inner">
                  <Link className="back-navigation" to="/">〈</Link>
                  <h1 key="header-title">방 만들기</h1>
                </div>
              </header>
            </Route>
            <Route path="/create/:code(\d+)">
              <CodeHeader back="/" transparent={false}/>
            </Route>
            <Redirect to="/"/>
          </Switch>
          <Popup path="/" exact disableOnFirst from={direction.LEFT}>
            <FrontPage/>
          </Popup>
          <Popup path="/join" from={direction.RIGHT}>
            <Join/>
          </Popup>
          <Popup path="/create" from={direction.RIGHT}>
            <Create/>
            <Popup path="/create/:code(\d+)" from={direction.RIGHT}>
              <CreateResult/>
            </Popup>
          </Popup>
          <Popup path="/:code(\d+)" from={direction.RIGHT}>
            <Room/>
          </Popup>
        </div>
      </BrowserRouter>
    </AppStore>
  );
};
