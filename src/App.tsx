import React from 'react'
import { interactWithCounter } from './helpers/setup'

function App() {
  return (
    <div className="flex justify-center items-center h-screen w-screen">
      <h1 className="text-4xl font-bold text-blue-600">Aztec Starter</h1>
      <button onClick={interactWithCounter}>CounterInteraction</button>
    </div>
  )
}

export default App
