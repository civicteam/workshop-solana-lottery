import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature
} from "@solana/web3.js";
import { AnchorProvider, IdlAccounts, Program } from "@coral-xyz/anchor";
import { IDL, WorkshopSolanaLottery } from "./types/workshop_solana_lottery";

const PROGRAM_ID = new PublicKey("1o2BymoRfoCwBnW2qr2oDjtqjhpNPA3JBj6tgk8raVf");
export const UNIQUENESS_PASS = new PublicKey("uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv")

export class LotteryClient {
  constructor(
    readonly program: Program<WorkshopSolanaLottery>,
    readonly authority: PublicKey,
    readonly lottery: IdlAccounts<WorkshopSolanaLottery>['lottery'],
    readonly lotteryAddress: PublicKey,
    readonly ticket: IdlAccounts<WorkshopSolanaLottery>['ticket'] | null,
    readonly ticketAddress: PublicKey,
  ) {
    console.log("Created new client...")
  }

  static async get(provider: AnchorProvider, lotteryAddress: PublicKey): Promise<LotteryClient | undefined> {
    const program = new Program<WorkshopSolanaLottery>(IDL, PROGRAM_ID, provider);
    const lottery = await program.account.lottery.fetchNullable(lotteryAddress);

    if (!lottery) return undefined;

    const [ticketAddress, bump] = PublicKey.findProgramAddressSync([
      lotteryAddress.toBuffer(),
      provider.publicKey.toBuffer(),
      Buffer.from("ticket")
    ], PROGRAM_ID);
    const ticket = await program.account.ticket.fetchNullable(ticketAddress)

    return new LotteryClient(program, provider.publicKey, lottery, lotteryAddress, ticket, ticketAddress);
  }

  static async create(provider: AnchorProvider):Promise<LotteryClient> {
    const program = new Program<WorkshopSolanaLottery>(IDL, PROGRAM_ID, provider);
    const newLottery = Keypair.generate();
    await program.methods.initialize(UNIQUENESS_PASS).accounts({
      lottery: newLottery.publicKey,
      authority: provider.publicKey,
    }).signers([newLottery]).rpc();

    return LotteryClient.get(provider, newLottery.publicKey).then((client) => {
      if (!client) throw new Error("Failed to create lottery");
      return client;
    });
  }

  async pickWinner(): Promise<TransactionSignature> {
    if (!this.authority.equals(this.lottery.authority)) throw new Error("Only the authority can pick a winner");

    return this.program.methods.pickWinner().accounts({
      lottery: this.lotteryAddress,
      authority: this.authority,
    }).rpc();
  }

  async enter(gatewayToken: PublicKey): Promise<TransactionSignature> {
    if (this.ticket) throw new Error("You already have a ticket");

    return this.program.methods.enter().accounts({
        lottery: this.lotteryAddress,
        ticket: this.ticketAddress,
        applicant: this.authority,
        gatewayToken
    }).rpc();
  }

  async withdraw(): Promise<TransactionSignature> {
    return this.program.methods.withdraw().accounts({
      lottery: this.lotteryAddress,
      ticket: this.ticketAddress,
      winner: this.authority,
    }).rpc();
  }

  async deposit(lamports: number): Promise<TransactionSignature> {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.authority,
        toPubkey: this.lotteryAddress,
        lamports,
      })
    );

    return (this.program.provider as AnchorProvider).sendAndConfirm(tx);
  }
}