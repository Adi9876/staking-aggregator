export interface StakingProtocol {
  name: string;
  address: string;
  chainId: number;
  apy?: number;
  minStake?: string;
  maxStake?: string;
  lockPeriod?: number;
  poolAddress?: string;
  tokenAddress?: string;
}

export interface StakingQuote {
  protocol: StakingProtocol;
  amount: string;
  expectedReturn: string;
  apy: number;
  fees: string;
  lockPeriod?: number;
  estimatedRewards: string;
}

export interface StakingRequest {
  amount: string;
  tokenAddress: string;
  chainId: number;
  lockPeriod?: number;
  minApy?: number;
}

export interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  protocol: string;
  amount: string;
  error?: string;
}


