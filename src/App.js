import { useState } from "react"


const Scrim = ({ map, code }) => {
  const thumbnailUrl = map
    .replace(":", "")
    .replace("'", "")
    .replace(" ", "")
    .replace(" ", "")

  return (
    <div className="container">
      <div className="first">
        <img className="map-thumbnail" src={`/maps/${thumbnailUrl}.webp`}/>

        <div className="info">
          <p className="info__map">{ map }</p>
          <p className="info__code">{ code }</p>
        </div>
      </div>
    </div>

  )
}



function App() {


  return (
    <div className="App">
      <h1>scrimmify</h1>

      <Scrim map={"Shambali Monastery"} code={"ABCDEF"} />
      <Scrim map={"New Queen Street"} code={"ABCDEF"} />
      <Scrim map={"Eichenwalde"} code={"ABCDEF"} />
      <Scrim map={"Blizzard World"} code={"ABCDEF"} />


    </div>
  )
}

export default App
