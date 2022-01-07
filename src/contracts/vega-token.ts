import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import tokenAbi from '../abis/vega_token_abi.json';
import { addDecimal, removeDecimal } from '../utils/decimals';

export class VegaToken {
  private contract: ethers.Contract;
  public dp: Promise<number>;

  constructor(
    provider: ethers.providers.BaseProvider,
    signer: ethers.Signer | null,
    tokenAddress: string
  ) {
    const self = this;

    this.contract = new ethers.Contract(
      tokenAddress,
      tokenAbi,
      signer || provider
    );

    this.dp = (async () => {
      const val = await self.contract.decimals();
      return Number(val);
    })();
  }

  async allowance(address: string, spender: string): Promise<BigNumber> {
    const decimals = await this.dp;
    const res: BigNumber = await this.contract.allowance(address, spender);
    return addDecimal(new BigNumber(res.toString()), decimals);
  }

  async approve(spender: string): Promise<ethers.ContractTransaction> {
    const decimals = await this.dp;
    const amount = removeDecimal(
      new BigNumber(Number.MAX_SAFE_INTEGER - 1),
      decimals
    );
    return this.contract.approve(spender, amount);
  }

  async totalSupply(): Promise<BigNumber> {
    const decimals = await this.dp;
    const res: BigNumber = await this.contract.totalSupply();
    return addDecimal(new BigNumber(res.toString()), decimals);
  }

  async decimals(): Promise<number> {
    const res: number = await this.contract.decimals();
    return Number(res);
  }

  async balanceOf(address: string): Promise<BigNumber> {
    const decimals = await this.dp;
    const res: BigNumber = await this.contract.balanceOf(address);
    return addDecimal(new BigNumber(res.toString()), decimals);
  }
}
