// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HerStoriesPayment
 * @dev Smart contract for handling payments between users for story purchases
 * @author HerStories Team
 */
contract HerStoriesPayment is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    // Events
    event PaymentProcessed(
        uint256 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string storyId,
        string chapterId,
        PaymentType paymentType,
        uint256 timestamp
    );
    
    event PaymentFailed(
        uint256 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string reason
    );
    
    event PlatformFeeUpdated(uint256 newFee, uint256 timestamp);
    event ImpactPercentageUpdated(address indexed author, uint256 newPercentage, uint256 timestamp);
    
    // Structs
    struct Payment {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        string storyId;
        string chapterId;
        PaymentType paymentType;
        PaymentStatus status;
        uint256 timestamp;
        string transactionHash;
    }
    
    struct AuthorProfile {
        address author;
        uint256 impactPercentage; // Percentage going to women's shelters (0-100)
        uint256 totalEarnings;
        uint256 totalStories;
        bool isActive;
    }
    
    // Enums
    enum PaymentType { STORY_PURCHASE, TIP, DONATION }
    enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED }
    
    // State variables
    Counters.Counter private _paymentIds;
    uint256 public platformFee = 250; // 2.5% (250 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Mappings
    mapping(uint256 => Payment) public payments;
    mapping(address => AuthorProfile) public authorProfiles;
    mapping(address => uint256[]) public userPayments;
    mapping(string => uint256[]) public storyPayments;
    
    // Modifiers
    modifier onlyAuthor() {
        require(authorProfiles[msg.sender].isActive, "Not an active author");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= 1000 ether, "Amount exceeds maximum limit");
        _;
    }
    
    modifier validImpactPercentage(uint256 percentage) {
        require(percentage <= 100, "Impact percentage cannot exceed 100%");
        _;
    }
    
    constructor() Ownable(msg.sender) {
    }
    
    /**
     * @dev Process a payment for story purchase
     * @param to Author's address
     * @param storyId Story identifier
     * @param chapterId Chapter identifier
     * @param amount Amount in wei
     */
    function purchaseStory(
        address to,
        string memory storyId,
        string memory chapterId,
        uint256 amount
    ) external payable nonReentrant whenNotPaused validAmount(amount) {
        require(msg.value == amount, "Incorrect payment amount");
        require(to != address(0), "Invalid author address");
        require(to != msg.sender, "Cannot purchase from yourself");
        require(authorProfiles[to].isActive, "Author is not active");
        
        uint256 paymentId = _paymentIds.current();
        _paymentIds.increment();
        
        // Calculate fees and amounts
        uint256 platformFeeAmount = (amount * platformFee) / BASIS_POINTS;
        uint256 impactAmount = (amount * authorProfiles[to].impactPercentage) / 100;
        uint256 authorAmount = amount - platformFeeAmount - impactAmount;
        
        // Create payment record
        Payment memory newPayment = Payment({
            id: paymentId,
            from: msg.sender,
            to: to,
            amount: amount,
            storyId: storyId,
            chapterId: chapterId,
            paymentType: PaymentType.STORY_PURCHASE,
            status: PaymentStatus.COMPLETED,
            timestamp: block.timestamp,
            transactionHash: ""
        });
        
        payments[paymentId] = newPayment;
        userPayments[msg.sender].push(paymentId);
        userPayments[to].push(paymentId);
        storyPayments[storyId].push(paymentId);
        
        // Update author profile
        authorProfiles[to].totalEarnings += authorAmount;
        
        // Transfer funds
        (bool platformSuccess, ) = owner().call{value: platformFeeAmount}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool authorSuccess, ) = to.call{value: authorAmount}("");
        require(authorSuccess, "Author payment transfer failed");
        
        // Impact amount stays in contract for now (can be withdrawn by owner to shelters)
        
        emit PaymentProcessed(
            paymentId,
            msg.sender,
            to,
            amount,
            storyId,
            chapterId,
            PaymentType.STORY_PURCHASE,
            block.timestamp
        );
    }
    
    /**
     * @dev Send a tip to an author
     * @param to Author's address
     * @param amount Amount in wei
     */
    function sendTip(
        address to,
        uint256 amount
    ) external payable nonReentrant whenNotPaused validAmount(amount) {
        require(msg.value == amount, "Incorrect payment amount");
        require(to != address(0), "Invalid author address");
        require(to != msg.sender, "Cannot tip yourself");
        require(authorProfiles[to].isActive, "Author is not active");
        
        uint256 paymentId = _paymentIds.current();
        _paymentIds.increment();
        
        // Calculate fees
        uint256 platformFeeAmount = (amount * platformFee) / BASIS_POINTS;
        uint256 authorAmount = amount - platformFeeAmount;
        
        // Create payment record
        Payment memory newPayment = Payment({
            id: paymentId,
            from: msg.sender,
            to: to,
            amount: amount,
            storyId: "",
            chapterId: "",
            paymentType: PaymentType.TIP,
            status: PaymentStatus.COMPLETED,
            timestamp: block.timestamp,
            transactionHash: ""
        });
        
        payments[paymentId] = newPayment;
        userPayments[msg.sender].push(paymentId);
        userPayments[to].push(paymentId);
        
        // Update author profile
        authorProfiles[to].totalEarnings += authorAmount;
        
        // Transfer funds
        (bool platformSuccess, ) = owner().call{value: platformFeeAmount}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool authorSuccess, ) = to.call{value: authorAmount}("");
        require(authorSuccess, "Author payment transfer failed");
        
        emit PaymentProcessed(
            paymentId,
            msg.sender,
            to,
            amount,
            "",
            "",
            PaymentType.TIP,
            block.timestamp
        );
    }
    
    /**
     * @dev Make a donation to women's shelters
     * @param amount Amount in wei
     */
    function makeDonation(uint256 amount) external payable nonReentrant whenNotPaused validAmount(amount) {
        require(msg.value == amount, "Incorrect payment amount");
        
        uint256 paymentId = _paymentIds.current();
        _paymentIds.increment();
        
        // Create payment record
        Payment memory newPayment = Payment({
            id: paymentId,
            from: msg.sender,
            to: address(0), // Zero address for donations
            amount: amount,
            storyId: "",
            chapterId: "",
            paymentType: PaymentType.DONATION,
            status: PaymentStatus.COMPLETED,
            timestamp: block.timestamp,
            transactionHash: ""
        });
        
        payments[paymentId] = newPayment;
        userPayments[msg.sender].push(paymentId);
        
        // Donation amount stays in contract for withdrawal to shelters
        
        emit PaymentProcessed(
            paymentId,
            msg.sender,
            address(0),
            amount,
            "",
            "",
            PaymentType.DONATION,
            block.timestamp
        );
    }
    
    /**
     * @dev Register as an author
     * @param impactPercentage Percentage of earnings going to women's shelters
     */
    function registerAuthor(uint256 impactPercentage) external validImpactPercentage(impactPercentage) {
        require(!authorProfiles[msg.sender].isActive, "Already registered as author");
        
        authorProfiles[msg.sender] = AuthorProfile({
            author: msg.sender,
            impactPercentage: impactPercentage,
            totalEarnings: 0,
            totalStories: 0,
            isActive: true
        });
    }
    
    /**
     * @dev Update impact percentage
     * @param newPercentage New impact percentage
     */
    function updateImpactPercentage(uint256 newPercentage) external onlyAuthor validImpactPercentage(newPercentage) {
        authorProfiles[msg.sender].impactPercentage = newPercentage;
        emit ImpactPercentageUpdated(msg.sender, newPercentage, block.timestamp);
    }
    
    /**
     * @dev Get payment details
     * @param paymentId Payment ID
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        require(paymentId < _paymentIds.current(), "Payment does not exist");
        return payments[paymentId];
    }
    
    /**
     * @dev Get user's payment history
     * @param user User address
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }
    
    /**
     * @dev Get story's payment history
     * @param storyId Story identifier
     */
    function getStoryPayments(string memory storyId) external view returns (uint256[] memory) {
        return storyPayments[storyId];
    }
    
    /**
     * @dev Get author profile
     * @param author Author address
     */
    function getAuthorProfile(address author) external view returns (AuthorProfile memory) {
        return authorProfiles[author];
    }
    
    /**
     * @dev Update platform fee (owner only)
     * @param newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee, block.timestamp);
    }
    
    /**
     * @dev Withdraw impact funds to shelters (owner only)
     * @param amount Amount to withdraw
     * @param shelterAddress Shelter wallet address
     */
    function withdrawImpactFunds(uint256 amount, address shelterAddress) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(shelterAddress != address(0), "Invalid shelter address");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = shelterAddress.call{value: amount}("");
        require(success, "Impact funds transfer failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency pause (owner only)
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Emergency unpause (owner only)
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // Accept ETH payments
    }
}
