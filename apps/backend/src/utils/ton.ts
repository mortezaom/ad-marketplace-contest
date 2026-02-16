import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto"
import { Address, internal, SendMode, TonClient, toNano, WalletContractV5R1 } from "@ton/ton"

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
	privateKey: string
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
		address: wallet.address.toString({ testOnly: IS_TESTNET, bounceable: false }),
		privateKey: keyPair.secretKey.toString("hex"),
		publicKey: keyPair.publicKey.toString("hex"),
	}
}

export const checkReceived = async (
	myWalletAddress: string,
	fromAddress: string,
	minAmount = 0n
): Promise<{ received: boolean; hash: string | null }> => {
	const myAddr = Address.parse(myWalletAddress)
	const senderAddr = Address.parse(fromAddress)

	const transactions = await client.getTransactions(myAddr, {
		limit: 20,
		archival: true,
	})

	for (const tx of transactions) {
		const inMsg = tx.inMessage

		if (
			inMsg?.info.type === "internal" &&
			inMsg.info.src &&
			Address.parse(inMsg.info.src.toString()).equals(senderAddr) &&
			inMsg.info.value.coins >= minAmount
		) {
			return {
				received: true,
				hash: tx.hash().toString("hex"),
			}
		}
	}

	return { received: false, hash: null }
}

export async function releaseFundsToOwner(
	escrowPrivateKeyHex: string,
	escrowPublicKeyHex: string,
	ownerAddress: string,
	amountToReleaseTon: number
): Promise<TransferResult> {
	try {
		const secretKey = Buffer.from(escrowPrivateKeyHex, "hex")
		const publicKey = Buffer.from(escrowPublicKeyHex, "hex")

		const wallet = WalletContractV5R1.create({
			workchain: 0,
			publicKey,
		})

		const contract = client.open(wallet)
		const seqno = await contract.getSeqno()

		await contract.sendTransfer({
			seqno,
			secretKey,
			messages: [
				internal({
					to: Address.parse(ownerAddress),
					value: toNano(amountToReleaseTon),
					bounce: false,
					body: "Ad Payment Release",
				}),
			],
			sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS,
		})

		return { success: true }
	} catch (error: unknown) {
		console.error("Fund release failed:", error)
		return { success: false, error: `${error}` }
	}
}
