import React, {ReactNode} from 'react';

type FullScreenTogglerProps = {
  children: ReactNode
}

const FullScreenToggler = ({children}: FullScreenTogglerProps) => {
  return <>
    <div className="full-screen-toggle" style={{position: "fixed", top: 0, bottom: 0, left: 0, right: 0}}>
      {children}
      {/*<p style={{position:'absolute', bottom: 10, width: '100%', textAlign: 'center', color:'#666'}}>*/}
      {/*  ⬆️ 밀어서 전체화면으로*/}
      {/*</p>*/}
    </div>
  </>;
};

export default FullScreenToggler;