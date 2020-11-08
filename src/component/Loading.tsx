import React from 'react';
import './Loading.scss'

type LoadingProps = {
  tag?: keyof JSX.IntrinsicElements,
  isLoading: boolean,
  bound?: boolean,
  children: React.ReactNode,
  className?: string,
  style?: React.CSSProperties,
};

const Loading = ({tag: Tag = 'div', isLoading, bound = false, className = '', style, children}: LoadingProps) => {
  return (
    <Tag className={`loading-container ${className}`}
         style={{...style, ...bound ? {position: 'relative'} : {}}}>
      {children}
      {isLoading && <div className="spinner"/>}
    </Tag>
  );
};

export default Loading;