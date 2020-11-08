import React, {useEffect, useState} from 'react';

const smilyAndPeople = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "😘", "😗", "😙",
  "😚", "😋", "😜", "😝", "😛", "🤑", "🤗", "🤓", "😎", "🤡", "🤠", "😏", "😒", "😞", "😔", "😟", "😕", "🙁",
  "😣", "😖", "😫", "😩", "😤", "😠", "😡", "😶", "😐", "😑", "😯", "😦", "😧", "😮", "😲", "😵", "😳", "😱", "😨",
  "😰", "😢", "😥", "🤤", "😭", "😓", "😪", "😴", "🙄", "🤔", "🤥", "😬", "🤐", "🤢", "🤧", "😷", "🤒", "🤕",
  "😈", "👿", "👹", "👺", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
  "😿", "😾"]

const getRandomEmoji = () => smilyAndPeople[Math.floor(Math.random() * smilyAndPeople.length)];

const RandomEmoji = ({interval = 500}: { interval?: number }) => {
  const [emoji, setEmoji] = useState(getRandomEmoji());
  useEffect(() => {
    const intervalIndex = setInterval(() => setEmoji(getRandomEmoji()), interval);
    return () => clearInterval(intervalIndex)
  })
  return <>{emoji}</>;
};

export default RandomEmoji;