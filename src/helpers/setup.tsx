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
  GrumpkinScalar,
} from '@aztec/aztec.js'
import { getDeployedTestAccountsWallets } from '@aztec/accounts/testing'
import { getSchnorrAccount } from '@aztec/accounts/schnorr'

import { CounterContract } from '../artifacts/Counter'

const PXE_URL = 'http://localhost:8080'

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
    const aliceWallet = accounts[0]
    const bobWallet = accounts[1]
    const alice = aliceWallet.getAddress()
    const bob = bobWallet.getAddress()
    console.log(`Loaded alice's account at ${alice.toShortString()}`)
    console.log(`Loaded bob's account at ${bob.toShortString()}`)
    const contract = await CounterContract.deploy(bobWallet, 5, bob, bob).send().deployed()
    console.log(`Contract successfully deployed at address ${contract.address.toShortString()}`)
    const counterContractbob = await CounterContract.at(contract.address, bobWallet)
    await counterContractbob.methods.increment(bob, bob).send().wait()
    await counterContractbob.methods.increment(bob, bob).send().wait()
    await counterContractbob.methods.increment(bob, bob).send().wait()
    await counterContractbob.methods.increment(bob, bob).send().wait()
    await counterContractbob.methods.increment(bob, bob).send().wait()
    await counterContractbob.methods.increment(bob, bob).send().wait()
    const bobValue = await counterContractbob.methods.get_counter(bob).simulate()
    console.log(`Bob's new counter ${bobValue}`)
  } catch (e) {
    console.error('Counter error', e)
  }
}

// async function deployContract() {}

export async function createAccount() {
  try{
    const secretKey = Fr.random();
    const signingPrivateKey = GrumpkinScalar.random();
    const pxe = createPXEClient(PXE_URL);
    const wallet = await getSchnorrAccount(pxe, secretKey, signingPrivateKey).waitSetup();
    console.log('Account created', wallet.getAddress().toShortString());
  }
 catch(e){
    console.error('Account error', e)
 }
}
