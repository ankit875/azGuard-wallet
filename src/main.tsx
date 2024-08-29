import './style.css'
import {
  AccountWallet,
  CompleteAddress,
  ContractDeployer,
  createDebugLogger,
  Fr,
  PXE,
  waitForPXE,
  TxStatus,
  createPXEClient,
  getContractInstanceFromDeployParams,
  DebugLogger,
} from '@aztec/aztec.js'

import './style.css'

const PXE_URL = 'http://192.168.29.169:8080'

const setupSandbox = async () => {
  const pxe = createPXEClient(PXE_URL)
  await waitForPXE(pxe)
  return pxe
}

try {
  console.log(process.env)
  let pxe = await setupSandbox()
  let accounts = await pxe.getRegisteredAccounts()
  console.log(accounts)
  //let number = await pxe.getBlockNumber()
  console.log(await pxe.getBlockNumber())
} catch (e) {
  console.log(e)
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
