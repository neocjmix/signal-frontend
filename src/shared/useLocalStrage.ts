import {Dispatch, SetStateAction, useEffect, useState} from "react";

const useLocalStrage = (key: string, initValueFunc:() => string): [string, Dispatch<SetStateAction<string>>] => {
  const [value, setValue] = useState<string>(localStorage.getItem(key) || initValueFunc());

  useEffect(() => {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  }, [key, value])

  return [value, setValue];
}
export default useLocalStrage