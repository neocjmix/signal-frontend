declare module 'prevent-default' {
  export default function(eventHandler:(e:React.BaseSyntheticEvent | Event) => void)
}