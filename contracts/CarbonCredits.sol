// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CarbonCredit is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    event Decision(address company, bool verification);
    event ReceivedSomeCredits(address company, string from, uint creditCount);

    struct Company {
        string name;
        uint totalCredits;
        uint creditsUsed;
        string surveyReference;
        uint remainingRequests;
        bool isVerified;
        address surveyCompany;
        uint[] tokenIds;
        uint[] costPerCredit;
    }

    struct surveyer {
        string name;
        address[] requests;
    }

    string[] surveyerName;
    address[] surveyerAddress;
    address[] companyAddress;

    mapping (address => Company) public companies;
    mapping (address => surveyer) public surveyerCompanies;
    mapping (address => uint[]) public creditRequests;

    modifier notZeroAddress(address value) {
        require(value != address(0), "Address cannot be a 0 address");
        _;
    }

    modifier onlySpecificSurveyer(address company) {
        require(companies[company].surveyCompany == msg.sender, "Only revelant Surveyer can perform this action");
        _;
    }

    modifier onlyOwnerCompany(address company) {
        require(msg.sender == company, "Only the company owner can request credits");
        _;
    }

    function getCreditRequests(address company) public view returns (uint[] memory) {
        return creditRequests[company];
    }

    function checkType(address company) public view returns (uint) {
        if(companies[company].totalCredits > 0) {
            return 1;
        }
        if(surveyerCompanies[company].requests.length > 0 ) {
            return 2;
        }
        return 0;
    }

    function registerSurveyer(address company, string memory name) public payable notZeroAddress(company) {
        surveyerCompanies[company].name = name;
        surveyerName.push(name);
        surveyerAddress.push(company);
    }

    function getCompanyAddresses() public view returns (address[] memory) {
        return companyAddress;
    }

    function getSurveyerNames() public view returns (string[] memory) {
        return surveyerName;
    }

    function getSurveyerAddress() public view returns (address[] memory) {
        return surveyerAddress;
    }

    function getTokens(address company) public view returns (uint[] memory) {
        return companies[company].tokenIds;
    }

    function getCostPerCredit(address company) public view returns (uint[] memory) {
        return companies[company].costPerCredit;
    }

    function registerCompany(address company, string memory name, uint totalCredits, uint creditsUsed, string memory surveyReference, address surveyCompany) public payable notZeroAddress(company) returns (string memory) {
        bytes memory tempEmptyStringTest = bytes(surveyReference);
        require(tempEmptyStringTest.length != 0, "Please provide a reference number");
        uint[] memory tokens;
        uint[] memory cost;
        companies[company] = Company(name, totalCredits, creditsUsed, surveyReference, 5, false, surveyCompany, tokens, cost);
        surveyerCompanies[surveyCompany].requests.push(company);
        return "Awaiting approval from Surveyer";
    }

    function showRegistrationRequests(address company) public payable returns (address[] memory) {
        require(surveyerCompanies[company].requests.length > 0, "Only surveyers can have approval requests");
        return surveyerCompanies[company].requests;
    }

    function approveCreditInfo(address company) public payable onlySpecificSurveyer(company) {
        require(companies[company].isVerified == false, "Company is already verified");
        companies[company].isVerified = true;
        companies[company].remainingRequests = 5;
        for(uint i = 0; i < (companies[company].totalCredits - companies[company].creditsUsed); i++) {
            uint tokenId = createCredit(company);
            companies[company].tokenIds.push(tokenId);
        }
        companyAddress.push(company);
        emit Decision(company, true);
    }

    function rejectCreditInfo(address company) public payable onlySpecificSurveyer(company) {
        companies[company].isVerified = false;
        emit Decision(company, false);
    }

    function createCredit(address to) private returns(uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        return tokenId;
    }

    function registerReceiveRequest(address company, uint numberOfTokens) public payable onlyOwnerCompany(company) {
        require(companies[company].isVerified, "Only verified companies can request for credits");
        require(numberOfTokens > 0, "Number of tokens requested should be > 0");
        require(companies[company].remainingRequests > 0, "You do not have enough requests remaining");
        creditRequests[company].push(numberOfTokens);
        companies[company].costPerCredit.push(475 + ((5 - companies[company].remainingRequests - ((companies[company].totalCredits - companies[company].creditsUsed) - companies[company].tokenIds.length)) * 17));
        companies[company].remainingRequests--;
    }

    function transferCredits(address to, address payable from, uint numberOfTokens, uint cost, uint index) public payable notZeroAddress(to) notZeroAddress(from) {
        require(companies[from].isVerified == true, "Only verified companies can transfer credits");
        require(companies[to].isVerified == true, "Only verified companies can receive credits");
        require(companies[from].tokenIds.length > 0, "Only available credits can be transfered");
        require(companies[from].tokenIds.length >= numberOfTokens, "Not enough credits to be transfered");
        for( uint i = 0; i < numberOfTokens; i++) {

            uint tokenId = companies[from].tokenIds[companies[from].tokenIds.length - 1];
            // require(_isApprovedOrOwner(msg.sender, tokenId), "Only approved operators can transfer a credit");

            safeTransferFrom(from, to, tokenId);

            companies[to].tokenIds.push(tokenId);
            companies[from].tokenIds.pop();
        }

        bool success = from.send((cost * 1 ether) / 10000);
        require(success, "Transfer failed");

        creditRequests[to][index] = creditRequests[to][creditRequests[to].length - 1];
        creditRequests[to].pop();
        companies[to].costPerCredit[index] = companies[to].costPerCredit[companies[to].costPerCredit.length - 1];
        companies[to].costPerCredit.pop();

        emit ReceivedSomeCredits(to, companies[from].name, numberOfTokens);
    }

}