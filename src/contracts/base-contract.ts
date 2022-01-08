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
  public provider: ethers.providers.Provider;
  public signer: ethers.Signer | null;
  public tokenContract: ethers.Contract;
  public dp: Promise<number>;
  public _transactions: TxData[] = [];
  public transactionListener: Function = () => {};

  constructor(provider: ethers.providers.Web3Provider, network: Networks) {
    const self = this;
    this.provider = provider;
    this.signer = provider.getSigner() || null;
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

  async handleEvent(event: ethers.Event, confirmations = 1) {
    const tx = await event.getTransaction();
    // start tracking transaction if its not already in the transactions array
    const existing = this.transactions.find(t => t.tx.hash === tx.hash);
    if (!existing) {
      this.trackTransaction(tx, confirmations);
    }
  }

  async trackTransaction(
    tx: ethers.providers.TransactionResponse,
    confirmations: number
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

  watchTransactions(fn: (txs: TxData[]) => void) {
    this.transactionListener = fn;
  }

  get transactions() {
    return this._transactions;
  }

  set transactions(txs) {
    this._transactions = txs;
    this.transactionListener(txs);
  }

  hexadecimalify(str: string) {
    return `0x${str}`;
  }

  private mergeTransaction(tx: TxData) {
    this.transactions = [
      // Replace any existing transaction in the array with this one
      ...this.transactions.filter(t => t.tx.hash !== tx.tx.hash),
      tx,
    ];
  }
}
