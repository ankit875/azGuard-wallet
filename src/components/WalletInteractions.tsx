import React, { useState } from 'react'
import {
    AccountWalletWithSecretKey,
    AztecAddress,
    computeSecretHash,
    Contract,
    createPXEClient,
    ExtendedNote,
    Fr,
    Note,
} from '@aztec/aztec.js'
import chalk from 'chalk'
import { toast } from 'react-hot-toast'
import { TokenContract } from '@aztec/noir-contracts.js'
import { useAccount } from '../hooks/useAccounts.js'
import { Spinner } from './spinner.js'
// import { creatCustomAccount } from '../helpers/AccountContract.js'

export const WalletInteractions = () => {
  const { deployToken, createCustomAccount } = useAccount()
  const [wallets, setWallets] = useState<AccountWalletWithSecretKey[]>([])
  const [currentWallet, setCurrentWallet] = useState<AccountWalletWithSecretKey | null>(null)
  const [isInProgressObj, setIsInProgressObj] = useState<{ [key: string]: boolean }>({})
  const [tokenContract, setTokenContract] = useState<Contract | null>(null)
  const [receipentAddress, setReceipentAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState<number>(0)
  const [transactionStatus, setTransactionStatus] = useState<string>('')

  const handleCreateAccount = async () => {
    setIsInProgressObj({ ...isInProgressObj, createAccount: true })
    const wallet = await createCustomAccount()
    if (wallet) {
      setWallets([...wallets, wallet])
    }
    setIsInProgressObj({ ...isInProgressObj, createAccount: false })
  }

  const handleDeployToken = async () => {
    if (!currentWallet) {
      console.error('Current Wallet not found!')
      return
    }
    setIsInProgressObj({ ...isInProgressObj, deployToken: true })
    const tokenContract = await deployToken(currentWallet)
    setTokenContract(tokenContract)
    setIsInProgressObj({ ...isInProgressObj, deployToken: false })
  }

  const handleMintPublic100 = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or address')
      return
    }
    setIsInProgressObj({ ...isInProgressObj, mintPublic: true })
    const tx = await tokenContract.methods.mint_public(currentWallet.getAddress(), 100n).send()  
    const receipt = await tx.wait()
    setTransactionStatus(`Transaction status: ${receipt.status}`)
    setIsInProgressObj({ ...isInProgressObj, mintPublic: false })
  }

  const handleMintPrivate100 = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or address')
      return
    }
    setIsInProgressObj({ ...isInProgressObj, mintPrivate: true })
    const random = Fr.random()
    const secretHash = await computeSecretHash(random)
    const tx = await tokenContract.methods.mint_private(100n, secretHash).send()
    const receipt = await tx.wait()
    setTransactionStatus(`Transaction status: ${receipt.status}`)
    const note = new Note([new Fr(100n), secretHash])
    const extendedNote = new ExtendedNote(
      note,
      currentWallet.getAddress(),
      tokenContract.address,
      TokenContract.storage.pending_shields.slot,
      TokenContract.notes.TransparentNote.id,
      receipt.txHash
    )
    await currentWallet.addNote(extendedNote)
    const tx1 = await tokenContract.methods
      .redeem_shield(currentWallet.getAddress(), 100n, random)
      .send()
    const receipt1 = await tx1.wait()
    setTransactionStatus(`Transaction status: ${receipt1.status}`)
    setIsInProgressObj({ ...isInProgressObj, mintPrivate: false })
  }

  const checkBalancePublic = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or address')
      return
    }
    const balance = await tokenContract.methods
      .balance_of_public(currentWallet.getAddress())
      .simulate()
    toast.success(
      `Public Balance of address ${currentWallet.getAddress().toShortString()}: ${balance}`
    )
  }

  const checkBalancePrivate = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or address')
      return
    }
    const balance = await tokenContract.methods
      .balance_of_private(currentWallet.getAddress())
      .simulate()
    toast.success(
      `Private Balance of address ${currentWallet.getAddress().toShortString()}: ${balance}`
    )
  }

  const handlePublicTransfer = async () => {
    if (!receipentAddress || transferAmount === 0 || !tokenContract || !currentWallet) {
      return toast.error(`Invalid call`)
    }
    try {
      setIsInProgressObj({ ...isInProgressObj, transferPublic: true })
      const tx = await tokenContract.methods
        .transfer_public(
          currentWallet.getAddress(),
          receipentAddress,
          BigInt(transferAmount),
          BigInt(0)
        )
        .send()
      const receipt1 = await tx.wait()
      setTransactionStatus(`Transaction status: ${receipt1.status}`)
    } catch (e:any) {
      toast.error(e.toString())
    } finally {
      setIsInProgressObj({ ...isInProgressObj, transferPublic: false })
    }
  }

  const handlePrivateTransfer = async () => {
    if (!receipentAddress || transferAmount === 0 || !tokenContract || !currentWallet) {
      return toast.error(`Invalid call`)
    }
    try {
      setIsInProgressObj({ ...isInProgressObj, transferPrivate: true })
      const tx = (await TokenContract.at(tokenContract.address, currentWallet)).methods
        .transfer(receipentAddress as any as AztecAddress, transferAmount)
        .send()
      const receipt1 = await tx.wait()
      setTransactionStatus(`Transaction status: ${receipt1.status}`)
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setIsInProgressObj({ ...isInProgressObj, transferPrivate: false })
    }
  }

  const handleMovingTokensPublic = async () => {
    if (!receipentAddress || transferAmount === 0 || !tokenContract || !currentWallet) {
      return toast.error(`Invalid call`)
    }
    try {
      setIsInProgressObj({ ...isInProgressObj, movingPublic: true })
      const tx = await tokenContract.methods
        .unshield(
          currentWallet.getAddress(),
          receipentAddress,
          BigInt(transferAmount),
          BigInt(0)
        )
        .send()
      const receipt1 = await tx.wait()
      setTransactionStatus(`Transaction status: ${receipt1.status}`)
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setIsInProgressObj({ ...isInProgressObj, movingPublic: false })
    }
  }

  const handleMovingTokensPrivate= async () => {
    if (!receipentAddress || transferAmount === 0 || !tokenContract || !currentWallet) {
      return toast.error(`Invalid call`)
    }
    try {
      setIsInProgressObj({ ...isInProgressObj, movingPrivate: true })
      const random = Fr.random()
      const secretHash = await computeSecretHash(random)
      const tx = await tokenContract.methods
        .shield(
          currentWallet.getAddress(),
          BigInt(transferAmount),
          secretHash,
          BigInt(0),
        )
        .send()
      const receipt1 = await tx.wait()
      setTransactionStatus(`Transaction status: ${receipt1.status}`)
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setIsInProgressObj({ ...isInProgressObj, movingPrivate: false })
    }
  }

return (
  <main className="min-h-screen bg-gray-100 p-4 md:p-8">
  <div className="flex flex-col md:flex-row gap-4">
    {/* Wallets and Actions Section */}
    <div className="flex-1 bg-white shadow-md rounded-lg p-4 min-w-[300px] w-full md:w-[350px]">
      <h2 className="text-lg font-semibold mb-4">Wallets</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {wallets.length > 0 ? (
          wallets.map((wallet, idx) => (
            <button
              key={wallet.getAddress().toShortString()}
              onClick={() => setCurrentWallet(wallet)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Wallet {idx + 1}
            </button>
          ))
        ) : (
          <div className="text-gray-500">No wallets created yet</div>
        )}
      </div>

      <div className="border-t border-gray-300 pt-4">
        <h2 className="text-lg font-semibold mb-2">Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCreateAccount}
            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-between"
          >
            Create Wallet {isInProgressObj.createAccount && <Spinner />}
          </button>
          <button
            onClick={handleDeployToken}
            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-between"
          >
            Deploy Token {isInProgressObj.deployToken && <Spinner />}
          </button>
          <button
            onClick={handleMintPublic100}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-between"
          >
            Mint Public {isInProgressObj.mintPublic && <Spinner />}
          </button>
          <button
            onClick={handleMintPrivate100}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-between"
          >
            Mint Private {isInProgressObj.mintPrivate && <Spinner />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={checkBalancePublic}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Check Public Balance
          </button>
          <button
            onClick={checkBalancePrivate}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Check Private Balance
          </button>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4">
        <h2 className="text-xl font-semibold mb-4">Transfers</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={receipentAddress}
            onChange={(e) => setReceipentAddress(e.target.value)}
            placeholder="Enter Recipient Address"
            className="border border-gray-300 px-4 py-2 rounded-lg w-full"
          />
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(+e.target.value)}
            placeholder="Transfer Amount"
            className="border border-gray-300 px-4 py-2 rounded-lg w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePublicTransfer}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              Public Transfer {isInProgressObj.transferPublic && <Spinner />}
            </button>
            <button
              onClick={handlePrivateTransfer}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              Private Transfer {isInProgressObj.transferPrivate && <Spinner />}
            </button>
            <button
              onClick={handleMovingTokensPublic}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              Move Tokens Public {isInProgressObj.movingPublic && <Spinner />}
            </button>
            <button
              onClick={handleMovingTokensPrivate}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              Move Tokens Private {isInProgressObj.movingPrivate && <Spinner />}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Output Section */}
  <div className="bg-black shadow-md rounded-lg p-6 min-w-[300px] w-full md:w-[350px] h-80 overflow-y-auto">
    <h2 className="text-xl font-semibold mb-4">Output</h2>
    <div className="max-h-full">
      {currentWallet && (
        <p className="mb-2">Current Wallet Address: {currentWallet.getAddress().toString()}</p>
      )}
      {tokenContract && (
        <p className="mb-2">Deployed Token Address: {tokenContract.address.toString()}</p>
      )}
      {transactionStatus && (
        <p className="mt-4 text-green-600">{transactionStatus}</p>
      )}
    </div>
  </div>
  </div>
</main>

);

  
}
