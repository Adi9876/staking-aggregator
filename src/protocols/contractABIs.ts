
export const LIDO_STETH_ABI = [
  'function getPooledEthByShares(uint256 sharesAmount) public view returns (uint256)',
  'function getSharesByPooledEth(uint256 ethAmount) public view returns (uint256)',
  'function getTotalPooledEther() public view returns (uint256)',
  'function getTotalShares() public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
];

export const LIDO_POOL_ABI = [
  'function submit(address _referral) payable returns (uint256)',
  'function submit() payable returns (uint256)',
  'function getTotalPooledEther() public view returns (uint256)',
  'function getTotalShares() public view returns (uint256)',
  'function getPooledEthByShares(uint256 sharesAmount) public view returns (uint256)',
  'function getSharesByPooledEth(uint256 ethAmount) public view returns (uint256)',
];

export const ROCKET_POOL_RETH_ABI = [
  'function getExchangeRate() public view returns (uint256)',
  'function getTotalCollateral() public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
];

export const ROCKET_POOL_DEPOSIT_ABI = [
  'function deposit() payable',
  'function getBalance() public view returns (uint256)',
  'function getMinimumDeposit() public view returns (uint256)',
  'function getMaximumDeposit() public view returns (uint256)',
];


export const STAKEWISE_POOL_ABI = [
  'function deposit() payable returns (uint256)',
  'function getTotalAssets() public view returns (uint256)',
  'function getTotalSupply() public view returns (uint256)',
  'function convertToAssets(uint256 shares) public view returns (uint256)',
  'function convertToShares(uint256 assets) public view returns (uint256)',
];

export const ERC20_ABI = [
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function transfer(address to, uint256 amount) public returns (bool)',
];

