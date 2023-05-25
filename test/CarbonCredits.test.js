const CarbonCredit = artifacts.require("CarbonCredit");

contract("CarbonCredit", (accounts) => {

    let CarbonCreditInstance;

    beforeEach(async() => {
        CarbonCreditInstance = await CarbonCredit.new('CarbonCredits', 'CC');
    });

    it("Should register surveyer correctly", async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")
        
        const surveyerNames = await CarbonCreditInstance.getSurveyerNames.call()
        expect(surveyerNames).to.have.lengthOf(1)
        expect(surveyerNames[0]).to.equal("Greener")

        const surveyerAddress = await CarbonCreditInstance.getSurveyerAddress.call()
        expect(surveyerAddress).to.have.lengthOf(1)
        expect(surveyerAddress[0]).to.equal(accounts[1])
    })

    it('Should add a verification request to surveyer on registration of company', async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);
    });

    it('Should not allow company to verify itself', async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);

        
        let error;
        try {
            await CarbonCreditInstance.approveCreditInfo(accounts[2]);
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only revelant Surveyer can perform this action');

        const verificationStatus = await CarbonCreditInstance.companies(accounts[2]);
        expect(verificationStatus.isVerified).to.be.false;

    });

    it("Should allow Surveyer to verify company's credit info", async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[2]);
        expect(verificationStatus.isVerified).to.be.true;
    });

    it("Should allow Surveyer to reject company's credit info", async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);

        await CarbonCreditInstance.rejectCreditInfo(accounts[2], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[2]);
        expect(verificationStatus.isVerified).to.be.false;
    });

    it("Should not allow all Surveyer to verify any company's credit info", async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")
        await CarbonCreditInstance.registerSurveyer(accounts[4], "Carbon Diffuser")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);

        let error;
        try {
            await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only revelant Surveyer can perform this action');

        const verificationStatus = await CarbonCreditInstance.companies(accounts[2]);
        expect(verificationStatus.isVerified).to.be.false;
    });


    it("Should allocated correct tokens to company on approval", async () => {
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[2])
        expect(currentCredits.length).to.equal(0);

        const requests = await CarbonCreditInstance.showRegistrationRequests.call(accounts[1])
        expect(requests).to.have.length(1);
        expect(requests[0]).to.equal(accounts[2]);

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[2]);
        expect(verificationStatus.isVerified).to.be.true;

        const newCredits = await CarbonCreditInstance.getTokens.call(accounts[2])
        expect(newCredits.length).to.equal(5);
        expect(newCredits.length - currentCredits.length).to.equal(5);
        
    });

    it("Should allow verified companies to request credits", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 2, {from: accounts[4]});

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(1);
        
    });

    it("Should not allow rejected credit info companies to request credits", async () => {
        
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.rejectCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.false;

        let error;
        try {
            await CarbonCreditInstance.registerReceiveRequest(accounts[4], 2, {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only verified companies can request for credits');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(0);
        
    });

    it("Should not allow unverified companies to request credits", async () => {
        
        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.false;

        let error;
        try {
            await CarbonCreditInstance.registerReceiveRequest(accounts[4], 2, {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only verified companies can request for credits');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(0);
        
    });

    it("Should not allow verified companies to request 0 credits", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        let error;
        try {
            await CarbonCreditInstance.registerReceiveRequest(accounts[4], 0, {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Number of tokens requested should be > 0');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(0);

    });

    it("Should not allow verified companies to request credits > 5 times", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});
        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});
        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});
        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});
        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});

        let error;
        try {
            await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('You do not have enough requests remaining');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(5);       
    });

    it("Should not allow unverified companies to transfer credits", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        // await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(currentCredits.length).to.equal(0);

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});

        let error;
        try {
            await CarbonCreditInstance.transferCredits(accounts[4], accounts[2], 1, 475, 0, {from: accounts[2]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only verified companies can transfer credits');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(1);
        
        const newCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(newCredits.length).to.equal(0);
    });

    it("Should not allow verified companies to transfer credits more than they own", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(currentCredits.length).to.equal(0);

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 7, {from: accounts[4]});

        let error;
        try {
            await CarbonCreditInstance.transferCredits(accounts[4], accounts[2], 7, 475, 0, {from: accounts[2]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Not enough credits to be transfered');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(1);
        
        const newCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(newCredits.length).to.equal(0);
    });

    it("Should not allow verified companies to transfer credits when they own 0", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 7, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(currentCredits.length).to.equal(0);

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4]});

        let error;
        try {
            await CarbonCreditInstance.transferCredits(accounts[4], accounts[2], 1, 475, 0, {from: accounts[2]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('Only available credits can be transfered');

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(1);
        
        const newCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(newCredits.length).to.equal(0);
    });

    it("Should allow verified companies to transfer credits", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(currentCredits.length).to.equal(0);

        const currentAppleCredits = await CarbonCreditInstance.getTokens.call(accounts[2])
        expect(currentAppleCredits.length).to.equal(5);

        let tokenIds = await CarbonCreditInstance.getTokens.call(accounts[2])

        const value = web3.utils.toWei((4.75 * 1).toString(), 'ether');

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4], value:value});

        await CarbonCreditInstance.transferCredits(accounts[4], accounts[2], 1, 475, 0, {from: accounts[2]});

        const newCurrentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(newCurrentCredits.length).to.equal(1);

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(0);
    });

    it("Should allow only owning companies to transfer credits", async () => {

        await CarbonCreditInstance.registerSurveyer(accounts[1], "Greener")

        await CarbonCreditInstance.registerCompany(accounts[2], "Apple", 7, 2, 'R9887EAUX', accounts[1])
        await CarbonCreditInstance.registerCompany(accounts[4], "Microsoft", 5, 5, 'Q9825ZOCC', accounts[1])

        await CarbonCreditInstance.approveCreditInfo(accounts[2], {from: accounts[1]});
        await CarbonCreditInstance.approveCreditInfo(accounts[4], {from: accounts[1]});

        const verificationStatus = await CarbonCreditInstance.companies(accounts[4]);
        expect(verificationStatus.isVerified).to.be.true;

        const currentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(currentCredits.length).to.equal(0);

        const currentAppleCredits = await CarbonCreditInstance.getTokens.call(accounts[2])
        expect(currentAppleCredits.length).to.equal(5);

        let tokenIds = await CarbonCreditInstance.getTokens.call(accounts[2])

        const value = web3.utils.toWei((4.71 * 0).toString(), 'ether');

        await CarbonCreditInstance.registerReceiveRequest(accounts[4], 1, {from: accounts[4], value: value});

        let error;
        try {
            await CarbonCreditInstance.transferCredits(accounts[4], accounts[2], 1, 475, 0, {from: accounts[4]});
        } catch (e) {
            error = e;
        }
        expect(error).to.exist;
        expect(error.reason).to.equal('ERC721: caller is not token owner or approved');

        const newCurrentCredits = await CarbonCreditInstance.getTokens.call(accounts[4])
        expect(newCurrentCredits.length).to.equal(0);

        const numberOfRequests = await CarbonCreditInstance.getCreditRequests.call(accounts[4]);
        expect(numberOfRequests.length).to.equal(1);

    });

});
