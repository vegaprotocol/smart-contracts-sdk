import { ethers, BigNumber as EthersBigNumber } from 'ethers';
import erc20Abi from '../abis/erc20_abi.json';
import erc20AbiFaucet from '../abis/erc20_abi_faucet.json';
import BigNumber from 'bignumber.js';
``;
import { addDecimal, removeDecimal } from '../utils';
import { BaseContract } from './base-contract';

export class ERC20Token extends BaseContract {
  public contract: ethers.Contract;
  public dp: Promise<number>;

  constructor(
    address: string,
    provider: ethers.providers.Web3Provider,
    signer?: ethers.Signer
  ) {
    super(provider, signer);

    const self = this;

    this.contract = new ethers.Contract(
      address,
      process.env.NODE_ENV === 'production' ? erc20Abi : erc20AbiFaucet,
      signer || provider
    );

    this.dp = (async () => {
      const val = await self.contract.decimals();
      return Number(val);
    })();
  }

  /** Gets Vega token total supply */
  async totalSupply(): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.totalSupply();
    const value = addDecimal(new BigNumber(res.toString()), await this.dp);
    return value;
  }

  /** Gets number tokens an Ethereum account owns */
  async balanceOf(address: string): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.balanceOf(address);
    const value = addDecimal(new BigNumber(res.toString()), await this.dp);
    return value;
  }

  async transfer(
    from: string,
    to: string,
    amount: BigNumber,
    confirmations: number = 1
  ) {
    const value = removeDecimal(amount, await this.dp).toString();
    const tx = await this.contract.transfer(from, to, value);
    this.trackTransaction(tx, confirmations);
    return tx;
  }

  async transferFrom(
    sender: string,
    recipient: string,
    amount: BigNumber,
    confirmations: number = 1
  ) {
    const value = removeDecimal(amount, await this.dp).toString();
    const tx = await this.contract.transferFrom(sender, recipient, value);
    this.trackTransaction(tx, confirmations);
    return tx;
  }

  /** Gets Ethereum account's permitted allowance */
  async allowance(address: string, spender: string): Promise<BigNumber> {
    const res: EthersBigNumber = await this.contract.allowance(
      address,
      spender
    );
    const value = addDecimal(new BigNumber(res.toString()), await this.dp);
    return value;
  }

  /** Executs contracts approve function */
  async approve(
    spender: string,
    confirmations: number = 1
  ): Promise<ethers.ContractTransaction> {
    const amount = removeDecimal(
      new BigNumber(Number.MAX_SAFE_INTEGER),
      await this.dp
    ).toString();
    const tx = await this.contract.approve(spender, amount);
    this.trackTransaction(tx, confirmations);
    return tx;
  }

  async faucet(confirmations: number = 1): Promise<ethers.ContractTransaction> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No faucet in production');
    }
    const tx = await this.contract.faucet();
    this.trackTransaction(tx, confirmations);
    return tx;
  }

  /** Gets number of decimals used by token */
  async decimals(): Promise<number> {
    const res: number = await this.contract.decimals();
    return Number(res);
  }
}
