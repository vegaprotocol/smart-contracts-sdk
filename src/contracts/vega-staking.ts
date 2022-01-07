import { ethers, BigNumber as EthersBigNumber } from 'ethers';

import stakingAbi from '../abis/staking_abi.json';

import { combineStakeEventsByVegaKey } from './stake-helpers';
import BigNumber from 'bignumber.js';
import { BaseContract } from './base-contract';
import { EnvironmentConfig, Networks } from '..';

export class VegaStaking extends BaseContract {
  public contract: ethers.Contract;

  constructor(provider: ethers.providers.Web3Provider, network: Networks) {
    super(provider, network);
    this.contract = new ethers.Contract(
      EnvironmentConfig[network].stakingBridge,
      stakingAbi,
      this.signer || this.provider
    );
  }

  /** Executes staking contracts stake function */
  async addStake(
    amount: BigNumber,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = await this.removeDecimal(amount);

    const tx = await this.contract.stake(
      convertedAmount,
      this.hexadecimalify(vegaKey)
    );

    // store and track the transaction in BaseContract
    this.trackTransaction(tx, 3);

    return tx;
  }

  /** Executes staking contracts remove_stake function */
  async removeStake(
    amount: BigNumber,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = await this.removeDecimal(amount);

    const tx = this.contract.remove_stake(
      convertedAmount,
      this.hexadecimalify(vegaKey)
    );

    this.trackTransaction(tx, 3);

    return tx;
  }

  /** Executes staking contracts transfer_stake function */
  async transferStake(
    amount: BigNumber,
    newAddress: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = await this.removeDecimal(amount);

    const tx = this.contract.transfer_stake(
      convertedAmount,
      newAddress,
      this.hexadecimalify(vegaKey)
    );

    this.trackTransaction(tx, 3);

    return tx;
  }

  /** Returns the amount staked for given Vega public key */
  async stakeBalance(address: string, vegaKey: string): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.stake_balance(
      address,
      this.hexadecimalify(vegaKey)
    );
    const value = await this.addDecimal(res);
    return value;
  }

  /** Returns the total amount currently staked */
  async totalStaked(): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.total_staked();
    const value = await this.addDecimal(res);
    return value;
  }

  /** Returns amounts staked across all Vega keys for single Ethereum account */
  async userTotalStakedByVegaKey(
    ethereumAccount: string
  ): Promise<{ [vegaKey: string]: BigNumber }> {
    const addFilter = this.contract.filters.Stake_Deposited(ethereumAccount);
    const removeFilter = this.contract.filters.Stake_Removed(ethereumAccount);
    const addEvents = await this.contract.queryFilter(addFilter);
    const removeEvents = await this.contract.queryFilter(removeFilter);
    const res = combineStakeEventsByVegaKey(
      [...addEvents, ...removeEvents],
      await this.dp
    );
    return res;
  }
}
