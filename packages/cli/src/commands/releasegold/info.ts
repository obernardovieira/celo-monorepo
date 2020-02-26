import { newReleaseGold } from '@celo/contractkit/src/generated/ReleaseGold'
import {
  ReleaseGoldWrapper,
  ReleaseSchedule,
  RevocationInfo,
} from '@celo/contractkit/src/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export interface BalanceState {
  totalWithdrawn: string
  totalBalance: string
  remainingTotalBalance: string
  remainingUnlockedBalance: string
  remainingLockedBalance: string
  currentReleasedTotalAmount: string
}

export interface ReleaseGoldInfo {
  releaseGoldWrapperAddress: string
  beneficiary: string
  revoker: string
  releaseSchedule: ReleaseSchedule
  isRevoked: boolean
  revokedStateData: RevocationInfo
  balanceStateData: BalanceState
}

export default class Info extends BaseCommand {
  static description = 'Get info on a ReleaseGold instance contract.'

  static flags = {
    ...BaseCommand.flags,
    releaseGoldAddress: Flags.address({
      required: true,
      description: 'Address of the ReleaseGold Contract',
    }),
  }

  static examples = ['info --releaseGoldAddress 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Info)

    const releaseGoldWrapper = await new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, flags.releaseGoldAddress)
    )
    const balanceStateData: BalanceState = {
      totalWithdrawn: (await releaseGoldWrapper.getTotalWithdrawn()).toString(),
      totalBalance: (await releaseGoldWrapper.getTotalBalance()).toString(),
      remainingTotalBalance: (await releaseGoldWrapper.getRemainingTotalBalance()).toString(),
      remainingUnlockedBalance: (await releaseGoldWrapper.getRemainingUnlockedBalance()).toString(),
      remainingLockedBalance: (await releaseGoldWrapper.getRemainingLockedBalance()).toString(),
      currentReleasedTotalAmount: (
        await releaseGoldWrapper.getCurrentReleasedTotalAmount()
      ).toString(),
    }
    const releaseGoldInfo: ReleaseGoldInfo = {
      releaseGoldWrapperAddress: releaseGoldWrapper.address,
      beneficiary: await releaseGoldWrapper.getBeneficiary(),
      revoker: await releaseGoldWrapper.getRevoker(),
      releaseSchedule: await releaseGoldWrapper.getReleaseSchedule(),
      isRevoked: await releaseGoldWrapper.isRevoked(),
      revokedStateData: await releaseGoldWrapper.getRevocationInfo(),
      balanceStateData: balanceStateData,
    }
    printValueMapRecursive(releaseGoldInfo)
  }
}
