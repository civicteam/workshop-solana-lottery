import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { LotteryClient } from "./lib/LotteryClient";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";

type LotteryContextType = {
  client: LotteryClient | undefined;
  createNewLottery: () => void;
}
export const LotteryContext = createContext<LotteryContextType>({
  client: undefined,
  createNewLottery: () => {},
});

const safeParsePublicKey = (string: string) => {
  try {
    return new PublicKey(string);
  } catch (e) {
    return null;
  }
};

export const LotteryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [client, setClient] = useState<LotteryClient | undefined>();
  const addressFromUrl = useMemo(
    () => safeParsePublicKey(window.location.href.split("#")[1]),
    [window.location.href]
  );

  const provider = useMemo(() => {
    if (!wallet) return undefined;

    return new AnchorProvider(
      connection,
      wallet,
      {}
    );
  }, [wallet])

  useEffect(() => {
    if (!provider || !addressFromUrl) return undefined;
    LotteryClient.get(provider, addressFromUrl).then(setClient);
  }, [addressFromUrl, provider]);

  const createNewLottery = () => {
    if (!provider) return undefined;
    LotteryClient.create(provider).then(setClient);
  }

  return (
    <LotteryContext.Provider value={{ client,createNewLottery }}>
      {children}
    </LotteryContext.Provider>
  );
}

export const useLottery = () => useContext(LotteryContext);