import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto"
import {
	Address,
	fromNano,
	internal,
	SendMode,
	TonClient,
	toNano,
	WalletContractV5R1,
} from "@ton/ton"

// ==========================================
// CONFIGURATION
// ==========================================

const IS_TESTNET = true // Set to false for production

// 1. Get an API key from https://t.me/tonapibot (Toncenter)
// 2. Add it to your .env file as TON_API_KEY
const API_KEY = Bun.env.TONCENTER_API_KEY

const RPC_ENDPOINT = IS_TESTNET
	? "https://testnet.toncenter.com/api/v2/jsonRPC"
	: "https://toncenter.com/api/v2/jsonRPC"

// Initialize the client once to be reused
const client = new TonClient({
	endpoint: RPC_ENDPOINT,
	apiKey: API_KEY,
})

// ==========================================
// TYPES
// ==========================================

export interface WalletData {
	address: string
	mnemonic: string[]
	publicKey: string
}

export interface PaymentStatus {
	isPaid: boolean
	actualBalance: string // In TON (not nano)
	requiredAmount: string // In TON
}

export interface TransferResult {
	success: boolean
	txHash?: string
	error?: string
}

export async function createEscrowWallet(): Promise<WalletData> {
	const mnemonic = await mnemonicNew()
	const keyPair = await mnemonicToPrivateKey(mnemonic)

	const wallet = WalletContractV5R1.create({
		workchain: 0,
		publicKey: keyPair.publicKey,
	})

	return {
		address: wallet.address.toString({ testOnly: IS_TESTNET }),
		mnemonic,
		publicKey: keyPair.publicKey.toString("hex"),
	}
}

export async function checkPaymentStatus(
	address: string,
	requiredAmountTon: string
): Promise<PaymentStatus> {
	try {
		const targetAddress = Address.parse(address)

		const balanceNano = await client.getBalance(targetAddress)
		const balanceTon = fromNano(balanceNano)

		const requiredNano = toNano(requiredAmountTon)

		return {
			isPaid: balanceNano >= requiredNano,
			actualBalance: balanceTon,
			requiredAmount: requiredAmountTon,
		}
	} catch (error) {
		console.error("Error checking payment status:", error)
		throw new Error("Failed to fetch wallet balance")
	}
}

export async function releaseFundsToOwner(
	escrowMnemonic: string[],
	destinationAddress: string,
	amountToReleaseTon: string
): Promise<TransferResult> {
	try {
		const keyPair = await mnemonicToPrivateKey(escrowMnemonic)

		const wallet = WalletContractV5R1.create({
			workchain: 0,
			publicKey: keyPair.publicKey,
		})

		const contract = client.open(wallet)

		const seqno = await contract.getSeqno()

		await contract.sendTransfer({
			seqno,
			secretKey: keyPair.secretKey,
			messages: [
				internal({
					to: Address.parse(destinationAddress),
					value: toNano(amountToReleaseTon),
					bounce: false,
					body: "Ad Payment Release",
				}),
			],
			sendMode: SendMode.PAY_GAS_SEPARATELY,
		})

		return { success: true }
	} catch (error: unknown) {
		console.error("Fund release failed:", error)
		return { success: false, error: `${error}` }
	}
}
