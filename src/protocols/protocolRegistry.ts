import { StakingProtocol } from "../types";

export const PROTOCOL_REGISTRY: StakingProtocol[] = [
  {
    name: "Lido",
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    chainId: 1,
    minStake: "0.1",
    maxStake: "1000000",
    poolAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  },
  {
    name: "Rocket Pool",
    address: "0xDD3f50F8A6CafbE9b31a427582963f465E745AF8",
    chainId: 1,
    minStake: "0.01",
    maxStake: "1000000",
    tokenAddress: "0xae78736Cd615f374D3085123A210448E74Fc6393",
  },
  {
    name: "StakeWise",
    address: "0xC874b064f465bdD6411D45734b56fac750C53EDE",
    chainId: 1,
    minStake: "0.1",
    maxStake: "1000000",
  },
];

export class ProtocolRegistry {
  private protocols: Map<string, StakingProtocol> = new Map();

  constructor() {
    PROTOCOL_REGISTRY.forEach((protocol) => {
      const key = `${protocol.name}-${protocol.chainId}`;
      this.protocols.set(key, protocol);
    });
  }

  getProtocols(chainId: number): StakingProtocol[] {
    return Array.from(this.protocols.values()).filter(
      (p) => p.chainId === chainId
    );
  }

  getProtocol(name: string, chainId: number): StakingProtocol | undefined {
    const key = `${name}-${chainId}`;
    return this.protocols.get(key);
  }

  addProtocol(protocol: StakingProtocol): void {
    const key = `${protocol.name}-${protocol.chainId}`;
    this.protocols.set(key, protocol);
  }
}
