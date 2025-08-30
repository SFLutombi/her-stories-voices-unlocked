// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title HerStoriesStory
 * @dev Smart contract for managing stories, chapters, and access control
 * @author HerStories Team
 */
contract HerStoriesStory is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    // Events
    event StoryCreated(
        uint256 indexed storyId,
        address indexed author,
        string title,
        string description,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        uint256 timestamp
    );
    
    event ChapterAdded(
        uint256 indexed storyId,
        uint256 indexed chapterId,
        string title,
        uint256 timestamp
    );
    
    event StoryPurchased(
        uint256 indexed storyId,
        uint256 indexed chapterId,
        address indexed buyer,
        address author,
        uint256 amount,
        uint256 timestamp
    );
    
    event StoryUpdated(
        uint256 indexed storyId,
        string title,
        string description,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        uint256 timestamp
    );
    
    event AuthorRegistered(
        address indexed author,
        string pseudonym,
        uint256 impactPercentage,
        uint256 timestamp
    );
    
    // Structs
    struct Story {
        uint256 id;
        address author;
        string title;
        string description;
        string category;
        uint256 pricePerChapter;
        uint256 impactPercentage;
        uint256 totalChapters;
        uint256 totalReaders;
        uint256 totalEarnings;
        bool isPublished;
        bool isAnonymous;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Chapter {
        uint256 id;
        uint256 storyId;
        string title;
        string contentHash; // IPFS hash of chapter content
        uint256 price;
        bool isPublished;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct AuthorProfile {
        address author;
        string pseudonym;
        uint256 impactPercentage;
        uint256 totalStories;
        uint256 totalChapters;
        uint256 totalReaders;
        uint256 totalEarnings;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Purchase {
        uint256 storyId;
        uint256 chapterId;
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }
    
    // State variables
    Counters.Counter private _storyIds;
    Counters.Counter private _chapterIds;
    
    uint256 public platformFee = 250; // 2.5% (250 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_IMPACT_PERCENTAGE = 50; // Maximum 50% for impact
    
    // Mappings
    mapping(uint256 => Story) public stories;
    mapping(uint256 => Chapter) public chapters;
    mapping(address => AuthorProfile) public authorProfiles;
    mapping(address => uint256[]) public authorStories;
    mapping(uint256 => uint256[]) public storyChapters;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public hasAccess; // user -> storyId -> chapterId -> hasAccess
    mapping(address => Purchase[]) public userPurchases;
    mapping(uint256 => mapping(uint256 => address[])) public chapterReaders; // storyId -> chapterId -> readers
    
    // Modifiers
    modifier onlyAuthor() {
        require(authorProfiles[msg.sender].isActive, "Not an active author");
        _;
    }
    
    modifier onlyStoryAuthor(uint256 storyId) {
        require(stories[storyId].author == msg.sender, "Not the story author");
        _;
    }
    
    modifier storyExists(uint256 storyId) {
        require(stories[storyId].id != 0, "Story does not exist");
        _;
    }
    
    modifier chapterExists(uint256 chapterId) {
        require(chapters[chapterId].id != 0, "Chapter does not exist");
        _;
    }
    
    modifier validPrice(uint256 price) {
        require(price > 0, "Price must be greater than 0");
        require(price <= 100 ether, "Price exceeds maximum limit");
        _;
    }
    
    modifier validImpactPercentage(uint256 percentage) {
        require(percentage <= MAX_IMPACT_PERCENTAGE, "Impact percentage too high");
        _;
    }
    
    constructor() Ownable(msg.sender) {
    }
    
    /**
     * @dev Register as an author
     * @param pseudonym Author's pseudonym
     * @param impactPercentage Percentage of earnings going to women's shelters
     */
    function registerAuthor(
        string memory pseudonym,
        uint256 impactPercentage
    ) external validImpactPercentage(impactPercentage) {
        require(!authorProfiles[msg.sender].isActive, "Already registered as author");
        require(bytes(pseudonym).length > 0, "Pseudonym cannot be empty");
        
        authorProfiles[msg.sender] = AuthorProfile({
            author: msg.sender,
            pseudonym: pseudonym,
            impactPercentage: impactPercentage,
            totalStories: 0,
            totalChapters: 0,
            totalReaders: 0,
            totalEarnings: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit AuthorRegistered(msg.sender, pseudonym, impactPercentage, block.timestamp);
    }
    
    /**
     * @dev Create a new story
     * @param title Story title
     * @param description Story description
     * @param category Story category
     * @param pricePerChapter Price per chapter in wei
     * @param impactPercentage Percentage for women's shelters
     * @param isAnonymous Whether to publish anonymously
     */
    function createStory(
        string memory title,
        string memory description,
        string memory category,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        bool isAnonymous
    ) external onlyAuthor validPrice(pricePerChapter) validImpactPercentage(impactPercentage) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        
        uint256 storyId = _storyIds.current();
        _storyIds.increment();
        
        _createStoryInternal(storyId, title, description, category, pricePerChapter, impactPercentage, isAnonymous);
    }
    
    /**
     * @dev Internal function to create story
     */
    function _createStoryInternal(
        uint256 storyId,
        string memory title,
        string memory description,
        string memory category,
        uint256 pricePerChapter,
        uint256 impactPercentage,
        bool isAnonymous
    ) private {
        stories[storyId] = Story({
            id: storyId,
            author: msg.sender,
            title: title,
            description: description,
            category: category,
            pricePerChapter: pricePerChapter,
            impactPercentage: impactPercentage,
            totalChapters: 0,
            totalReaders: 0,
            totalEarnings: 0,
            isPublished: false,
            isAnonymous: isAnonymous,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        authorStories[msg.sender].push(storyId);
        authorProfiles[msg.sender].totalStories++;
        
        emit StoryCreated(
            storyId,
            msg.sender,
            title,
            description,
            pricePerChapter,
            impactPercentage,
            block.timestamp
        );
    }
    
    /**
     * @dev Add a chapter to a story
     * @param storyId Story ID
     * @param title Chapter title
     * @param contentHash IPFS hash of chapter content
     * @param price Chapter price (0 for free chapters)
     */
    function addChapter(
        uint256 storyId,
        string memory title,
        string memory contentHash,
        uint256 price
    ) external onlyStoryAuthor(storyId) storyExists(storyId) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");
        require(price <= stories[storyId].pricePerChapter, "Price exceeds story limit");
        
        uint256 chapterId = _chapterIds.current();
        _chapterIds.increment();
        
        Chapter memory newChapter = Chapter({
            id: chapterId,
            storyId: storyId,
            title: title,
            contentHash: contentHash,
            price: price,
            isPublished: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        chapters[chapterId] = newChapter;
        storyChapters[storyId].push(chapterId);
        stories[storyId].totalChapters++;
        authorProfiles[msg.sender].totalChapters++;
        
        emit ChapterAdded(storyId, chapterId, title, block.timestamp);
    }
    
    /**
     * @dev Purchase access to a chapter
     * @param storyId Story ID
     * @param chapterId Chapter ID
     */
    function purchaseChapter(
        uint256 storyId,
        uint256 chapterId
    ) external payable nonReentrant storyExists(storyId) chapterExists(chapterId) {
        require(chapters[chapterId].storyId == storyId, "Chapter does not belong to story");
        require(chapters[chapterId].isPublished, "Chapter is not published");
        require(!hasAccess[msg.sender][storyId][chapterId], "Already have access");
        
        uint256 requiredAmount = chapters[chapterId].price;
        require(msg.value >= requiredAmount, "Insufficient payment");
        
        // Grant access first
        hasAccess[msg.sender][storyId][chapterId] = true;
        
        // Process the purchase
        _processChapterPurchase(storyId, chapterId, requiredAmount);
        
        // Refund excess ETH if any
        if (msg.value > requiredAmount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - requiredAmount}("");
            require(refundSuccess, "ETH refund failed");
        }
    }
    
    /**
     * @dev Internal function to process chapter purchase
     */
    function _processChapterPurchase(
        uint256 storyId,
        uint256 chapterId,
        uint256 amount
    ) private {
        Story storage story = stories[storyId];
        AuthorProfile storage authorProfile = authorProfiles[story.author];
        
        // Calculate fees and amounts
        uint256 platformFeeAmount = (amount * platformFee) / BASIS_POINTS;
        uint256 impactAmount = (amount * story.impactPercentage) / 100;
        uint256 authorAmount = amount - platformFeeAmount - impactAmount;
        
        // Update statistics
        story.totalReaders++;
        authorProfile.totalReaders++;
        story.totalEarnings += authorAmount;
        authorProfile.totalEarnings += authorAmount;
        
        // Record purchase
        userPurchases[msg.sender].push(Purchase({
            storyId: storyId,
            chapterId: chapterId,
            buyer: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true
        }));
        
        chapterReaders[storyId][chapterId].push(msg.sender);
        
        // Transfer funds
        (bool platformSuccess, ) = owner().call{value: platformFeeAmount}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool authorSuccess, ) = story.author.call{value: authorAmount}("");
        require(authorSuccess, "Author payment transfer failed");
        
        emit StoryPurchased(
            storyId,
            chapterId,
            msg.sender,
            story.author,
            amount,
            block.timestamp
        );
    }
    
    /**
     * @dev Update story details
     * @param storyId Story ID
     * @param title New title
     * @param description New description
     * @param pricePerChapter New price per chapter
     * @param impactPercentage New impact percentage
     */
    function updateStory(
        uint256 storyId,
        string memory title,
        string memory description,
        uint256 pricePerChapter,
        uint256 impactPercentage
    ) external onlyStoryAuthor(storyId) storyExists(storyId) validPrice(pricePerChapter) validImpactPercentage(impactPercentage) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        Story storage story = stories[storyId];
        story.title = title;
        story.description = description;
        story.pricePerChapter = pricePerChapter;
        story.impactPercentage = impactPercentage;
        story.updatedAt = block.timestamp;
        
        emit StoryUpdated(
            storyId,
            title,
            description,
            pricePerChapter,
            impactPercentage,
            block.timestamp
        );
    }
    
    /**
     * @dev Publish/unpublish a story
     * @param storyId Story ID
     * @param isPublished Whether to publish
     */
    function setStoryPublished(uint256 storyId, bool isPublished) external onlyStoryAuthor(storyId) storyExists(storyId) {
        stories[storyId].isPublished = isPublished;
        stories[storyId].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Publish/unpublish a chapter
     * @param chapterId Chapter ID
     * @param isPublished Whether to publish
     */
    function setChapterPublished(uint256 chapterId, bool isPublished) external {
        require(chapters[chapterId].id != 0, "Chapter does not exist");
        require(stories[chapters[chapterId].storyId].author == msg.sender, "Not the story author");
        
        chapters[chapterId].isPublished = isPublished;
        chapters[chapterId].updatedAt = block.timestamp;
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
    ) external view returns (bool) {
        return hasAccess[user][storyId][chapterId];
    }
    
    /**
     * @dev Get story details
     * @param storyId Story ID
     */
    function getStory(uint256 storyId) external view returns (Story memory) {
        return stories[storyId];
    }
    
    /**
     * @dev Get chapter details
     * @param chapterId Chapter ID
     */
    function getChapter(uint256 chapterId) external view returns (Chapter memory) {
        return chapters[chapterId];
    }
    
    /**
     * @dev Get author profile
     * @param author Author address
     */
    function getAuthorProfile(address author) external view returns (AuthorProfile memory) {
        return authorProfiles[author];
    }
    
    /**
     * @dev Get author's stories
     * @param author Author address
     */
    function getAuthorStories(address author) external view returns (uint256[] memory) {
        return authorStories[author];
    }
    
    /**
     * @dev Get story chapters
     * @param storyId Story ID
     */
    function getStoryChapters(uint256 storyId) external view returns (uint256[] memory) {
        return storyChapters[storyId];
    }
    
    /**
     * @dev Get user purchases
     * @param user User address
     */
    function getUserPurchases(address user) external view returns (Purchase[] memory) {
        return userPurchases[user];
    }
    
    /**
     * @dev Get chapter readers
     * @param storyId Story ID
     * @param chapterId Chapter ID
     */
    function getChapterReaders(uint256 storyId, uint256 chapterId) external view returns (address[] memory) {
        return chapterReaders[storyId][chapterId];
    }
    
    /**
     * @dev Update platform fee (owner only)
     * @param newFee New platform fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        platformFee = newFee;
    }
    
    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw ETH from contract (owner only)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }
    
    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalStories,
        uint256 totalChapters,
        uint256 totalAuthors,
        uint256 totalReaders
    ) {
        totalStories = _storyIds.current();
        totalChapters = _chapterIds.current();
        
        // Count active authors
        uint256 authorCount = 0;
        // This would need to be implemented with a proper counter
        // For now, returning 0
        
        // Count total readers
        uint256 readerCount = 0;
        // This would need to be implemented with a proper counter
        // For now, returning 0
        
        return (totalStories, totalChapters, authorCount, readerCount);
    }
}
