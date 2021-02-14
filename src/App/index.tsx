import React from 'react';
import AppStore from "./AppStore";
import AppRoot from "../view/AppRoot";

export const App = () => (
  <AppStore>
    <AppRoot/>
  </AppStore>
);
