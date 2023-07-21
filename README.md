# Massless Smart Contract Library

## Access the NPM private package
Check if your massless account is logged in 
  ```
  npm whoami
  ```

If you are not logged in:
  - Login
    ```
    npm login
    ```
    - npm.js username
    - npm.js password
    - massless email
    - onetime passcode (emailed to you)  

If you don't have access to the massless.io organisation
- Email `richard@massless.io`
- Masless Slack `Richard Casemore`

### To install the package

If you are logged in install the package
  ```
  npm install @massless.io/smart-contract-library
  ```

## To build

### Setup

- Install required packages
  ```
  npm install
  ```
- Setup the environment
  ```
  cp .env.example .env
  ```
- Compile
  ```
  npm run compile
  ```
- On VSCode extension store library [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter).

> You must restart VSCode after installing Mocha Test Explorer.

### Testing

A lab flask icon will appear in the left most toolbar. From here you can run or debug the relevant test.

- Test
  ```
  npm run test
  ```

### Compile

If you only require the compiled code (ABI and/or ByteCode) you can stand-alone compile.

```
npm run compile
```

The solidity compiled `.json` file will be available at `/artifacts/contracts/{ContractFilename}/{ContractName}.json`. This file includes the ABI and the ByteCode.

### Proper gas cost testing

This is a gross method that priority was speed. You are welcome to improve the gasCost calculation method.

- rename the folder `test` to `testBackup`
- rename the folder `gasCostCalcTests` to `test`
- calculate costs
  ```
  npm run gasCost
  ```

When you are finished

- rename the folder `test` to `gasCostCalcTests`
- rename the folder `testBackup` to `test`

### Remix

This can be used with the Remix IDE

Ensure you install remixd is globally, you'll need to restart your terminal for remixd available on `path`.

```
npm install -g @remix-project/remixd@0.5.2
```

> 0.5.3 throws an error

- Launch remixd
  ```
  npm run remixd
  ```
- Navigate to: [remix.ethereum.org](https://remix.ethereum.org/)
- Start the local connection by clicking the `Workspaces Dropdown` and selecting `- connect to localhost -`

```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
