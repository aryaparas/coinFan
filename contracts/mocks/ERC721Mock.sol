// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mock is ERC721, Ownable  {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("ERC721Mock", "ERC721")
        Ownable(initialOwner)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://www.google.com/search?sca_esv=5da6c0e4b63a9ce6&rlz=1C5CHFA_enIN1107IN1109&sxsrf=ADLYWIIyyvpovtdPzJ3KIJQ-ok--nwipwQ:1718974835717&q=erc721&tbm=isch&source=lnms&fbs=AEQNm0Bqzy2A7JdsZg3J6bXbexmPsgjtQvlWZL7ndTLwEpr_IW9DW0gpDTlsyp82QhSGZwv6MOPPaQGyG8NjApG_8qJ8BNx7UFYZvvecp6jmI5v-RXrgjouCX5WEi2xhYvVz8MVVuK8reRtxgcB2ZtkjLf0qSaLDRew5bmHxY28SU5oo-_qub-fjUahexbcAznvxlSBrkgwK&sa=X&ved=2ahUKEwjUvNej4OyGAxVAT2wGHdWeCq8Q0pQJegQIEBAB&biw=1470&bih=712&dpr=2#imgrc=IxOBPM42V446lM";
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}
