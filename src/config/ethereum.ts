import { Networks } from './vega';

const customVegaTokenAddress = process.env.CUSTOM_TOKEN_ADDRESS as string;
const customClaimAddress = process.env.CUSTOM_CLAIM_ADDRESS as string;
const customLockedAddress = process.env.CUSTOM_LOCKED_ADDRESS as string;
const customVestingAddress = process.env.CUSTOM_VESTING_ADDRESS as string;
const customStakingBridge = process.env.CUSTOM_STAKING_BRIDGE as string;
const customErc20Bridge = process.env.CUSTOM_ERC20_BRIDGE as string;

interface VegaContracts {
  vestingAddress: string;
  vegaTokenAddress: string;
  claimAddress: string;
  lockedAddress: string;
  stakingBridge: string;
  erc20Bridge: string;
}

export const EnvironmentConfig: { [key in Networks]: VegaContracts } = {
  [Networks.CUSTOM]: {
    vegaTokenAddress: customVegaTokenAddress,
    claimAddress: customClaimAddress,
    lockedAddress: customLockedAddress,
    vestingAddress: customVestingAddress,
    stakingBridge: customStakingBridge,
    erc20Bridge: customErc20Bridge,
  },
  [Networks.DEVNET]: {
    vegaTokenAddress: '0xc93137f9F4B820Ca85FfA3C7e84cCa6Ebc7bB517',
    claimAddress: '0x8Cef746ab7C83B61F6461cC92882bD61AB65a994',
    lockedAddress: '0x0',
    vestingAddress: '0xd751FF6264234cAfAE88e4BF6003878fAB9630a7',
    stakingBridge: '0x3cCe40e1e47cedf76c03db3E48507f421b575523',
    erc20Bridge: '0x042573A44C7ed0c03960ce505Bd60C6d90d23795',
  },
  [Networks.STAGNET]: {
    vestingAddress: '0xfCe6eB272D3d4146A96bC28de71212b327F575fa',
    vegaTokenAddress: '0x547cbA83a7eb82b546ee5C7ff0527F258Ba4546D',
    claimAddress: '0x8Cef746ab7C83B61F6461cC92882bD61AB65a994', // TODO not deployed to this env, but random address so app doesn't error
    lockedAddress: '0x0', // TODO not deployed to this env
    stakingBridge: '0x7D88CD817227D599815d407D929af18Bb8D57176',
    erc20Bridge: '0xc0835e6dEf177F8ba2561C4e4216827A3798c6B9',
  },
  [Networks.STAGNET2]: {
    vestingAddress: '0x005F13184cf57B9EE49701c8D8c952534c36AcaB',
    vegaTokenAddress: '0xd8fa193B93a179DdCf51FFFDe5320E0872cdcf44',
    claimAddress: '0x8Cef746ab7C83B61F6461cC92882bD61AB65a994', // TODO not deployed to this env, but random address so app doesn't error
    lockedAddress: '0x0', // TODO not deployed to this env
    stakingBridge: '0xCee201E44ADe5400Ceb0d5924e0802244B6c40f7',
    erc20Bridge: '0xEbabe46685157A43578DD63Edb0430ef48B5a5b0',
  },
  [Networks.TESTNET]: {
    vestingAddress: '0xe2deBB240b43EDfEBc9c38B67c0894B9A92Bf07c',
    vegaTokenAddress: '0xDc335304979D378255015c33AbFf09B60c31EBAb',
    claimAddress: '0x8Cef746ab7C83B61F6461cC92882bD61AB65a994', // TODO not deployed to this env, but random address so app doesn't error
    lockedAddress: '0x0', // TODO not deployed to this env
    stakingBridge: '0xF5A3830F002BE78dd801214F5316b677E0355c60',
    erc20Bridge: '0xF009C66c6afC9661143fD7cE1eDb02c1961a6510',
  },
  [Networks.MAINNET]: {
    vestingAddress: '0x23d1bFE8fA50a167816fBD79D7932577c06011f4',
    vegaTokenAddress: '0xcB84d72e61e383767C4DFEb2d8ff7f4FB89abc6e',
    claimAddress: '0x0ee1fb382caf98e86e97e51f9f42f8b4654020f3',
    lockedAddress: '0x78344c7305d73a7a0ac3c94cd9960f4449a1814e',
    stakingBridge: '0x195064D33f09e0c42cF98E665D9506e0dC17de68',
    erc20Bridge: '0xCd403f722b76366f7d609842C589906ca051310f',
  },
};
