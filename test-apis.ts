import axios from "axios";

async function testLidoAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Lido API Endpoints");
  console.log("=".repeat(60));

  const endpoints = [
    "https://eth-api.lido.fi/v1/protocol/steth/apr/sma",
    "https://api.lido.fi/v1/protocol/steth/apr/last",
    "https://api.lido.fi/v1/protocol/steth/apr",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
        },
      });

      console.log(` Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log(` Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

async function testRocketPoolAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Rocket Pool API Endpoints");
  console.log("=".repeat(60));

  const endpoints = [
    "https://api.rocketpool.net/api/apr",
    "https://api.rocketpool.net/api/mainnet/pool/apr",
    "https://api.rocketpool.net/api/apr/smoothing",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
        },
      });

      console.log(` Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log(` Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

async function testDeFiLlamaAPI() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing DeFiLlama API");
  console.log("=".repeat(60));

  try {
    console.log(`\nTesting: https://yields.llama.fi/pools`);
    const response = await axios.get("https://yields.llama.fi/pools", {
      timeout: 10000,
      params: {
        apy: true,
      },
    });

    console.log(` Status: ${response.status}`);

    if (response.data && Array.isArray(response.data.data)) {
      console.log(`Total pools: ${response.data.data.length}`);

      // Find Lido
      const lidoPool = response.data.data.find(
        (pool: any) =>
          pool.project === "lido" &&
          (pool.symbol === "stETH" ||
            pool.symbol === "stETH/ETH" ||
            pool.symbol?.includes("stETH"))
      );
      if (lidoPool) {
        console.log(`\n Found Lido pool:`);
        console.log(`   Project: ${lidoPool.project}`);
        console.log(`   Symbol: ${lidoPool.symbol}`);
        console.log(`   APY: ${lidoPool.apy}%`);
      } else {
        console.log(`\n Lido pool not found`);
        // Show first few lido-related pools
        const lidoPools = response.data.data.filter((pool: any) =>
          pool.project?.toLowerCase().includes("lido")
        );
        console.log(`   Found ${lidoPools.length} lido-related pools`);
        lidoPools.slice(0, 3).forEach((pool: any) => {
          console.log(
            `   - ${pool.project}: ${pool.symbol} (APY: ${pool.apy}%)`
          );
        });
      }

      // Find Rocket Pool
      const rocketPool = response.data.data.find(
        (pool: any) =>
          pool.project === "rocket-pool" &&
          (pool.symbol === "rETH" ||
            pool.symbol === "rETH/ETH" ||
            pool.symbol?.includes("rETH"))
      );
      if (rocketPool) {
        console.log(`\n Found Rocket Pool:`);
        console.log(`   Project: ${rocketPool.project}`);
        console.log(`   Symbol: ${rocketPool.symbol}`);
        console.log(`   APY: ${rocketPool.apy}%`);
      } else {
        console.log(`\n Rocket Pool not found`);
        const rpPools = response.data.data.filter((pool: any) =>
          pool.project?.toLowerCase().includes("rocket")
        );
        console.log(`   Found ${rpPools.length} rocket-related pools`);
        rpPools.slice(0, 3).forEach((pool: any) => {
          console.log(
            `   - ${pool.project}: ${pool.symbol} (APY: ${pool.apy}%)`
          );
        });
      }

      // Find StakeWise
      const stakewisePool = response.data.data.find(
        (pool: any) =>
          pool.project === "stakewise" || pool.project === "stake-wise"
      );
      if (stakewisePool) {
        console.log(`\n Found StakeWise:`);
        console.log(`   Project: ${stakewisePool.project}`);
        console.log(`   Symbol: ${stakewisePool.symbol}`);
        console.log(`   APY: ${stakewisePool.apy}%`);
      } else {
        console.log(`\n StakeWise not found`);
        const swPools = response.data.data.filter((pool: any) =>
          pool.project?.toLowerCase().includes("stakewise")
        );
        console.log(`   Found ${swPools.length} stakewise-related pools`);
        swPools.slice(0, 3).forEach((pool: any) => {
          console.log(
            `   - ${pool.project}: ${pool.symbol} (APY: ${pool.apy}%)`
          );
        });
      }
    } else {
      console.log(`Response structure:`, Object.keys(response.data || {}));
    }
  } catch (error: any) {
    console.log(` Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function main() {
  console.log("Testing API Endpoints");
  console.log("=".repeat(60));

  await testLidoAPI();
  await testRocketPoolAPI();
  await testDeFiLlamaAPI();

  console.log("\n" + "=".repeat(60));
  console.log(" All API tests completed");
  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
