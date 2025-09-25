// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract QuestEscrow {
    struct Quest {
        address creator;
        uint256 amount;
        bool completed;
        bool fundsReleased;
        address claimer;
    }

    mapping(string => Quest) public quests;
    mapping(address => uint256) public balances;
    
    event QuestCreated(string questId, address creator, uint256 amount);
    event QuestCompleted(string questId, address claimer, uint256 amount);
    event FundsWithdrawn(address user, uint256 amount);

    modifier onlyQuestCreator(string memory questId) {
        require(quests[questId].creator == msg.sender, "Not quest creator");
        _;
    }

    modifier questExists(string memory questId) {
        require(quests[questId].creator != address(0), "Quest does not exist");
        _;
    }

    /**
     * Create a new quest and deposit funds into escrow
     */
    function createQuest(string memory questId) external payable {
        require(msg.value > 0, "Must deposit funds");
        require(quests[questId].creator == address(0), "Quest already exists");

        quests[questId] = Quest({
            creator: msg.sender,
            amount: msg.value,
            completed: false,
            fundsReleased: false,
            claimer: address(0)
        });

        emit QuestCreated(questId, msg.sender, msg.value);
    }

    /**
     * Release funds to claimer when quest is completed
     * Can only be called by quest creator (for now)
     */
    function releaseQuestFunds(string memory questId, address claimer) 
        external 
        onlyQuestCreator(questId) 
        questExists(questId) 
    {
        Quest storage quest = quests[questId];
        require(!quest.completed, "Quest already completed");
        require(!quest.fundsReleased, "Funds already released");
        require(claimer != address(0), "Invalid claimer address");

        quest.completed = true;
        quest.fundsReleased = true;
        quest.claimer = claimer;

        // Add funds to claimer's withdrawable balance
        balances[claimer] += quest.amount;

        emit QuestCompleted(questId, claimer, quest.amount);
    }

    /**
     * Withdraw available balance
     */
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");

        balances[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * Cancel quest and refund creator (only if not completed)
     */
    function cancelQuest(string memory questId) 
        external 
        onlyQuestCreator(questId) 
        questExists(questId) 
    {
        Quest storage quest = quests[questId];
        require(!quest.completed, "Quest already completed");
        require(!quest.fundsReleased, "Funds already released");

        uint256 refundAmount = quest.amount;
        quest.fundsReleased = true;

        // Add refund to creator's withdrawable balance
        balances[msg.sender] += refundAmount;
    }

    /**
     * Get quest details
     */
    function getQuest(string memory questId) 
        external 
        view 
        returns (address creator, uint256 amount, bool completed, bool fundsReleased, address claimer) 
    {
        Quest memory quest = quests[questId];
        return (quest.creator, quest.amount, quest.completed, quest.fundsReleased, quest.claimer);
    }

    /**
     * Get user's withdrawable balance
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * Check if quest has funds available
     */
    function hasAvailableFunds(string memory questId) external view returns (bool) {
        Quest memory quest = quests[questId];
        return quest.creator != address(0) && !quest.fundsReleased && quest.amount > 0;
    }
}
