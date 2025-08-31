// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleBDAGTransfer
 * @dev A minimal contract for transferring BDAG tokens from buyers to authors
 */
contract SimpleBDAGTransfer {
    
    // Events
    event ChapterPurchased(
        address indexed buyer,
        address indexed author,
        uint256 storyId,
        uint256 chapterId,
        uint256 amount
    );
    
    // State variables
    mapping(bytes32 => bool) public purchaseHistory; // storyId + chapterId + buyer
    
    // Owner for admin functions
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Purchase a chapter with BDAG tokens
     * @param _storyId The story ID
     * @param _chapterId The chapter ID
     * @param _author The author's wallet address
     */
    function purchaseChapter(
        uint256 _storyId,
        uint256 _chapterId,
        address _author
    ) external payable {
        require(msg.value > 0, "Must send BDAG tokens");
        require(_author != address(0), "Invalid author address");
        require(_author != msg.sender, "Cannot purchase from yourself");
        
        // Create unique purchase identifier
        bytes32 purchaseId = keccak256(abi.encodePacked(_storyId, _chapterId, msg.sender));
        require(!purchaseHistory[purchaseId], "Chapter already purchased by this user");
        
        // Mark as purchased
        purchaseHistory[purchaseId] = true;
        
        // Transfer BDAG directly to author (no platform fee for now)
        (bool success, ) = _author.call{value: msg.value}("");
        require(success, "Failed to transfer BDAG to author");
        
        // Emit event
        emit ChapterPurchased(
            msg.sender,
            _author,
            _storyId,
            _chapterId,
            msg.value
        );
    }
    
    /**
     * @dev Check if a chapter was purchased by a specific user
     * @param _storyId The story ID
     * @param _chapterId The chapter ID
     * @param _buyer The buyer's address
     * @return True if purchased
     */
    function isChapterPurchased(
        uint256 _storyId,
        uint256 _chapterId,
        address _buyer
    ) external view returns (bool) {
        bytes32 purchaseId = keccak256(abi.encodePacked(_storyId, _chapterId, _buyer));
        return purchaseHistory[purchaseId];
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Failed to withdraw");
    }
    
    // Fallback function to receive BDAG
    receive() external payable {}
}
