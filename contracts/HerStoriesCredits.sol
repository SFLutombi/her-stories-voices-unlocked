// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HerStoriesCredits
 * @dev ERC20 token representing credits on the HerStories platform
 * @author HerStories Team
 */
contract HerStoriesCredits is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event CreditsPurchased(address indexed user, uint256 amount, uint256 cost);
    event CreditsRedeemed(address indexed user, uint256 amount);
    event CreditsTransferred(address indexed from, address indexed to, uint256 amount, string reason);
    event CreditRateUpdated(uint256 newRate, uint256 timestamp);
    event AuthorCreditsGranted(address indexed author, uint256 amount, string storyId);
    
    // State variables
    uint256 public creditPrice = 0.001 ether; // 1 credit = 0.001 ETH
    uint256 public constant CREDIT_DECIMALS = 18;
    uint256 public constant MIN_PURCHASE = 10; // Minimum 10 credits per purchase
    uint256 public constant MAX_PURCHASE = 10000; // Maximum 10,000 credits per purchase
    
    // Mappings
    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public userCreditBalance;
    mapping(address => uint256[]) public userTransactions;
    
    // Structs
    struct CreditTransaction {
        uint256 id;
        address user;
        uint256 amount;
        TransactionType transactionType;
        uint256 timestamp;
        string metadata; // Additional info like story ID, reason, etc.
    }
    
    enum TransactionType { PURCHASE, REDEMPTION, TRANSFER, GRANT, EARNED }
    
    // Modifiers
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= MAX_PURCHASE, "Amount exceeds maximum limit");
        _;
    }
    
    constructor() ERC20("HerStories Credits", "HSC") Ownable(msg.sender) {
        authorizedMinters[msg.sender] = true;
    }
    
    /**
     * @dev Purchase credits with ETH
     * @param creditAmount Amount of credits to purchase
     */
    function purchaseCredits(uint256 creditAmount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validAmount(creditAmount) 
    {
        require(creditAmount >= MIN_PURCHASE, "Amount below minimum purchase");
        require(creditAmount <= MAX_PURCHASE, "Amount exceeds maximum purchase");
        
        uint256 requiredEth = creditAmount * creditPrice;
        require(msg.value >= requiredEth, "Insufficient ETH sent");
        
        // Mint credits to user
        _mint(msg.sender, creditAmount * (10 ** CREDIT_DECIMALS));
        
        // Update user balance
        userCreditBalance[msg.sender] += creditAmount;
        
        // Record transaction
        _recordTransaction(msg.sender, creditAmount, TransactionType.PURCHASE, "Credit purchase");
        
        // Refund excess ETH if any
        if (msg.value > requiredEth) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredEth}("");
            require(success, "ETH refund failed");
        }
        
        emit CreditsPurchased(msg.sender, creditAmount, requiredEth);
    }
    
    /**
     * @dev Redeem credits for ETH (platform only)
     * @param amount Amount of credits to redeem
     */
    function redeemCredits(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount) 
    {
        require(balanceOf(msg.sender) >= amount * (10 ** CREDIT_DECIMALS), "Insufficient credits");
        require(userCreditBalance[msg.sender] >= amount, "Insufficient credit balance");
        
        // Burn credits
        _burn(msg.sender, amount * (10 ** CREDIT_DECIMALS));
        
        // Update user balance
        userCreditBalance[msg.sender] -= amount;
        
        // Calculate ETH to return
        uint256 ethAmount = amount * creditPrice;
        
        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        // Record transaction
        _recordTransaction(msg.sender, amount, TransactionType.REDEMPTION, "Credit redemption");
        
        emit CreditsRedeemed(msg.sender, amount);
    }
    
    /**
     * @dev Transfer credits to another user
     * @param to Recipient address
     * @param amount Amount of credits to transfer
     * @param reason Reason for transfer
     */
    function transferCredits(
        address to, 
        uint256 amount, 
        string memory reason
    ) external nonReentrant whenNotPaused validAmount(amount) {
        require(to != address(0), "Cannot transfer to zero address");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(userCreditBalance[msg.sender] >= amount, "Insufficient credit balance");
        
        // Transfer credits
        _transfer(msg.sender, to, amount * (10 ** CREDIT_DECIMALS));
        
        // Update balances
        userCreditBalance[msg.sender] -= amount;
        userCreditBalance[to] += amount;
        
        // Record transactions for both users
        _recordTransaction(msg.sender, amount, TransactionType.TRANSFER, reason);
        _recordTransaction(to, amount, TransactionType.TRANSFER, reason);
        
        emit CreditsTransferred(msg.sender, to, amount, reason);
    }
    
    /**
     * @dev Grant credits to an author (platform only)
     * @param author Author address
     * @param amount Amount of credits to grant
     * @param storyId Story identifier
     */
    function grantAuthorCredits(
        address author, 
        uint256 amount, 
        string memory storyId
    ) external onlyAuthorizedMinter validAmount(amount) {
        require(author != address(0), "Invalid author address");
        
        // Mint credits to author
        _mint(author, amount * (10 ** CREDIT_DECIMALS));
        
        // Update author balance
        userCreditBalance[author] += amount;
        
        // Record transaction
        _recordTransaction(author, amount, TransactionType.GRANT, storyId);
        
        emit AuthorCreditsGranted(author, amount, storyId);
    }
    
    /**
     * @dev Earn credits from story sales
     * @param author Author address
     * @param amount Amount of credits earned
     * @param storyId Story identifier
     */
    function earnCredits(
        address author, 
        uint256 amount, 
        string memory storyId
    ) external onlyAuthorizedMinter validAmount(amount) {
        require(author != address(0), "Invalid author address");
        
        // Mint credits to author
        _mint(author, amount * (10 ** CREDIT_DECIMALS));
        
        // Update author balance
        userCreditBalance[author] += amount;
        
        // Record transaction
        _recordTransaction(author, amount, TransactionType.EARNED, storyId);
    }
    
    /**
     * @dev Get user's credit balance
     * @param user User address
     */
    function getUserCreditBalance(address user) external view returns (uint256) {
        return userCreditBalance[user];
    }
    
    /**
     * @dev Get user's transaction history
     * @param user User address
     */
    function getUserTransactions(address user) external view returns (uint256[] memory) {
        return userTransactions[user];
    }
    
    /**
     * @dev Get transaction details
     * @param transactionId Transaction ID
     */
    function getTransaction(uint256 transactionId) external pure returns (CreditTransaction memory) {
        // This would need to be implemented with a mapping to store transactions
        // For now, returning empty struct
        return CreditTransaction({
            id: transactionId,
            user: address(0),
            amount: 0,
            transactionType: TransactionType.PURCHASE,
            timestamp: 0,
            metadata: ""
        });
    }
    
    /**
     * @dev Update credit price (owner only)
     * @param newPrice New price per credit in wei
     */
    function updateCreditPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        creditPrice = newPrice;
        emit CreditRateUpdated(newPrice, block.timestamp);
    }
    
    /**
     * @dev Add authorized minter (owner only)
     * @param minter Address to authorize
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Remove authorized minter (owner only)
     * @param minter Address to remove authorization from
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = false;
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
     * @dev Internal function to record transactions
     */
    function _recordTransaction(
        address user, 
        uint256 /* amount */, 
        TransactionType /* transactionType */, 
        string memory /* metadata */
    ) internal {
        // This is a simplified implementation
        // In a production contract, you'd want to store transaction details properly
        userTransactions[user].push(block.timestamp); // Using timestamp as simple ID
    }
    
    /**
     * @dev Override decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Override transfer to update credit balance
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        bool success = super.transfer(to, amount);
        if (success) {
            // Update credit balances (convert from token units to credit units)
            uint256 creditAmount = amount / (10 ** CREDIT_DECIMALS);
            userCreditBalance[msg.sender] -= creditAmount;
            userCreditBalance[to] += creditAmount;
        }
        return success;
    }
    
    /**
     * @dev Override transferFrom to update credit balance
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            // Update credit balances (convert from token units to credit units)
            uint256 creditAmount = amount / (10 ** CREDIT_DECIMALS);
            userCreditBalance[from] -= creditAmount;
            userCreditBalance[to] += creditAmount;
        }
        return success;
    }
}
