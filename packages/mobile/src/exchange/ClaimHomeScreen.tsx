import * as React from 'react';
import { Text, View, Button, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
import { newKit } from '@celo/contractkit';
import ImpaktMarketABI from './ImpaktMarketABI.native.json';
import componentWithAnalytics from 'src/analytics/wrapper';
import { connect } from 'react-redux';
import { RootState } from 'src/redux/reducers'
import { currentAccountSelector } from 'src/web3/selectors';
import { refreshAllBalances, setLoading } from 'src/home/actions';
import { resetStandbyTransactions } from 'src/transactions/actions';
import { initializeSentryUserContext } from 'src/sentry/Sentry';
import { exitBackupFlow } from 'src/app/actions';
import { showMessage } from 'src/alert/actions';



interface StateProps {
    address?: string | null
}

interface DispatchProps {
    refreshAllBalances: typeof refreshAllBalances
    resetStandbyTransactions: typeof resetStandbyTransactions
    initializeSentryUserContext: typeof initializeSentryUserContext
    exitBackupFlow: typeof exitBackupFlow
    setLoading: typeof setLoading
    showMessage: typeof showMessage
}

type Props = StateProps & DispatchProps

const mapDispatchToProps = {
    refreshAllBalances,
    resetStandbyTransactions,
    initializeSentryUserContext,
    exitBackupFlow,
    setLoading,
    showMessage,
}

const mapStateToProps = (state: RootState): StateProps => ({
    address: currentAccountSelector(state),
})

function ClaimHomeScreen(props: Props) {
    const [nextClaim, setNextClaim] = React.useState<number>(0);
    const [claimDisabled, setClaimDisabled] = React.useState<boolean>(true);
    const [isUser, setIsUser] = React.useState<boolean>(false);
    const userAddress = '0x4c4f1D6bEFBE679A3EEebeedDa0b845cfD279De5';
    let impaktMarketInstance: any;

    React.useEffect(() => {
        const ImpaktMarketAddress = '0xc69840f11e1cBD0dd67b164ffE548CcF54F01A95';
        const kit = newKit('https://alfajores-forno.celo-testnet.org')
        kit.defaultAccount = userAddress;
        const web3 = kit.web3

        impaktMarketInstance = new web3.eth.Contract(ImpaktMarketABI, ImpaktMarketAddress);
        impaktMarketInstance.methods.cooldownClaim(userAddress).call().then((result: any) => {
            setClaimDisabled(result * 1000 > new Date().getTime());
            setNextClaim(result * 1000);
        });
        impaktMarketInstance.methods.isWhitelistUser(userAddress).call().then((result: any) => {
            setIsUser(result);
        })
    }, []);

    const handleClaimPress = (ev: NativeSyntheticEvent<NativeTouchEvent>) => {
        impaktMarketInstance.methods.claim().send({ from: userAddress }).then(() => {
            setClaimDisabled(true);
            setNextClaim((new Date().getTime() / 1000) + 60); // dummy for now
        });
        ev.preventDefault();
    }

    const userView = (
        <>
            {claimDisabled && nextClaim > 0 && <Text>Your next claim is at {new Date(nextClaim).toLocaleString()}</Text>}
            <Button title="Claim" onPress={handleClaimPress} disabled={claimDisabled} />
        </>
    );


    const nonUserView = (
        <Text>You are not a user!</Text>
    );

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{props.address}</Text>
            {isUser ? userView : nonUserView}
        </View>
    );
}

export default componentWithAnalytics(
    connect<StateProps, DispatchProps, {}, RootState>(
        mapStateToProps,
        mapDispatchToProps
    )(ClaimHomeScreen)
);