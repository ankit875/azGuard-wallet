import React, { useState } from 'react'
// import { createAccount } from '../handlers/create-account.js'
// import { CREATE_ACCOUNT_DEFAULT_PARAMS } from '../constants.js'

// import { FeeOpts } from '../utils/options/fees.js'
import {
    AccountWalletWithSecretKey,
    AztecAddress,
    computeSecretHash,
    Contract,
    ExtendedNote,
    Fr,
    Note,
} from '@aztec/aztec.js'
import chalk from 'chalk'
import { toast } from 'react-hot-toast'
import { TokenContract } from '@aztec/noir-contracts.js'
import { useAccount } from '../hooks/useAccounts.js'
import { Spinner } from './spinner.js'

export const WalletInteractions = () => {
  const { deployToken, createAccount } = useAccount()
  const [wallets, setWallets] = useState<AccountWalletWithSecretKey[]>([])
  const [currentWallet, setCurrentWallet] = useState<AccountWalletWithSecretKey | null>(null)
  const [isInProgressObj, setIsInProgressObj] = useState<{ [key: string]: boolean }>({})
  const [tokenContract, setTokenContract] = useState<Contract | null>(null)
  const [receipentAddress, setReceipentAddress] = useState('')
  const [transferAmount, setTransferAmount] = useState<number>(0)
  const [transactionStatus, setTransactionStatus] = useState<string>('')
  const handleCreateAccount = async () => {
    setIsInProgressObj({ ...isInProgressObj, createAccount: true })
    // // createAccount({client: pxeAtom, ...CREATE_ACCOUNT_DEFAULT_PARAMS});
    const wallet = await createAccount()
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
    console.log('Deploying token')
    const tokenContract = await deployToken(currentWallet)
    setTokenContract(tokenContract)

    setIsInProgressObj({ ...isInProgressObj, deployToken: false })
  }

  const handleMintPublic100 = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or addrees')
      return
    }
    setIsInProgressObj({ ...isInProgressObj, mintPublic: true })
    const tx = await tokenContract.methods.mint_public(currentWallet.getAddress(), 100n).send()

    console.log(`Sent mint transaction ${await tx.getTxHash()}`)
    console.log(chalk.blackBright('Awaiting transaction to be mined'))
    const receipt = await tx.wait()
    setTransactionStatus(`Transaction status: ${receipt.status}`);
    console.log(
      chalk.green(`Transaction has been mined on block ${chalk.bold(receipt.blockNumber)}`)
    )
    setIsInProgressObj({ ...isInProgressObj, mintPublic: false })
  }

  const handleMintPrivate100 = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or addrees')
      return
    }

    setIsInProgressObj({ ...isInProgressObj, mintPrivate: true })
    const random = Fr.random()
    const secretHash = await computeSecretHash(random)

    const tx = await tokenContract.methods.mint_private(100n, secretHash).send()
    console.log(`Sent mint transaction ${await tx.getTxHash()}`)
    console.log(chalk.blackBright('Awaiting transaction to be mined'))
    const receipt = await tx.wait()
    setTransactionStatus(`Transaction status: ${receipt.status}`);
    console.log(
      chalk.green(`Transaction has been mined on block ${chalk.bold(receipt.blockNumber)}`)
    )
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

    console.log(
      chalk.bgBlueBright(
        `Redeeming created note for second wallet: ${currentWallet.getAddress()} \n`
      )
    )

    const tx1 = await tokenContract.methods
      .redeem_shield(currentWallet.getAddress(), 100n, random)
      .send()
    console.log(`Sent mint transaction ${await tx.getTxHash()}`)
    console.log(chalk.blackBright('Awaiting transaction to be mined'))
    const receipt1 = await tx1.wait()
    setTransactionStatus(`Transaction status: ${receipt1.status}`);
    console.log(
      chalk.green(`Transaction has been mined on block ${chalk.bold(receipt1.blockNumber)}`)
    )
    setIsInProgressObj({ ...isInProgressObj, mintPrivate: false })
  }

  const checkBalancePublic = async () => {
    if (!tokenContract || !currentWallet) {
      console.error('no contract or addrees')
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
      console.error('no contract or addrees')
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
      console.log(`Sent mint transaction ${await tx.getTxHash()}`)
      console.log(chalk.blackBright('Awaiting transaction to be mined'))
      const receipt1 = await tx.wait()
      console.log(
        chalk.green(`Transaction has been mined on block ${chalk.bold(receipt1.blockNumber)}`)
      )
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
      console.log(`Sent mint transaction ${await tx.getTxHash()}`)
      console.log(chalk.blackBright('Awaiting transaction to be mined'))
      const receipt1 = await tx.wait()
      console.log(
        chalk.green(`Transaction has been mined on block ${chalk.bold(receipt1.blockNumber)}`)
      )
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
      console.log(`Sent mint transaction ${await tx.getTxHash()}`)
      console.log(chalk.blackBright('Awaiting transaction to be mined'))
      const receipt1 = await tx.wait()
      console.log(
        chalk.green(`Transaction has been mined on block ${chalk.bold(receipt1.blockNumber)}`)
      )
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setIsInProgressObj({ ...isInProgressObj, movingPublic: false })
    }
  }

  return (
    <main className="h-screen w-full">
      <h1> Wallet Interactions</h1>
      <div className="flex h-full p-8">
        <div className="flex-1">
          {wallets.map((wallet, idx) => (
            <button
              key={wallet.getAddress().toShortString()}
              onClick={() => {
                setCurrentWallet(wallet)
              }}
            >
              Wallet{idx + 1}
            </button>
          ))}

          <div className="actions flex flex-col border px-8 gap-6">
            {/* <button onClick={() => interactWithCounter(pxeClient!)}> Wallet Interaction</button> */}
            <button onClick={handleCreateAccount}>
              Create New Wallet {isInProgressObj.createAccount && <Spinner />}
            </button>
            <button onClick={handleDeployToken} className="flex items-center">
              Deploy Token {isInProgressObj.deployToken && <Spinner />}
            </button>
            <button onClick={handleMintPublic100} className="flex items-center">
              Mint Public {isInProgressObj.mintPublic && <Spinner />}
            </button>
            <button onClick={handleMintPrivate100} className="flex items-center">
              Mint Private {isInProgressObj.mintPrivate && <Spinner />}
            </button>
            <button onClick={checkBalancePublic}>Check Public Balance</button>
            <button onClick={checkBalancePrivate}>Check Private Balance</button>
          </div>

          <div className="border border-blue-500 p-8 flex flex-col gap-2">
            <input
              type="text"
              value={receipentAddress}
              onChange={(e) => {
                setReceipentAddress(e.target.value)
              }}
              placeholder="Enter Receipent Address"
              className="px-4 py-2"
            />
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(+e.target.value)
              }}
              placeholder="Transfer Amount"
              className="px-4 py-2"
            />
            <button onClick={handlePublicTransfer}>
              Public Transfer {isInProgressObj.transferPublic && <Spinner />}
            </button>
            <button onClick={handlePrivateTransfer}>
              Private Transfer {isInProgressObj.transferPrivate && <Spinner />}
            </button>
            <button onClick={handleMovingTokensPublic}>
              Private To Public {isInProgressObj.movingPublic && <Spinner />}
            </button>
          </div>
        </div>
        <div className="output border flex flex-1 bg-pink-300 text-black flex-col gap-2 p-8">
          {currentWallet && <p>Current Wallet Address: {currentWallet.getAddress().toString()}</p>}
          {tokenContract && <p>Deployed Token Address: {tokenContract.address.toString()}</p>}
          {transactionStatus && <p>{transactionStatus}</p>}
        </div>
      </div>
    </main>
  )
}