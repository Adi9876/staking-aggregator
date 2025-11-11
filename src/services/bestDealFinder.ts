import { StakingQuote } from '../types';


export class BestDealFinder {
 
  findBestDeal(quotes: StakingQuote[]): StakingQuote | null {
    if (quotes.length === 0) {
      return null;
    }

    const validQuotes = quotes.filter(q => q && q.apy > 0);

    if (validQuotes.length === 0) {
      return null;
    }

    const scoredQuotes = validQuotes.map(quote => ({
      quote,
      score: this.calculateScore(quote),
    }));

    // Sort by score (highest first)
    scoredQuotes.sort((a, b) => b.score - a.score);

    return scoredQuotes[0].quote;
  }

 
  private calculateScore(quote: StakingQuote): number {
    const amount = parseFloat(quote.amount);
    const fees = parseFloat(quote.fees);
    const expectedReturn = parseFloat(quote.expectedReturn);

    const apyScore = quote.apy * 0.4;

    const netReturn = expectedReturn - fees;
    const netReturnScore = (netReturn / amount) * 100 * 0.3;


    const feeEfficiency = Math.max(0, (1 - fees / amount) * 100) * 0.2;

    let lockScore = 10;
    if (quote.lockPeriod) {
      lockScore = Math.max(0, (365 - quote.lockPeriod) / 365) * 10;
    }

    return apyScore + netReturnScore + feeEfficiency + lockScore;
  }

  getTopDeals(quotes: StakingQuote[], topN: number = 3): StakingQuote[] {
    const validQuotes = quotes.filter(q => q && q.apy > 0);

    if (validQuotes.length === 0) {
      return [];
    }

    const scoredQuotes = validQuotes.map(quote => ({
      quote,
      score: this.calculateScore(quote),
    }));

    scoredQuotes.sort((a, b) => b.score - a.score);

    return scoredQuotes.slice(0, topN).map(sq => sq.quote);
  }
}


