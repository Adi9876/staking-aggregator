import { StakingRequest, StakingQuote, ExecutionResult } from '../types';
import { ProtocolQuerier } from './protocolQuerier';
import { BestDealFinder } from './bestDealFinder';
import { TransactionExecutor } from './transactionExecutor';

export class StakingAggregator {
  private protocolQuerier: ProtocolQuerier;
  private bestDealFinder: BestDealFinder;
  private transactionExecutor: TransactionExecutor;

  constructor(
    protocolQuerier: ProtocolQuerier,
    bestDealFinder: BestDealFinder,
    transactionExecutor: TransactionExecutor
  ) {
    this.protocolQuerier = protocolQuerier;
    this.bestDealFinder = bestDealFinder;
    this.transactionExecutor = transactionExecutor;
  }

  async findBestDeal(request: StakingRequest): Promise<StakingQuote | null> {
    const quotes = await this.protocolQuerier.queryProtocols(request);

    return this.bestDealFinder.findBestDeal(quotes);
  }

  async getAllQuotes(request: StakingRequest): Promise<StakingQuote[]> {
    const quotes = await this.protocolQuerier.queryProtocols(request);
    return this.bestDealFinder.getTopDeals(quotes, quotes.length);
  }

  async findAndExecute(
    request: StakingRequest,
    privateKey: string
  ): Promise<ExecutionResult> {
    const bestQuote = await this.findBestDeal(request);

    if (!bestQuote) {
      return {
        success: false,
        protocol: 'N/A',
        amount: request.amount,
        error: 'No suitable staking protocol found',
      };
    }

    return this.transactionExecutor.executeTransaction(bestQuote, privateKey);
  }

  async executeQuote(
    quote: StakingQuote,
    privateKey: string
  ): Promise<ExecutionResult> {
    return this.transactionExecutor.executeTransaction(quote, privateKey);
  }
}


