// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TicketNFT
 * @dev NFT contract for event tickets with resale price caps and royalties
 */
contract TicketNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    struct Ticket {
        uint256 eventId;
        uint256 originalPrice;
        uint256 maxResalePrice;
        uint256 royaltyPercentage;
        address originalOwner;
        bool isUsed;
    }

    struct Listing {
        uint256 price;
        address seller;
        bool isActive;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => bool) public eventExists;
    
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner, string tokenURI);
    event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event TicketUnlisted(uint256 indexed tokenId, address indexed seller);
    event TicketSold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event TicketUsed(uint256 indexed tokenId, address indexed owner);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed organizer, uint256 amount);

    constructor() ERC721("EventTicket", "TICKET") Ownable(msg.sender) {}

    function mintTicket(
        address to,
        uint256 eventId,
        uint256 originalPrice,
        uint256 maxResalePrice,
        uint256 royaltyPercentage,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(maxResalePrice >= originalPrice, "Max resale price must be >= original price");
        require(royaltyPercentage <= 50, "Royalty cannot exceed 50%");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tickets[tokenId] = Ticket({
            eventId: eventId,
            originalPrice: originalPrice,
            maxResalePrice: maxResalePrice,
            royaltyPercentage: royaltyPercentage,
            originalOwner: to,
            isUsed: false
        });

        eventExists[eventId] = true;

        emit TicketMinted(tokenId, eventId, to, tokenURI);
        return tokenId;
    }

    function listForSale(uint256 tokenId, uint256 price) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the ticket owner");
        require(!tickets[tokenId].isUsed, "Cannot sell used ticket");
        require(price <= tickets[tokenId].maxResalePrice, "Price exceeds maximum resale price");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");

        listings[tokenId] = Listing({
            price: price,
            seller: msg.sender,
            isActive: true
        });

        emit TicketListed(tokenId, price, msg.sender);
    }

    function unlistFromSale(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].isActive, "Not listed");

        listings[tokenId].isActive = false;

        emit TicketUnlisted(tokenId, msg.sender);
    }

    function buyListedTicket(uint256 tokenId) public payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(listings[tokenId].isActive, "Ticket not listed");
        require(!tickets[tokenId].isUsed, "Ticket already used");
        
        Listing memory listing = listings[tokenId];
        Ticket memory ticket = tickets[tokenId];
        
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy your own ticket");

        uint256 royaltyAmount = (listing.price * ticket.royaltyPercentage) / 100;
        uint256 sellerAmount = listing.price - royaltyAmount;

        address seller = listing.seller;
        _transfer(seller, msg.sender, tokenId);

        listings[tokenId].isActive = false;

        (bool successSeller, ) = payable(seller).call{value: sellerAmount}("");
        require(successSeller, "Failed to send payment to seller");

        if (royaltyAmount > 0) {
            (bool successRoyalty, ) = payable(ticket.originalOwner).call{value: royaltyAmount}("");
            require(successRoyalty, "Failed to send royalty payment");
            emit RoyaltyPaid(tokenId, ticket.originalOwner, royaltyAmount);
        }

        emit TicketSold(tokenId, seller, msg.sender, listing.price);
    }

    function useTicket(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!tickets[tokenId].isUsed, "Ticket already used");

        tickets[tokenId].isUsed = true;

        emit TicketUsed(tokenId, ownerOf(tokenId));
    }

    function getTicket(uint256 tokenId) public view returns (Ticket memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tickets[tokenId];
    }

    function getListing(uint256 tokenId) public view returns (Listing memory) {
        return listings[tokenId];
    }

    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        return !tickets[tokenId].isUsed;
    }

    function getTicketsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 totalSupply = _tokenIdCounter;
        uint256 ownerBalance = balanceOf(owner);
        uint256[] memory result = new uint256[](ownerBalance);
        uint256 counter = 0;

        for (uint256 i = 0; i < totalSupply; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == owner) {
                result[counter] = i;
                counter++;
            }
        }

        return result;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}