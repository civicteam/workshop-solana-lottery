import { GatewayProvider } from "@civic/solana-gateway-react"
import React, { FC, PropsWithChildren } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { UNIQUENESS_PASS } from "./lib/LotteryClient";

export const CivicPassProvider: FC<PropsWithChildren> = ({ children }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  if (!wallet) {
    return <>{children}</>;
  }

  return <GatewayProvider
    wallet={wallet}
    connection={connection}
    gatekeeperNetwork={UNIQUENESS_PASS}
    cluster="devnet"
  >
    {children}
  </GatewayProvider>;
}