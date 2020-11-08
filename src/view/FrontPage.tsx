import React from 'react'
import {Link} from "react-router-dom"
import './FrontPage.scss'
import RandomEmoji from "../component/RandomEmoji";

const FrontPage = () => (
  <section className="frontpage">
    <main>
      <div className="banner">
        <RandomEmoji interval={800}/>
        &nbsp;💻&nbsp;⇆📱&nbsp;
        <RandomEmoji interval={900}/>
      </div>
      <Link to="./join" className="button big join">
        <span className="icon">🔑</span>
        참여하기
      </Link><br/>
      <Link to="./create" className="button big create">
        <span className="icon">🔨</span>
        만들기
      </Link>
    </main>
  </section>
)

export default FrontPage