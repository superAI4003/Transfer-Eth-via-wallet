import React, { useEffect, useState, createContext } from 'react'
import { ethers } from 'ethers'

import { contractABI, contractAddress } from '../utils/constants'

export const TransactionContext = createContext()

const { ethereum } = window

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer)

    return transactionContract
}

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('')
    const [formData, setFormData] = useState({addressTo: '', amount: '', keyword: '', message: ''})
    const [isLoading, setIsLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    const [transactions, setTransactions] = useState([])

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }))
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            // Get all transactions from smart contract
            const transactionContract = getEthereumContract()
            const availableTransactions = await transactionContract.getAllTransactions()

            // Convert data, structs to objects
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
            }))

            // Update state
            setTransactions(structuredTransactions)

        } catch (error) {
            console.log(error)
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            // Get wallet accounts
            const accounts = await ethereum.request({method: 'eth_accounts'})
            if (!accounts.length) return console.log('No accounts found')
            
            // Update state
            setCurrentAccount(accounts[0])
            getAllTransactions()

        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const checkIfTransactionsExist = async () => {
        try {
            // Get transaction count
            const transactionContract = getEthereumContract()
            const transactionCount = await transactionContract.getTransactionCount()
            
            // Update state
            window.localStorage.setItem("transactionCount", transactionCount)
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            // Request wallet
            const accounts = await ethereum.request({method: 'eth_requestAccounts'})

            // Set account
            setCurrentAccount(accounts[0])
        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert('Please install metamask')

            // Extract form data
            const { addressTo, amount, keyword, message } = formData
            const transactionContract = getEthereumContract()
            const parsedAmount = ethers.utils.parseEther(amount)

            // Send transaction
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 Gwei
                    value: parsedAmount._hex, 
                }]
            })

            //  Add to blockchain, get hash
            const transactionReceipt = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword)

            // Wait for transaction to be confirmed
            setIsLoading(true) // console.log(`Loading - ${transactionReceipt.hash}`)
            await transactionReceipt.wait()
            setIsLoading(false) // console.log(`Success - ${transactionReceipt.hash}`)

            // Update count
            const transactionCount = await transactionContract.getTransactionCount()
            setTransactionCount(transactionCount.toNumber())

            // Clear form and refresh transaction history
            getAllTransactions()
            document.getElementById("transaction-form").reset()

        } catch (error) {
            console.log(error)
            throw new Error("No ethereum object.")
        }
    }

    // Check wallet and transactions on load
    useEffect(() => {
        checkIfWalletIsConnected()
        checkIfTransactionsExist()
    }, [])

    // Get all transactions after connecting account
    useEffect(() => {
        if (currentAccount) getAllTransactions()
    }, [currentAccount])

    return (
        <TransactionContext.Provider value={{ currentAccount, connectWallet, formData, sendTransaction, handleChange, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}