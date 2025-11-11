import { Router, Request, Response } from 'express';
import { StakingRequest } from '../types';
import { StakingAggregator } from '../services/aggregator';

export function createStakingRouter(aggregator: StakingAggregator): Router {
  const router = Router();

  router.post('/quote', async (req: Request, res: Response) => {
    try {
      const request: StakingRequest = {
        amount: req.body.amount,
        tokenAddress: req.body.tokenAddress,
        chainId: req.body.chainId || 1,
        lockPeriod: req.body.lockPeriod,
        minApy: req.body.minApy,
      };

      // Validate request
      if (!request.amount || !request.tokenAddress) {
        return res.status(400).json({
          error: 'Missing required fields: amount, tokenAddress',
        });
      }

      const bestQuote = await aggregator.findBestDeal(request);

      if (!bestQuote) {
        return res.status(404).json({
          error: 'No suitable staking protocol found',
        });
      }

      res.json({
        success: true,
        quote: bestQuote,
      });
    } catch (error) {
      console.error('Error getting quote:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/quotes', async (req: Request, res: Response) => {
    try {
      const request: StakingRequest = {
        amount: req.body.amount,
        tokenAddress: req.body.tokenAddress,
        chainId: req.body.chainId || 1,
        lockPeriod: req.body.lockPeriod,
        minApy: req.body.minApy,
      };

      if (!request.amount || !request.tokenAddress) {
        return res.status(400).json({
          error: 'Missing required fields: amount, tokenAddress',
        });
      }

      const quotes = await aggregator.getAllQuotes(request);

      res.json({
        success: true,
        quotes,
        count: quotes.length,
      });
    } catch (error) {
      console.error('Error getting quotes:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const request: StakingRequest = {
        amount: req.body.amount,
        tokenAddress: req.body.tokenAddress,
        chainId: req.body.chainId || 1,
        lockPeriod: req.body.lockPeriod,
        minApy: req.body.minApy,
      };

      const privateKey = req.body.privateKey;

      if (!request.amount || !request.tokenAddress || !privateKey) {
        return res.status(400).json({
          error: 'Missing required fields: amount, tokenAddress, privateKey',
        });
      }

      const result = await aggregator.findAndExecute(request, privateKey);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error('Error executing transaction:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}


