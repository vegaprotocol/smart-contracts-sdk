import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import erc20Abi from '../abis/erc20_abi.json';
import lpStakeAbi from '../abis/lp_staking_abi.json';
import { addDecimal, removeDecimal } from '../utils/decimals';
import { IVegaLPStaking } from './interfaces';
import { EpochDetails } from './vega-web3-types';

export default class VegaLPStaking implements IVegaLPStaking {
  private contract: ethers.Contract;
  public readonly address: string;

  private lpContract: Promise<ethers.Contract>;
  private lpDecimals: Promise<number>;

  private awardContract: Promise<ethers.Contract>;
  private awardDecimals: Promise<number>;

  constructor(
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer,
    lpStakeAddress: string
  ) {
    this.address = lpStakeAddress;
    this.contract = new ethers.Contract(
      lpStakeAddress,
      lpStakeAbi,
      signer || provider
    );

    // Workaround for TS data-flow analysis
    const self = this;

    // These are all "memoized"
    this.lpContract = (async (): Promise<ethers.Contract> => {
      const lpTokenAddress = await self.contract.trusted_lp_token();

      return new ethers.Contract(lpTokenAddress, erc20Abi, signer || provider);
    })();

    this.lpDecimals = (async (): Promise<number> => {
      return parseFloat(await (await self.lpContract).decimals());
    })();

    this.awardContract = (async (): Promise<ethers.Contract> => {
      const awardTokenAddress = await self.contract.trusted_reward_token();

      return new ethers.Contract(
        awardTokenAddress,
        erc20Abi,
        signer || provider
      );
    })();

    this.awardDecimals = (async (): Promise<number> => {
      return parseFloat(await (await self.awardContract).decimals());
    })();
  }

  async currentEpoch(): Promise<string> {
    const res = await this.contract.get_current_epoch_number();
    return res.toString();
  }

  async stakingStart(): Promise<string> {
    const res = await this.contract.staking_start();
    return res.toString();
  }

  async currentEpochDetails(): Promise<EpochDetails> {
    const id = await this.currentEpoch();
    const startSeconds = await this.contract.staking_start();
    const epochSeconds = await this.contract.epoch_seconds();
    const res = {
      id,
      startSeconds: new BigNumber(startSeconds.toString()).plus(
        new BigNumber(id).times(epochSeconds.toString())
      ),
      endSeconds: new BigNumber(startSeconds.toString()).plus(
        new BigNumber(id).plus(1).times(epochSeconds.toString())
      ),
    };

    return res;
  }

  /**
   * Retrieve staked VEGA LP tokens for a given account
   * @param  {string}          account ethereum address
   * @return {Promise<BigNumber>}         balance in VEGA LP tokens as decimal number
   */
  async stakedBalance(
    account: string
  ): Promise<{
    pending: BigNumber;
    earningRewards: BigNumber;
    total: BigNumber;
  }> {
    const user = await this.contract.users(account);
    const currentEpoch = await this.currentEpoch();
    const isPending = currentEpoch === user.last_epoch_withdrawn;
    const value = await this.contract.total_staked_for_user(account);
    const total = new BigNumber(
      addDecimal(new BigNumber(value.toString()), await this.lpDecimals)
    );
    return isPending
      ? {
          pending: total,
          earningRewards: new BigNumber(0),
          total,
        }
      : {
          earningRewards: total,
          pending: new BigNumber(0),
          total,
        };
  }

  /**
   * Retrieve the current accumulated rewards denominated in the reward tokens'
   * unit. This will be zero when nothing is staked or until one epoch has
   * passed.
   *
   * @param  {string}          account address
   * @return {Promise<BigNumber>}         Reward token balance in units
   */
  async rewardsBalance(account: string): Promise<BigNumber> {
    // Contract reverts if no stake is added, resulting in the catch block
    // being run. Just return 0 if thats the case
    try {
      const value = await this.contract.get_available_reward(account);
      return new BigNumber(
        addDecimal(new BigNumber(value.toString()), await this.awardDecimals)
      );
    } catch (e) {
      return new BigNumber(0);
    }
  }

  async awardContractAddress(): Promise<string> {
    const awardContract = await this.awardContract;
    return awardContract.address;
  }

  async slpContractAddress(): Promise<string> {
    const lpContract = await this.lpContract;
    return lpContract.address;
  }

  async rewardPerEpoch(): Promise<BigNumber> {
    const rewardPerEpoch: BigNumber = await this.contract.epoch_reward();
    const decimals = await this.awardDecimals;
    return new BigNumber(
      addDecimal(new BigNumber(rewardPerEpoch.toString()), decimals)
    );
  }

  async liquidityTokensInRewardPool(): Promise<BigNumber> {
    const lpContract = await this.lpContract;
    const decimals = await this.awardDecimals;
    const balance = await lpContract.balanceOf(this.address);
    return new BigNumber(
      addDecimal(new BigNumber(balance.toString()), decimals)
    );
  }

  /**
   * Total amount staked in this liquidity pool
   * @return {Promise<BigNumber>} Amount in VEGA LP units
   */
  async totalStaked(): Promise<BigNumber> {
    const value: BigNumber = await this.contract.total_staked();
    return new BigNumber(
      addDecimal(new BigNumber(value.toString()), await this.lpDecimals)
    );
  }

  async totalUnstaked(account: string): Promise<BigNumber> {
    const lpTokenContract = await this.lpContract;
    const lpTokenDecimals = await this.lpDecimals;
    const value = await lpTokenContract.balanceOf(account);
    return new BigNumber(
      addDecimal(new BigNumber(value.toString()), lpTokenDecimals)
    );
  }

  /**
   * Stake action. Note that the user must have called `.approve` on the VEGA LP
   * contract before this can be invoked. The allowance can be checked with
   * `.lpAllowance(account)`. Staking cannot be topped up. To change stake,
   * first `.unstake(account)` must be called, before another staking can take
   * place.
   *
   * @param  {string}           amount  stake in VEGA LP units
   * @param  {string}           account address
   * @return {Promise<WrappedPromiEvent<boolean>>}
   */
  async stake(amount: string): Promise<ethers.ContractTransaction> {
    const decimals = await this.lpDecimals;
    return this.contract.stake(
      removeDecimal(new BigNumber(amount), decimals).toString()
    );
  }

  /**
   * Unstake the full amount and receive rewards.
   * @param  {string}           account address
   * @return {WrappedPromiEvent<void>}
   */
  unstake(): Promise<ethers.ContractTransaction> {
    return this.contract.unstake();
  }

  /**
   * Retrieve the VEGA LP allowance that the staking contract can maximum
   * withdraw. This number must be greater than or equal to any amount passed
   * to `.stake(amount, account)`. The amount is returned as a decimal number of
   * VEGA LP tokens
   * @param  {string}          account address
   * @return {Promise<BigNumber>}
   */
  async allowance(account: string): Promise<BigNumber> {
    const value = await (await this.lpContract).allowance(
      account,
      this.address
    );
    return new BigNumber(
      addDecimal(new BigNumber(value.toString()), await this.lpDecimals)
    );
  }

  withdrawRewards(): Promise<ethers.ContractTransaction> {
    return this.contract.withdraw_rewards();
  }

  async approve(spender: string): Promise<ethers.ContractTransaction> {
    const amount = removeDecimal(
      new BigNumber(Number.MAX_SAFE_INTEGER),
      await this.lpDecimals
    );
    const contract = await this.lpContract;
    return contract.approve(spender, amount);
  }
}
