import React from 'react'
import { interactWithCounter, createAccount, mintToken } from './helpers/setup'

function App() {
  return (
    <>
      <div className="flex justify-center items-center h-screen w-screen">
        <h1 className="text-4xl font-bold text-blue-600">Aztec Starter</h1>
      </div>
      <div className="flex justify-center items-center h-screen w-screen">
        <button onClick={interactWithCounter}>CounterInteraction</button>
        <button onClick={createAccount}>Create Account</button>
        <button onClick={() => { mintToken }}>Mint</button>
      </div>
    </>

  )
}

export default App
