import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { EpochDetails, Tranche } from './vega-web3-types';

export interface IStaking {
  stakeBalance(address: string, vegaKey: string): Promise<BigNumber>;
  totalStaked(): Promise<BigNumber>;
  removeStake(
    amount: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction>;
  addStake(
    amount: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction>;
  userTotalStakedByVegaKey(
    address: string
  ): Promise<{ [vegaKey: string]: BigNumber }>;
}

export interface IVegaStaking extends IStaking {
  transferStake(
    amount: string,
    newAddress: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction>;
}

export interface IVegaVesting extends IStaking {
  getUserBalanceAllTranches(address: string): Promise<BigNumber>;
  getLien(address: string): Promise<BigNumber>;
  getAllTranches(): Promise<Tranche[]>;
  userTrancheTotalBalance(address: string, tranche: number): Promise<BigNumber>;
  userTrancheVestedBalance(
    address: string,
    tranche: number
  ): Promise<BigNumber>;
  withdrawFromTranche(trancheId: number): Promise<ethers.ContractTransaction>;
}

export interface IVegaClaim {
  commit(s: string): Promise<ethers.ContractTransaction>;

  claim({
    amount,
    tranche,
    expiry,
    target,
    country,
    v,
    r,
    s,
  }: {
    amount: BigNumber;
    tranche: number;
    expiry: number;
    target?: string;
    country: string;
    v: number;
    r: string;
    s: string;
  }): Promise<ethers.ContractTransaction>;

  isCommitted({ s }: { s: string }): Promise<string>;

  isExpired(expiry: number): Promise<boolean>;
  isUsed(s: string): Promise<boolean>;
  isCountryBlocked(country: string): Promise<boolean>;
}

export interface IVegaToken {
  totalSupply(): Promise<BigNumber>;
  decimals(): Promise<number>;
  tokenData(): Promise<{ totalSupply: BigNumber; decimals: number }>;
  balanceOf(address: string): Promise<BigNumber>;
  approve(spender: string): Promise<ethers.ContractTransaction>;
  allowance(address: string, spender: string): Promise<BigNumber>;
}

export interface IVegaLPStaking {
  stakedBalance(
    account: string
  ): Promise<{
    pending: BigNumber;
    earningRewards: BigNumber;
    total: BigNumber;
  }>;
  rewardsBalance(account: string): Promise<BigNumber>;
  awardContractAddress(): Promise<string>;
  slpContractAddress(): Promise<string>;
  rewardPerEpoch(): Promise<BigNumber>;
  totalStaked(): Promise<BigNumber>;
  totalUnstaked(account: string): Promise<BigNumber>;
  stake(amount: string): Promise<ethers.ContractTransaction>;
  unstake(): Promise<ethers.ContractTransaction>;
  withdrawRewards(): Promise<ethers.ContractTransaction>;
  allowance(account: string): Promise<BigNumber>;
  approve(spender: string): Promise<ethers.ContractTransaction>;
  liquidityTokensInRewardPool(): Promise<BigNumber>;
  currentEpochDetails(): Promise<EpochDetails>;
  stakingStart(): Promise<string>;
}

export interface IVegaErc20Bridge {
  withdraw(approval: {
    assetSource: string;
    amount: string;
    nonce: string;
    signatures: string;
    targetAddress: string;
  }): Promise<ethers.ContractTransaction>;
}
