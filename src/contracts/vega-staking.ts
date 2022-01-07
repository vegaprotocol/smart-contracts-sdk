import { ethers } from 'ethers';

import stakingAbi from '../abis/staking_abi.json';

import { combineStakeEventsByVegaKey } from './stake-helpers';
import { addDecimal, removeDecimal } from '../utils/decimals';
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

  async addStake(
    amount: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = removeDecimal(
      new BigNumber(amount),
      await this.dp
    ).toString();
    const tx = await this.contract.stake(convertedAmount, `0x${vegaKey}`);
    this.trackTransaction(tx, 3);
    return tx;
  }

  async removeStake(
    amount: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = removeDecimal(
      new BigNumber(amount),
      await this.dp
    ).toString();
    return this.contract.remove_stake(convertedAmount, `0x${vegaKey}`);
  }

  async transferStake(
    amount: string,
    newAddress: string,
    vegaKey: string
  ): Promise<ethers.ContractTransaction> {
    const convertedAmount = removeDecimal(
      new BigNumber(amount),
      await this.dp
    ).toString();
    return this.contract.transfer_stake(
      convertedAmount,
      newAddress,
      `0x${vegaKey}`
    );
  }

  async stakeBalance(address: string, vegaKey: string): Promise<BigNumber> {
    const res: BigNumber = await this.contract.stake_balance(
      address,
      this.hexadecimalify(vegaKey)
    );
    return addDecimal(new BigNumber(res.toString()), await this.dp);
  }

  async totalStaked(): Promise<BigNumber> {
    const res: BigNumber = await this.contract.total_staked();
    return addDecimal(new BigNumber(res.toString()), await this.dp);
  }

  async userTotalStakedByVegaKey(address: string) {
    const addFilter = this.contract.filters.Stake_Deposited(address);
    const removeFilter = this.contract.filters.Stake_Removed(address);
    const addEvents = await this.contract.queryFilter(addFilter);
    const removeEvents = await this.contract.queryFilter(removeFilter);
    const res = combineStakeEventsByVegaKey(
      [...addEvents, ...removeEvents],
      await this.dp
    );
    return res;
  }

  bindEventListeners(events: string[], topics: Array<any>) {
    events.forEach(event => {
      const filter = this.contract.filters[event](...topics);
      this.contract.on(filter, (...params) => {
        const event = params.slice(params.length - 1)[0];
        console.log('event recieved');
        this.handleEvent(event);
      });
    });
  }
}
