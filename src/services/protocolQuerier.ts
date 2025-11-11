import { ethers } from 'ethers';
import { StakingProtocol, StakingQuote, StakingRequest } from '../types';
import { ProtocolRegistry } from '../protocols/protocolRegistry';
import { ApyFetcher } from './apyFetcher';
import {
  LIDO_POOL_ABI,
  ROCKET_POOL_DEPOSIT_ABI,
  STAKEWISE_POOL_ABI,
} from '../protocols/contractABIs';


export class ProtocolQuerier {
  private registry: ProtocolRegistry;
  private apyFetcher: ApyFetcher;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(registry: ProtocolRegistry, rpcUrl?: string) {
    this.registry = registry;
    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.apyFetcher = new ApyFetcher(rpcUrl);
    } else {
      throw new Error('RPC URL is required for real data fetching');
    }
  }

  async queryProtocols(request: StakingRequest): Promise<StakingQuote[]> {
    const protocols = this.registry.getProtocols(request.chainId);
    const quotes: StakingQuote[] = [];

    // Query each protocol in parallel
    const quotePromises = protocols.map(protocol =>
      this.getQuoteFromProtocol(protocol, request)
    );

    const results = await Promise.allSettled(quotePromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        quotes.push(result.value);
      } else {
        console.error(
          `Failed to get quote from ${protocols[index].name}:`,
          result.status === 'rejected' ? result.reason : 'Unknown error'
        );
      }
    });

    return quotes;
  }

  private async getQuoteFromProtocol(
    protocol: StakingProtocol,
    request: StakingRequest
  ): Promise<StakingQuote | null> {
    if (!this.provider) {
      throw new Error('RPC provider not configured');
    }

    try {
      const amount = parseFloat(request.amount);
      const minStake = parseFloat(protocol.minStake || '0');
      const maxStake = parseFloat(protocol.maxStake || '1000000000');

      const onChainMin = await this.getProtocolMinStake(protocol);
      const onChainMax = await this.getProtocolMaxStake(protocol);
      
      const effectiveMin = onChainMin ? Math.max(minStake, onChainMin) : minStake;
      const effectiveMax = onChainMax ? Math.min(maxStake, onChainMax) : maxStake;

      if (amount < effectiveMin || amount > effectiveMax) {
        console.log(
          `Amount ${amount} outside protocol limits for ${protocol.name}: ${effectiveMin}-${effectiveMax}`
        );
        return null;
      }

      const apy = await this.apyFetcher.fetchApy(protocol);
      
      protocol.apy = apy;

      if (request.minApy && apy < request.minApy) {
        return null;
      }

      // Calculate expected return based on real APY
      const lockPeriod = request.lockPeriod || protocol.lockPeriod || 365;
      const annualReturn = (amount * apy) / 100;
      const expectedReturn = (annualReturn * lockPeriod) / 365;
      
      // Fetch real fees from protocol
      const feePercentage = await this.apyFetcher.fetchFees(protocol);
      const fees = (expectedReturn * feePercentage).toString();

      // Calculate net return after fees
      const netReturn = expectedReturn * (1 - feePercentage);

      return {
        protocol: { ...protocol, apy },
        amount: request.amount,
        expectedReturn: netReturn.toFixed(6),
        apy,
        fees: fees,
        lockPeriod,
        estimatedRewards: expectedReturn.toFixed(6),
      };
    } catch (error) {
      console.error(`Error querying ${protocol.name}:`, error);
      return null;
    }
  }

  private async getProtocolMinStake(
    protocol: StakingProtocol
  ): Promise<number | null> {
    if (!this.provider) return null;

    try {
      switch (protocol.name) {
        case 'Rocket Pool':
          const rocketPoolContract = new ethers.Contract(
            protocol.address,
            ROCKET_POOL_DEPOSIT_ABI,
            this.provider
          );
          const minDeposit = await rocketPoolContract.getMinimumDeposit();
          return Number(ethers.formatEther(minDeposit));
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Could not fetch min stake for ${protocol.name}:`, error);
      return null;
    }
  }


  private async getProtocolMaxStake(
    protocol: StakingProtocol
  ): Promise<number | null> {
    if (!this.provider) return null;

    try {
      switch (protocol.name) {
        case 'Rocket Pool':
          const rocketPoolContract = new ethers.Contract(
            protocol.address,
            ROCKET_POOL_DEPOSIT_ABI,
            this.provider
          );
          const maxDeposit = await rocketPoolContract.getMaximumDeposit();
          return Number(ethers.formatEther(maxDeposit));
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Could not fetch max stake for ${protocol.name}:`, error);
      return null;
    }
  }
}


