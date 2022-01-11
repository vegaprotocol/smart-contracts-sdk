import BigNumber from 'bignumber.js';
import { ethers, BigNumber as EthersBigNumber } from 'ethers';
import { EnvironmentConfig } from '../config/ethereum';
import { Networks } from '../config/vega';
import { addDecimal, removeDecimal } from '../utils';
import tokenAbi from '../abis/vega_token_abi.json';

interface TxData {
  tx: ethers.ContractTransaction;
  receipt: ethers.ContractReceipt | null;
  pending: boolean;
}

export class BaseContract {
  public signer: ethers.Signer | null = null;
  public provider: ethers.providers.Provider;
  public tokenContract: ethers.Contract;
  public dp: Promise<number>;
  public transactions: TxData[] = [];
  public listeners: Function[] = [];

  constructor(
    network: Networks,
    provider: ethers.providers.Provider,
    signer?: ethers.Signer
  ) {
    const self = this;
    this.provider = provider;
    this.signer = signer || null;
    this.tokenContract = new ethers.Contract(
      EnvironmentConfig[network].vegaTokenAddress,
      tokenAbi,
      provider
    );
    this.dp = (async () => {
      const val = await self.tokenContract.decimals();
      return Number(val);
    })();
  }

  async handleEvent(event: ethers.Event, confirmations: number = 1) {
    const tx = await event.getTransaction();
    // start tracking transaction if its not already in the transactions array
    const existing = this.transactions.find(t => t.tx.hash === tx.hash);
    if (!existing) {
      this.trackTransaction(tx, confirmations);
    }
  }

  async trackTransaction(
    tx: ethers.providers.TransactionResponse,
    confirmations: number = 1
  ) {
    this.mergeTransaction({ tx, receipt: null, pending: true });

    let receipt = null;

    for (let i = 1; i <= confirmations; i++) {
      receipt = await tx.wait(i);
      this.mergeTransaction({ tx, receipt, pending: true });
    }

    this.mergeTransaction({ tx, receipt, pending: false });
  }

  async removeDecimal(value: BigNumber): Promise<string> {
    return removeDecimal(value, await this.dp).toString();
  }

  async addDecimal(value: EthersBigNumber): Promise<BigNumber> {
    return addDecimal(new BigNumber(value.toString()), await this.dp);
  }

  private mergeTransaction(tx: TxData) {
    this.transactions = [
      // Replace any existing transaction in the array with this one
      ...this.transactions.filter(t => t.tx.hash !== tx.tx.hash),
      tx,
    ];
    this.emit();
  }

  emit() {
    this.listeners.forEach(ln => {
      ln(this.transactions);
    });
  }

  listen(cb: Function) {
    this.listeners.push(cb);
  }
}
