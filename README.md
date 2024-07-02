# Deprecation Notice

> [!NOTE] The contents of this repo have been moved to [Civic Pass Demos](https://github.com/civicteam/civic-pass-demos)


# Solana Civic Workshop - Lottery

A simple lottery program to demonstrate the use of Civic to protect on-chain assets.

## Run Locally

```bash
# Install dependencies
yarn
# Build the program
anchor build
# Start a local Solana cluster
anchor localnet
```

In another shell
```
# Run the client
cd app
yarn
yarn dev
```

1. Visit http://localhost:5173/ to see the app.
2. Connect with a wallet as `admin`
3. Create a lottery
4. Click the link to visit that lottery
5. Deposit some funds
6. Connect with a `user` wallet
7. Enter the lottery
8. Connect with the `admin` wallet
9. Click the `Pick Winner` button
10. Connect with the `user` wallet
11. Click the `Withdraw` button
