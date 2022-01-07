import { ethers } from 'ethers';
import { EnvironmentConfig, Networks } from '..';

import erc20BridgeAbi from '../abis/erc20_bridge_abi.json';
import { BaseContract } from './base-contract';

export class VegaErc20Bridge extends BaseContract {
  private contract: ethers.Contract;

  constructor(provider: ethers.providers.Web3Provider, network: Networks) {
    super(provider, network);
    this.contract = new ethers.Contract(
      EnvironmentConfig[network].erc20Bridge,
      erc20BridgeAbi,
      this.signer || this.provider
    );
  }

  /** Executes contracts withdraw_asset function */
  async withdraw(approval: {
    assetSource: string;
    amount: string;
    nonce: string;
    signatures: string;
    targetAddress: string;
  }): Promise<ethers.ContractTransaction> {
    const tx = await this.contract.withdraw_asset(
      approval.assetSource,
      approval.amount, // No need to remove decimals as this value is already set and not manipulated by the user
      approval.targetAddress,
      approval.nonce,
      approval.signatures
    );

    this.trackTransaction(tx, 3);

    return tx;
  }
}
