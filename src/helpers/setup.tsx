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
import { getDeployedTestAccountsWallets } from '@aztec/accounts/testing'
// import { getSchnorrAccount } from '@aztec/accounts/schnorr'

import { CounterContract } from '../artifacts/Counter'

const PXE_URL = 'http://192.168.29.169:8080'

export const getPXEClient = async () => {
  const pxe = createPXEClient(PXE_URL)
  await waitForPXE(pxe)
  return pxe
}

try {
  console.log(process.env)
  let pxe = await getPXEClient()
  let accounts = await pxe.getRegisteredAccounts()
  console.log(accounts)
  //let number = await pxe.getBlockNumber()
  console.log(await pxe.getBlockNumber())
} catch (e) {
  console.log(e)
}

export async function interactWithCounter() {
  try {
    const pxe = await getPXEClient()
    await waitForPXE(pxe)
    const nodeInfo = await pxe.getNodeInfo()
    console.log('Aztec sandbox info 43', nodeInfo)
    const accounts = await getDeployedTestAccountsWallets(pxe)
    console.log('Accounts', accounts)
    const yashWallet = accounts[0]
    const satyamWallet = accounts[1]
    const yash = yashWallet.getAddress()
    const satyam = satyamWallet.getAddress()
    console.log(`Loaded yash's account at ${yash.toShortString()}`)
    console.log(`Loaded satyam's account at ${satyam.toShortString()}`)
    const contract = await CounterContract.deploy(satyamWallet, 5, satyam, satyam).send().deployed()
    console.log(`Contract successfully deployed at address ${contract.address.toShortString()}`)
    const counterContractSatyam = await CounterContract.at(contract.address, satyamWallet)
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    await counterContractSatyam.methods.increment(satyam, satyam).send().wait()
    const satyamValue = await counterContractSatyam.methods.get_counter(satyam).simulate()
    console.log(`Satyam's new counter ${satyamValue}`)
  } catch (e) {
    console.error('Counter error', e)
  }
}

// async function deployContract() {}
