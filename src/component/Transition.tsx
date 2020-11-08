import React, {useEffect, useRef, useState} from "react"
import {Route} from "react-router-dom"
import './transition.scss'

export const direction = {
  TOP: Symbol('top'),
  RIGHT: Symbol('right'),
  BOTTOM: Symbol('bottom'),
  LEFT: Symbol('left'),
}

const TransitionSwitch = ({on, off}: { on: () => void, off: () => void }) => {
  const onRef = useRef(on);
  const offRef = useRef(off);

  useEffect(() => {
    onRef.current = on
  }, [on])

  useEffect(() => {
    offRef.current = off
  }, [off])

  useEffect(() => {
    onRef.current()
    return offRef.current
  }, [])
  return null
}

type PopupProps = {
  path: string,
  exact?: boolean,
  from: Symbol,
  disableOnFirst?: boolean,
  transition?: string,
  children: React.ReactNode
};

export const Popup = ({path, exact, from, disableOnFirst = false, transition = '.3s', children}: PopupProps) => {
  const [isOn, setOn] = useState(disableOnFirst)
  const ref = useRef<HTMLDivElement>(null)
  const shouldBeOnRef = useRef<boolean>(false)
  const [isPresent, setPresent] = useState(disableOnFirst)

  const isOnRef = useRef<boolean>(isOn)
  useEffect(() => {
    isOnRef.current = isOn
  }, [isOn])

  useEffect(() => {
    if (ref.current == null) return

    const transitionendListener = () => {
      if (!isOnRef.current) setPresent(false)
    }
    const container = ref.current

    container.addEventListener('transitionend', transitionendListener)
    return () => container.removeEventListener('transitionend', transitionendListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current])


  useEffect(() => {
    if (isPresent && ref.current != null && shouldBeOnRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const causeReflow = ref.current.offsetWidth; // do not remove : trick for transition start
      setOn(true);
      shouldBeOnRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent, ref.current])

  return (
    <>
      <Route path={path} exact={exact}>
        <TransitionSwitch
          on={() => {
            setPresent(true);
            shouldBeOnRef.current = true;
          }}
          off={() => setOn(false)}/>
      </Route>
      {isPresent && (
        <div ref={ref} className={`transition popup ${isOn ? 'on' : from.description}`}
             style={{transition: transition}}>
          {children}
        </div>)}
    </>
  )
}
