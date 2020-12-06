import './AppRoot.scss';
import React, {useContext, useEffect} from 'react';
import {direction, Popup} from "../component/Transition";
import FrontPage from "./frontPage/FrontPage";
import Join from "./join/Join";
import Create from "./create/Create";
import {BrowserRouter, Link, Redirect, Route, Switch, useParams} from "react-router-dom";
import Room from "./room/Room";
import {appContext, AppContext} from "../App/AppStore";
import {getConnectionId} from "../infrastructure/message";
import Loading from "../component/Loading";

export interface RoomParams {
  code: string,
}

const CodeHeader = ({transparent = true, back}: { transparent?: boolean, back?: string }) => {
  const {code} = useParams<RoomParams>();
  return (
    <header className={`screen-header center ${transparent ? 'transparent' : ''}`}>
      <div className="inner">
        {back && <Link className="back-navigation" to={back}>〈</Link>}
        <h1 key="header-title">CODE : {code}</h1>
      </div>
    </header>
  );
};

const Header = () => (
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
      <CodeHeader back="/" transparent/>
    </Route>
    <Route exact path="/create">
      <header className="screen-header center">
        <div className="inner">
          <Link className="back-navigation" to="/">〈</Link>
          <h1 key="header-title">방 만들기</h1>
        </div>
      </header>
    </Route>
    <Redirect to="/"/>
  </Switch>
);

const CodeSetter = () => {
  const {setRoomCode} = useContext(appContext);
  const {code} = useParams<RoomParams>();
  useEffect(() => {
    if (code) setRoomCode(code);
    return () => setRoomCode(null);
  }, [code, setRoomCode])
  return null;
}

const AppRoot = () => {
  const {setConnectionId, connectionId} = useContext<AppContext>(appContext);

  useEffect(() => {
    getConnectionId().then(setConnectionId)
  }, [setConnectionId])

  return (
    <Loading isLoading={!connectionId}>
      {connectionId && (
        <BrowserRouter>
          <div className="App">
            <Header/>
            <Popup path="/" exact disableOnFirst from={direction.LEFT}>
              <FrontPage/>
            </Popup>
            <Popup path="/join" from={direction.RIGHT}>
              <Join/>
            </Popup>
            <Popup path="/create" from={direction.RIGHT}>
              <Create/>
            </Popup>
            <Route path="/:code(\d+)" component={CodeSetter}/>
            <Popup path="/:code(\d+)" from={direction.RIGHT}>
              <Room/>
            </Popup>
          </div>
        </BrowserRouter>
      )}
    </Loading>
  );
};

export default AppRoot;