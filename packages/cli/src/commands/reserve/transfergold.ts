import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class TransferGold extends BaseCommand {
  static description = 'Transfers reserve gold to other reserve address'

  static flags = {
    ...BaseCommand.flags,
    value: flags.string({ required: true, description: 'The unit amount of Celo Gold (cGLD)' }),
    to: Flags.address({ required: true, description: 'Receiving address' }),
    from: Flags.address({ required: true, description: "Sender's address" }),
  }

  static examples = [
    'transfergold --value 9000 --to 0x91c987bf62D25945dB517BDAa840A6c661374402 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(TransferGold)
    const value = res.flags.value
    const to = res.flags.to
    const account = res.flags.from
    this.kit.defaultAccount = account
    const reserve = await this.kit.contracts.getReserve()
    const spenders = await reserve.getSpenders()
    // assumes that the multisig is the most recent spender in the spenders array
    const multiSigAddress = spenders.length > 0 ? spenders[spenders.length - 1] : ''
    const reserveSpenderMultiSig = await this.kit.contracts.getMultiSig(multiSigAddress)

    await newCheckBuilder(this)
      .addCheck(
        `${multiSigAddress} multisig address is not a spender`,
        async () => !(await reserve.isSpender(account))
      )
      .addCheck(
        `${account} is not multisig signatory`,
        async () => !(await reserveSpenderMultiSig.isowner(account))
      )
      .runChecks()

    const tx = await reserve.transferGold(to, value)
    const multiSigTx = await reserveSpenderMultiSig.submitOrConfirmTransaction(
      reserve.address,
      tx.txo
    )
    await displaySendTx<any>('transferGoldTx', multiSigTx, {}, 'ReserveGoldTransferred')
  }
}
