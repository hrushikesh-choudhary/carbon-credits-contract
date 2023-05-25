# carbon-credits-contract
Solidity based Smart contract for Carbon Credits

> The project's goal is to create a blockchain-based network that will enable commercial carbon credit trading in a public and safe setting. The network will create a blockchain-based digital token for carbon credits that can be traded. Companies that reduce their carbon impact can receive carbon credits, and any extra credits can be donated to other businesses that require them. By offering a reliable and secure record of carbon credits, it will make it simpler for businesses to confirm the validity of the credits they buy. The initiative aims to encourage businesses to lower their carbon footprints and support the battle against climate change by developing a more efficient and open market for carbon credits.
> 
> Sequence Diagram: https://drive.google.com/file/d/1zpkB0hM8BHLht3dNNKAX8UZLS9_chcAA/view?usp=sharing
> 
> Contract Diagram: https://drive.google.com/file/d/10AHmy1PqgojBqHzqZPr75szAI9lKSyu-/view?usp=sharing,
> 
> Usecase Diagram: https://drive.google.com/file/d/16YEDIVJSUsTImVvnqi-_1bgd8d-tzPy_/view?usp=sharing,
> 
> Architecture Diagram: https://drive.google.com/file/d/1ECj1CQu4GUkoXY9I6WBqUc4pAK8r7V3W/view?usp=sharing
> 
>   - UI: https://github.com/hrushikesh-choudhary/carbon-credits-ui
>   
>   - API: https://github.com/hrushikesh-choudhary/carbon-credits-api
>   

Tech Used:
1. Solidity
2. Truffle
3. HardHat
4. Open Zepplin
5. Unit Testing with:
    - Mocha
    - Chai
## Available Scripts

### `npm install`
Installs the necessary packages for the project.

### `truffle test`
Launches the test runner in the interactive watch mode.
Ensure that all the tests pass before and after you make any changes.
To add new tests, create new independent test(s) in `test/CarbonCredits.test.js`.

### `truffle migrate`
Starts migration of the smart contract to a Blockchain network using Infura.
Before running the command make sure to:
1. Add your account mnemonic in .env
2. Add your Infura project API key in .env
3. Check `truffle-config.js` to ensure that you're deploying to the right blockchain network
  - Default: Sepolia Network
  - For local dev:
     - Uncomment Line:67 to Line:71 ( you do not need steps 1 and 2 for this )
     - Comment out Line:94 to Line:98 ( removes the config for Sepolia through Infura )

