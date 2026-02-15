import axios from 'axios';

const API_BASE = 'https://api.kaspa.org';

export interface NetworkInfo {
  networkName: string;
  blockCount: string;
  headerCount: string;
  difficulty: number;
  virtualDaaScore: string;
  pastMedianTime: string;
}

export interface BlueScoreResponse {
  blueScore: number;
}

export interface HashrateResponse {
  hashrate: number;
}

export interface PriceResponse {
  price: number;
}

export interface CoinSupplyResponse {
  circulatingSupply: string;
  maxSupply: string;
}

export interface Transaction {
  transaction_id: string;
  block_time: number;
  is_accepted: boolean;
  inputs?: TransactionInput[];
  outputs?: TransactionOutput[];
}

export interface TransactionInput {
  previous_outpoint_address?: string;
  previous_outpoint_amount?: number;
}

export interface TransactionOutput {
  amount: number;
  script_public_key_address: string;
}

export interface BlockInfo {
  header: {
    timestamp: string;
    blueScore: string;
    daaScore: string;
  };
  verboseData: {
    hash: string;
    difficulty: number;
    transactionIds: string[];
  };
}

// Fetch network/blockdag info
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const response = await axios.get(`${API_BASE}/info/blockdag`);
  return response.data;
}

// Fetch current blue score
export async function getBlueScore(): Promise<BlueScoreResponse> {
  const response = await axios.get(`${API_BASE}/info/virtual-chain-blue-score`);
  return response.data;
}

// Fetch hashrate
export async function getHashrate(): Promise<HashrateResponse> {
  const response = await axios.get(`${API_BASE}/info/hashrate`);
  return response.data;
}

// Fetch price
export async function getPrice(): Promise<PriceResponse> {
  const response = await axios.get(`${API_BASE}/info/price`);
  return response.data;
}

// Fetch coin supply
export async function getCoinSupply(): Promise<CoinSupplyResponse> {
  const response = await axios.get(`${API_BASE}/info/coinsupply`);
  return response.data;
}

// Fetch recent blocks by blue score
export async function getRecentBlocks(blueScore: number, limit: number = 10): Promise<BlockInfo[]> {
  const response = await axios.get(`${API_BASE}/blocks-from-bluescore`, {
    params: {
      blueScoreGte: blueScore - limit,
      includeTransactions: false
    }
  });
  return response.data;
}

// Fetch transaction by ID
export async function getTransaction(txId: string): Promise<Transaction> {
  const response = await axios.get(`${API_BASE}/transactions/${txId}`);
  return response.data;
}

// Fetch transactions for an address
export async function getAddressTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
  const response = await axios.get(`${API_BASE}/addresses/${address}/full-transactions`, {
    params: { limit }
  });
  return response.data;
}

// Fetch address balance
export async function getAddressBalance(address: string): Promise<{ balance: number }> {
  const response = await axios.get(`${API_BASE}/addresses/${address}/balance`);
  return response.data;
}

// Check if transaction exists (for verification)
export async function verifyTransaction(txId: string): Promise<{
  exists: boolean;
  transaction?: Transaction;
  error?: string;
}> {
  try {
    const tx = await getTransaction(txId);
    return { exists: true, transaction: tx };
  } catch (error) {
    return { exists: false, error: 'Transaction not found' };
  }
}

// Aggregate network stats
export async function getNetworkStats() {
  const [networkInfo, blueScore, hashrate, price, coinSupply] = await Promise.all([
    getNetworkInfo(),
    getBlueScore(),
    getHashrate(),
    getPrice(),
    getCoinSupply()
  ]);

  return {
    networkName: networkInfo.networkName,
    blockCount: parseInt(networkInfo.blockCount),
    blueScore: blueScore.blueScore,
    difficulty: networkInfo.difficulty,
    hashrate: hashrate.hashrate,
    price: price.price,
    circulatingSupply: parseFloat(coinSupply.circulatingSupply) / 1e8,
    maxSupply: parseFloat(coinSupply.maxSupply) / 1e8,
    daaScore: parseInt(networkInfo.virtualDaaScore),
    pastMedianTime: parseInt(networkInfo.pastMedianTime)
  };
}
