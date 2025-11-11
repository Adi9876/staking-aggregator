import { ethers } from "ethers";
import { StakingQuote, ExecutionResult } from "../types";
import {
  LIDO_POOL_ABI,
  ROCKET_POOL_DEPOSIT_ABI,
  STAKEWISE_POOL_ABI,
} from "../protocols/contractABIs";

export class TransactionExecutor {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(rpcUrl?: string) {
    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    } else {
      throw new Error("RPC URL is required for transaction execution");
    }
  }

  async executeTransaction(
    quote: StakingQuote,
    privateKey: string
  ): Promise<ExecutionResult> {
    try {
      if (!this.provider) {
        throw new Error("RPC provider not configured");
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, this.provider);

      // Check wallet balance
      const balance = await this.provider.getBalance(wallet.address);
      const amountWei = ethers.parseEther(quote.amount);

      if (balance < amountWei) {
        return {
          success: false,
          protocol: quote.protocol.name,
          amount: quote.amount,
          error: `Insufficient balance. Required: ${quote.amount} ETH, Available: ${ethers.formatEther(balance)} ETH`,
        };
      }

      // Execute transaction based on protocol
      let txResponse: ethers.TransactionResponse;

      switch (quote.protocol.name) {
        case 'Lido':
          txResponse = await this.executeLidoStake(wallet, quote);
          break;
        case 'Rocket Pool':
          txResponse = await this.executeRocketPoolStake(wallet, quote);
          break;
        case 'StakeWise':
          txResponse = await this.executeStakeWiseStake(wallet, quote);
          break;
        default:
          throw new Error(`Unsupported protocol: ${quote.protocol.name}`);
      }

      // Wait for transaction confirmation
      console.log(`Transaction sent: ${txResponse.hash}`);
      const receipt = await txResponse.wait();

      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }

      if (receipt.status === 0) {
        return {
          success: false,
          protocol: quote.protocol.name,
          amount: quote.amount,
          error: "Transaction failed on-chain",
        };
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        protocol: quote.protocol.name,
        amount: quote.amount,
      };
    } catch (error) {
      console.error("Transaction execution error:", error);
      return {
        success: false,
        protocol: quote.protocol.name,
        amount: quote.amount,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async executeLidoStake(
    wallet: ethers.Wallet,
    quote: StakingQuote
  ): Promise<ethers.TransactionResponse> {
    const poolAddress = quote.protocol.poolAddress || quote.protocol.address;
    const poolContract = new ethers.Contract(
      poolAddress,
      LIDO_POOL_ABI,
      wallet
    );

    const amountWei = ethers.parseEther(quote.amount);

    try {
      const gasEstimate = await poolContract.submit.estimateGas(
        ethers.ZeroAddress,
        { value: amountWei }
      );

      return await poolContract.submit(ethers.ZeroAddress, {
        value: amountWei,
        gasLimit: gasEstimate + BigInt(50000),
      });
    } catch (error) {
      const gasEstimate = await poolContract.submit.estimateGas({
        value: amountWei,
      });

      return await poolContract.submit({
        value: amountWei,
        gasLimit: gasEstimate + BigInt(50000),
      });
    }
  }


  private async executeRocketPoolStake(
    wallet: ethers.Wallet,
    quote: StakingQuote
  ): Promise<ethers.TransactionResponse> {
    const depositPoolContract = new ethers.Contract(
      quote.protocol.address,
      ROCKET_POOL_DEPOSIT_ABI,
      wallet
    );

    const amountWei = ethers.parseEther(quote.amount);

    // Estimate gas
    const gasEstimate = await depositPoolContract.deposit.estimateGas({
      value: amountWei,
    });

    // Execute transaction
    return await depositPoolContract.deposit({
      value: amountWei,
      gasLimit: gasEstimate + BigInt(50000),
    });
  }

  private async executeStakeWiseStake(
    wallet: ethers.Wallet,
    quote: StakingQuote
  ): Promise<ethers.TransactionResponse> {
    const poolContract = new ethers.Contract(
      quote.protocol.address,
      STAKEWISE_POOL_ABI,
      wallet
    );

    const amountWei = ethers.parseEther(quote.amount);

    // Estimate gas
    const gasEstimate = await poolContract.deposit.estimateGas({
      value: amountWei,
    });

    // Execute transaction
    return await poolContract.deposit({
      value: amountWei,
      gasLimit: gasEstimate + BigInt(50000),
    });
  }

  async estimateGas(quote: StakingQuote): Promise<string> {
    if (!this.provider) {
      throw new Error("RPC provider not configured");
    }

    try {
      const amountWei = ethers.parseEther(quote.amount);
      let gasEstimate: bigint;

      switch (quote.protocol.name) {
        case 'Lido': {
          const poolAddress = quote.protocol.poolAddress || quote.protocol.address;
          const poolContract = new ethers.Contract(
            poolAddress,
            LIDO_POOL_ABI,
            this.provider
          );
          try {
            gasEstimate = await poolContract.submit.estimateGas(
              ethers.ZeroAddress,
              { value: amountWei }
            );
          } catch {
            gasEstimate = await poolContract.submit.estimateGas({
              value: amountWei,
            });
          }
          break;
        }
        case 'Rocket Pool': {
          const depositPoolContract = new ethers.Contract(
            quote.protocol.address,
            ROCKET_POOL_DEPOSIT_ABI,
            this.provider
          );
          gasEstimate = await depositPoolContract.deposit.estimateGas({
            value: amountWei,
          });
          break;
        }
        case 'StakeWise': {
          const poolContract = new ethers.Contract(
            quote.protocol.address,
            STAKEWISE_POOL_ABI,
            this.provider
          );
          gasEstimate = await poolContract.deposit.estimateGas({
            value: amountWei,
          });
          break;
        }
        default:
          return "200000"; // Default estimate
      }

      return (gasEstimate + BigInt(50000)).toString(); // Add buffer
    } catch (error) {
      console.error("Error estimating gas:", error);
      return "200000"; // Fallback estimate
    }
  }

  async checkTransactionStatus(txHash: string): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return false;
    }
  }
}
