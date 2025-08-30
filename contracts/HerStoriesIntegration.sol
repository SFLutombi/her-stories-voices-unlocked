// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HerStoriesPayment.sol";
import "./HerStoriesCredits.sol";
import "./HerStoriesStory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HerStoriesIntegration
 * @dev Integration contract that connects all HerStories contracts
 * @author HerStories Team
 */
contract HerStoriesIntegration is Ownable, ReentrancyGuard {
    
    // Events
    event ContractLinked(string contractName, address contractAddress, uint256 timestamp);
    event IntegrationAction(
        address indexed user,
        string action,
        uint256 storyId,
        uint256 chapterId,
        uint256 amount,
        uint256 timestamp
    );
    
    // Contract addresses
    address payable public paymentContract;
    address public creditsContract;
    address public storyContract;
    
    // State variables
    bool public isInitialized = false;
    mapping(address => bool) public authorizedOperators;
    
    // Modifiers
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier contractsInitialized() {
        require(isInitialized, "Contracts not initialized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedOperators[msg.sender] = true;
    }
    
    /**
     * @dev Initialize contract addresses
     * @param _paymentContract Payment contract address
     * @param _creditsContract Credits contract address
     * @param _storyContract Story contract address
     */
    function initializeContracts(
        address payable _paymentContract,
        address _creditsContract,
        address _storyContract
    ) external onlyOwner {
        require(!isInitialized, "Already initialized");
        require(_paymentContract != address(0), "Invalid payment contract");
        require(_creditsContract != address(0), "Invalid credits contract");
        require(_storyContract != address(0), "Invalid story contract");
        
        paymentContract = _paymentContract;
        creditsContract = _creditsContract;
        storyContract = _storyContract;
        
        isInitialized = true;
        
        emit ContractLinked("HerStoriesPayment", address(_paymentContract), block.timestamp);
        emit ContractLinked("HerStoriesCredits", _creditsContract, block.timestamp);
        emit ContractLinked("HerStoriesStory", _storyContract, block.timestamp);
    }
    
    /**
     * @dev Complete story purchase with credits
     * @param storyId Story ID
     * @param chapterId Chapter ID
     * @param author Author address
     * @param amount Amount in credits
     */
    function purchaseStoryWithCredits(
        uint256 storyId,
        uint256 chapterId,
        address author,
        uint256 amount
    ) external contractsInitialized nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(author != address(0), "Invalid author address");
        require(author != msg.sender, "Cannot purchase from yourself");
        
        // Check if user has enough credits
        require(HerStoriesCredits(creditsContract).balanceOf(msg.sender) >= amount * (10 ** 18), "Insufficient credits");
        
        // Transfer credits from buyer to author
        require(HerStoriesCredits(creditsContract).transfer(author, amount * (10 ** 18)), "Credit transfer failed");
        
        // Update author's credit balance
        HerStoriesCredits(creditsContract).earnCredits(author, amount, string(abi.encodePacked("Story purchase: ", _uint2str(storyId))));
        
        // Record the transaction in payment contract
        // Note: This would need to be adapted based on your specific needs
        
        emit IntegrationAction(
            msg.sender,
            "STORY_PURCHASE_CREDITS",
            storyId,
            chapterId,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Complete story purchase with ETH
     * @param storyId Story ID
     * @param chapterId Chapter ID
     * @param author Author address
     */
    function purchaseStoryWithETH(
        uint256 storyId,
        uint256 chapterId,
        address author
    ) external payable contractsInitialized nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(author != address(0), "Invalid author address");
        require(author != msg.sender, "Cannot purchase from yourself");
        
        // Process payment through payment contract
        HerStoriesPayment(paymentContract).purchaseStory{value: msg.value}(
            author,
            string(abi.encodePacked(_uint2str(storyId))),
            string(abi.encodePacked(_uint2str(chapterId))),
            msg.value
        );
        
        emit IntegrationAction(
            msg.sender,
            "STORY_PURCHASE_ETH",
            storyId,
            chapterId,
            msg.value,
            block.timestamp
        );
    }
    
    /**
     * @dev Send tip with credits
     * @param author Author address
     * @param amount Amount in credits
     */
    function sendTipWithCredits(
        address author,
        uint256 amount
    ) external contractsInitialized nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(author != address(0), "Invalid author address");
        require(author != msg.sender, "Cannot tip yourself");
        
        // Check if user has enough credits
        require(HerStoriesCredits(creditsContract).balanceOf(msg.sender) >= amount * (10 ** 18), "Insufficient credits");
        
        // Transfer credits from tipper to author
        require(HerStoriesCredits(creditsContract).transfer(author, amount * (10 ** 18)), "Credit transfer failed");
        
        // Update author's credit balance
        HerStoriesCredits(creditsContract).earnCredits(author, amount, "Tip received");
        
        emit IntegrationAction(
            msg.sender,
            "TIP_CREDITS",
            0,
            0,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Send tip with ETH
     * @param author Author address
     */
    function sendTipWithETH(address author) external payable contractsInitialized nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(author != address(0), "Invalid author address");
        require(author != msg.sender, "Cannot tip yourself");
        
        // Process tip through payment contract
        HerStoriesPayment(paymentContract).sendTip{value: msg.value}(author, msg.value);
        
        emit IntegrationAction(
            msg.sender,
            "TIP_ETH",
            0,
            0,
            msg.value,
            block.timestamp
        );
    }
    
    /**
     * @dev Purchase credits with ETH
     * @param creditAmount Amount of credits to purchase
     */
    function purchaseCredits(uint256 creditAmount) external payable contractsInitialized nonReentrant {
        require(creditAmount > 0, "Amount must be greater than 0");
        
        // Purchase credits through credits contract
        HerStoriesCredits(creditsContract).purchaseCredits{value: msg.value}(creditAmount);
        
        emit IntegrationAction(
            msg.sender,
            "PURCHASE_CREDITS",
            0,
            0,
            creditAmount,
            block.timestamp
        );
    }
    
    /**
     * @dev Redeem credits for ETH
     * @param amount Amount of credits to redeem
     */
    function redeemCredits(uint256 amount) external contractsInitialized nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Redeem credits through credits contract
        HerStoriesCredits(creditsContract).redeemCredits(amount);
        
        emit IntegrationAction(
            msg.sender,
            "REDEEM_CREDITS",
            0,
            0,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Create story with integrated setup
     * @param title Story title
     * @param description Story description
     * @param category Story category
     * @param pricePerChapter Price per chapter in wei
     * @param impactPercentage Percentage for women's shelters
     * @param isAnonymous Whether to publish anonymously
     */
    function createStoryIntegrated(
        string memory title,
        string memory description,
        string memory category,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        bool isAnonymous
    ) external contractsInitialized {
        // Create story through story contract
        HerStoriesStory(storyContract).createStory(
            title,
            description,
            category,
            pricePerChapter,
            impactPercentage,
            isAnonymous
        );
        
        emit IntegrationAction(
            msg.sender,
            "CREATE_STORY",
            0,
            0,
            0,
            block.timestamp
        );
    }
    
    /**
     * @dev Add chapter with integrated setup
     * @param storyId Story ID
     * @param title Chapter title
     * @param contentHash IPFS hash of chapter content
     * @param price Chapter price
     */
    function addChapterIntegrated(
        uint256 storyId,
        string memory title,
        string memory contentHash,
        uint256 price
    ) external contractsInitialized {
        // Add chapter through story contract
        HerStoriesStory(storyContract).addChapter(storyId, title, contentHash, price);
        
        emit IntegrationAction(
            msg.sender,
            "ADD_CHAPTER",
            storyId,
            0,
            0,
            block.timestamp
        );
    }
    
    /**
     * @dev Get user's complete profile information
     * @param user User address
     */
    function getUserProfile(address user) external view contractsInitialized returns (
        uint256 creditBalance,
        uint256 totalEarnings,
        uint256 totalStories,
        uint256 totalChapters,
        uint256 totalReaders
    ) {
        creditBalance = HerStoriesCredits(creditsContract).getUserCreditBalance(user);
        
        // Get author profile from story contract
        HerStoriesStory.AuthorProfile memory authorProfile = HerStoriesStory(storyContract).getAuthorProfile(user);
        totalEarnings = authorProfile.totalEarnings;
        totalStories = authorProfile.totalStories;
        totalChapters = authorProfile.totalChapters;
        totalReaders = authorProfile.totalReaders;
    }
    
    /**
     * @dev Get story information with integrated data
     * @param storyId Story ID
     */
    function getStoryInfo(uint256 storyId) external view contractsInitialized returns (
        address author,
        string memory title,
        string memory description,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        uint256 totalChapters,
        uint256 totalReaders,
        uint256 totalEarnings,
        bool isPublished
    ) {
        HerStoriesStory.Story memory story = HerStoriesStory(storyContract).getStory(storyId);
        
        author = story.author;
        title = story.title;
        description = story.description;
        pricePerChapter = story.pricePerChapter;
        impactPercentage = story.impactPercentage;
        totalChapters = story.totalChapters;
        totalReaders = story.totalReaders;
        totalEarnings = story.totalEarnings;
        isPublished = story.isPublished;
    }
    
    /**
     * @dev Check if user has access to a chapter
     * @param user User address
     * @param storyId Story ID
     * @param chapterId Chapter ID
     */
    function hasChapterAccess(
        address user,
        uint256 storyId,
        uint256 chapterId
    ) external view contractsInitialized returns (bool) {
        return HerStoriesStory(storyContract).hasChapterAccess(user, storyId, chapterId);
    }
    
    /**
     * @dev Get user's purchase history
     * @param user User address
     */
    function getUserPurchaseHistory(address user) external view contractsInitialized returns (
        HerStoriesStory.Purchase[] memory storyPurchases,
        uint256[] memory creditTransactions
    ) {
        storyPurchases = HerStoriesStory(storyContract).getUserPurchases(user);
        creditTransactions = HerStoriesCredits(creditsContract).getUserTransactions(user);
    }
    
    /**
     * @dev Add authorized operator (owner only)
     * @param operator Address to authorize
     */
    function addAuthorizedOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        authorizedOperators[operator] = true;
    }
    
    /**
     * @dev Remove authorized operator (owner only)
     * @param operator Address to remove authorization from
     */
    function removeAuthorizedOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator address");
        authorizedOperators[operator] = false;
    }
    
    /**
     * @dev Emergency pause all contracts (owner only)
     */
    function emergencyPause() external onlyOwner {
        if (paymentContract != address(0)) {
            HerStoriesPayment(paymentContract).emergencyPause();
        }
        if (address(creditsContract) != address(0)) {
            HerStoriesCredits(creditsContract).pause();
        }
        if (address(storyContract) != address(0)) {
            HerStoriesStory(storyContract).pause();
        }
    }
    
    /**
     * @dev Emergency unpause all contracts (owner only)
     */
    function emergencyUnpause() external onlyOwner {
        if (paymentContract != address(0)) {
            HerStoriesPayment(paymentContract).emergencyUnpause();
        }
        if (address(creditsContract) != address(0)) {
            HerStoriesCredits(creditsContract).unpause();
        }
        if (address(storyContract) != address(0)) {
            HerStoriesStory(storyContract).unpause();
        }
    }
    
    /**
     * @dev Get contract addresses
     */
    function getContractAddresses() external view returns (
        address payment,
        address credits,
        address story
    ) {
        payment = address(paymentContract);
        credits = address(creditsContract);
        story = address(storyContract);
    }
    
    /**
     * @dev Get integration status
     */
    function getIntegrationStatus() external view returns (
        bool initialized,
        bool paymentLinked,
        bool creditsLinked,
        bool storyLinked
    ) {
        initialized = isInitialized;
        paymentLinked = address(paymentContract) != address(0);
        creditsLinked = address(creditsContract) != address(0);
        storyLinked = address(storyContract) != address(0);
    }
    
    /**
     * @dev Helper function to convert uint256 to string
     * @param _i The uint256 to convert
     * @return The string representation
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k -= 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
