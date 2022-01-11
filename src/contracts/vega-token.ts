import BigNumber from 'bignumber.js';
import { ethers, BigNumber as EthersBigNumber } from 'ethers';
import { EnvironmentConfig } from '../config/ethereum';
import { Networks } from '../config/vega';
import tokenAbi from '../abis/vega_token_abi.json';
import { BaseContract } from './base-contract';

export class VegaToken extends BaseContract {
  public contract: ethers.Contract;

  constructor(
    network: Networks,
    provider: ethers.providers.Web3Provider,
    signer?: ethers.Signer
  ) {
    super(network, provider, signer);
    this.contract = new ethers.Contract(
      EnvironmentConfig[network].vegaTokenAddress,
      tokenAbi,
      this.signer || this.provider
    );
  }

  /** Gets Ethereum account's permitted allowance */
  async allowance(address: string, spender: string): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.allowance(
      address,
      spender
    );
    const value = await this.addDecimal(res);
    return value;
  }

  /** Executs contracts approve function */
  async approve(spender: string): Promise<ethers.ContractTransaction> {
    const amount = this.removeDecimal(new BigNumber(Number.MAX_SAFE_INTEGER));
    const tx = await this.contract.approve(spender, amount);

    this.trackTransaction(tx, 3);

    return tx;
  }

  /** Gets Vega token total supply */
  async totalSupply(): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.totalSupply();
    const value = await this.addDecimal(res);
    return value;
  }

  /** Gets number of decimals used by token */
  async decimals(): Promise<number> {
    const res: number = await this.contract.decimals();
    return Number(res);
  }

  /** Gets number tokens an Ethereum account owns */
  async balanceOf(address: string): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.balanceOf(address);
    const value = await this.addDecimal(res);
    return value;
  }
}
