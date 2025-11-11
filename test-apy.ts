import dotenv from "dotenv";
import { ApyFetcher } from "./src/services/apyFetcher";
import { ProtocolRegistry } from "./src/protocols/protocolRegistry";

// Load environment variables
dotenv.config();

async function testProtocol(
  protocolName: string,
  apyFetcher: ApyFetcher,
  registry: ProtocolRegistry
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${protocolName}`);
  console.log(`${"=".repeat(60)}`);

  const protocol = registry.getProtocol(protocolName, 1);
  if (!protocol) {
    console.error(` Protocol ${protocolName} not found`);
    return;
  }

  console.log(`Protocol Address: ${protocol.address}`);
  if (protocol.tokenAddress) {
    console.log(`Token Address: ${protocol.tokenAddress}`);
  }

  try {
    console.log(`\nFetching APY for ${protocolName}...`);
    const apy = await apyFetcher.fetchApy(protocol);
    console.log(`\n APY for ${protocolName}: ${apy}%`);

    // Fetch fees
    console.log(`\nFetching fees for ${protocolName}...`);
    const fees = await apyFetcher.fetchFees(protocol);
    console.log(` Fees for ${protocolName}: ${(fees * 100).toFixed(1)}%`);

    // Validate APY
    if (apy > 0 && apy < 20) {
      console.log(` APY is valid (between 0% and 20%)`);
    } else {
      console.log(` APY is invalid: ${apy}%`);
    }
  } catch (error) {
    console.error(` Error testing ${protocolName}:`, error);
  }
}

async function main() {
  console.log("Starting APY Fetcher Tests");
  console.log("=".repeat(60));

  if (!process.env.RPC_URL) {
    console.error(" Error: RPC_URL environment variable is required");
    console.error("Please set RPC_URL in your .env file");
    process.exit(1);
  }

  console.log(`RPC URL: ${process.env.RPC_URL}`);
  console.log(`Chain ID: 1 (Ethereum Mainnet)`);

  const registry = new ProtocolRegistry();
  const apyFetcher = new ApyFetcher(process.env.RPC_URL);

  // Test each protocol one by one
  await testProtocol("Lido", apyFetcher, registry);
  await testProtocol("Rocket Pool", apyFetcher, registry);
  await testProtocol("StakeWise", apyFetcher, registry);

  console.log(`\n${"=".repeat(60)}`);
  console.log(" All tests completed");
  console.log(`${"=".repeat(60)}\n`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
