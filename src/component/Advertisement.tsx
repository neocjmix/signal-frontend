import React, {useContext} from 'react';
import './Advertizement.scss'
import {appContext} from "../App/AppStore";

const Advertisement = () => {
  const {setMode} = useContext(appContext);
  return (
    <div className="advertisement" onDoubleClick={() => setMode(mode => mode === 'prod' ? 'dev' : 'prod')}>
      광고영역
    </div>
  );
};

export default Advertisement;