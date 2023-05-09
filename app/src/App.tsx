import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import user from "./user.jpg"
import {
  ConnectionProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
  WalletProvider
} from "@solana/wallet-adapter-react"
import {
    WalletModalProvider,
    WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import { LotteryProvider, useLottery } from "./LotteryContext";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CivicPassProvider } from "./CivicPassContext";
import { GatewayStatus, IdentityButton, useGateway } from "@civic/solana-gateway-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { CivicProfile, Profile } from "@civic/profile";

import '@solana/wallet-adapter-react-ui/styles.css';

const mainnetConnection = new Connection("https://solana-mainnet.rpc.extrnode.com");

const Admin = () => {
    const { client, createNewLottery } = useLottery();
    const { connection } = useConnection();
    const [pot, setPot] = React.useState(0);
    useEffect(() => {
        if (client) {
            connection.getBalance(client.lotteryAddress).then(setPot);
            connection.onAccountChange(client.lotteryAddress, (account) => {
                setPot(account.lamports);
            });
        }
    }, [client, connection]);

    return (<div>
        <h1>Admin Mode</h1>
        { !client && <button onClick={createNewLottery}>Create New Lottery</button>}
        { client && <>
            <div><a href={ `${document.location.href}#${client.lotteryAddress.toString()}`}>Your Lottery</a></div>
            <div><>Total tickets: {client.lottery.tickets.toString()}</></div>
            <div><>Total pot: {pot}</></div>
            <button onClick={() => client.deposit(LAMPORTS_PER_SOL)}>Deposit 1 SOL</button>
            { client.lottery.winner === null && <button onClick={() => client.pickWinner()}>Pick Winner</button>}
            { client.lottery.winner && <p><>Winning ticket: {client.lottery.winner.toString()}</></p>}
        </>}
    </div>)
}

const ProfileView = () => {
    const wallet = useAnchorWallet();
    const [profile, setProfile] = useState<Profile>();
    useEffect(() => {
        if (!wallet) return;
        CivicProfile.get(wallet.publicKey.toString(), {
            solana: { connection: mainnetConnection },
        }).then(setProfile);
    }, [wallet]);

    if (!profile) return <></>

    return <div style={{ paddingTop: "10px" }}>
        <div>
            <img width={100} src={profile.image?.url || user} alt="profile" style={{
                borderRadius: "50%",
            }}/>
        </div>
        <h3>{profile.name?.value}</h3>
        <a href={"https://civic.me/" + wallet?.publicKey}>View Profile</a>
    </div>;
}

const Player = () => {
    const { client } = useLottery();
    const { gatewayStatus, gatewayToken } = useGateway();
    if (!client) return <></>;

    return (<div>
        <h1>Player Mode</h1>
        <IdentityButton />
        { gatewayStatus !== GatewayStatus.ACTIVE && <div>Verify you are a unique person before entering</div>}
        { !client.ticket && gatewayToken && <button disabled={gatewayStatus !== GatewayStatus.ACTIVE} onClick={() => client.enter(gatewayToken.publicKey)}>Enter Lottery</button>}
        { client.ticket && <p><>Your ticket: {client.ticket.number.toString()}</></p>}
        { client.lottery.winner && <p><>Winning ticket: {client.lottery.winner.toString()}</></p>}
        { client.ticket && client.lottery.winner?.toNumber() === client.ticket?.number.toNumber() && <div>
            <div>You won!</div>
            <button onClick={() => client.withdraw()}>Claim your winnings</button>
        </div>}
    </div>)
}

const Dashboard = () => {
    const wallet = useWallet()
    const { client } = useLottery();

    if (!wallet.connected || !wallet.publicKey) return <></>

    // admin mode if we have not created a lottery yet, or if we are the lottery authority
    const isAdminMode = client === undefined || client.lottery.authority.equals(wallet.publicKey);

    return isAdminMode ? <Admin /> : <Player />;
}

const Content = () =>
  <header className="App-header">
      <WalletMultiButton />
      <ProfileView/>
      <Dashboard />
  </header>

function App() {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    return (
        <div className="App">
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                        <CivicPassProvider>
                            <LotteryProvider>
                                <Content />
                            </LotteryProvider>
                        </CivicPassProvider>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    );
}

export default App;
