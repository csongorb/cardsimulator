
// Arrange Cards in different ways

function arrangeSelectedCardsOnALine(selectedCards, centerY){

    const centerX = windowWidth / 2;

    const spaceInbetween = width / (selectedCards.length + 2);

    console.log(selectedCards);

    // Position selected cards on a line in the middle

    if (selectedCards.length > 1){
        selectedCards.forEach((card, index) => {
            console.log(card.cTitle);
            card.xPos = centerX - ((spaceInbetween * (selectedCards.length-1)) / 2) + (index * spaceInbetween);
            card.yPos = centerY; 
        });
    } else {
        console.log('Got 1 card through parameter: ' + selectedCards.cTitle);
        selectedCards.xPos = centerX;
        selectedCards.yPos = centerY; 
    }
}

function arrangeCardsInCircle(selectedCard) {
    let centerX = windowWidth / 2;
    let centerY = windowHeight / 2;
    let radius = min(windowWidth, windowHeight) / 3; // Circle size relative to screen

    selectedCard.xPos = centerX;
    selectedCard.yPos = centerY;

    let angleStep = TWO_PI / (cards.length - 1);
    let angle = 0;

    shuffle(cards, true);

    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];

        // Skip the selected card, it's already centered
        if (card === selectedCard) continue;

        card.xPos = centerX + cos(angle) * radius;
        card.yPos = centerY + sin(angle) * radius;
        angle += angleStep;
    }

    console.log(`Cards arranged in a circle around: ${selectedCard.cTitle}`);
}
function arrangeCardsInDoubleCircle(selectedCard) {
    let centerX = windowWidth / 2;
    let centerY = windowHeight / 2;

    let innerRadius = min(windowWidth, windowHeight) / 4; // Smaller circle for same category
    let outerRadius = min(windowWidth, windowHeight) / 2.5; // Larger circle for other categories

    // Set selected card in the center
    selectedCard.xPos = centerX;
    selectedCard.yPos = centerY;

    // Split cards into same category and others
    let sameCategory = [];
    let otherCategories = [];

    for (let card of cards) {
        if (card === selectedCard) continue;
        if (card.cID === selectedCard.cID) {
            sameCategory.push(card);
        } else {
            otherCategories.push(card);
        }
    }

    // Distribute cards in circles
    placeCardsInCircle(sameCategory, centerX, centerY, innerRadius);
    placeCardsInCircle(otherCategories, centerX, centerY, outerRadius);

    console.log(`Cards arranged: ${sameCategory.length} in inner circle, ${otherCategories.length} in outer circle.`);
}

function placeCardsInCircle(cardList, centerX, centerY, radius) {
    let angleStep = TWO_PI / cardList.length;
    let angle = 0;

    for (let card of cardList) {
        card.xPos = centerX + cos(angle) * radius;
        card.yPos = centerY + sin(angle) * radius;
        angle += angleStep;
    }
}

function arrangeMultipleCardsNextToStacks(selectedCards) {
    if (selectedCards.length === 0) return;

    shuffle(cards, true);

    // Position selected cards on a line in the middle
    arrangeSelectedCardsOnALine(selectedCards, windowHeight/6*5);
}

function arrangeMultipleCardsInbetweenChaos(selectedCards) {

    if (selectedCards.length === 0) return;

    shuffle(cards, true);

    // Randomly distributing ALL cards
    // but with a gap in the middle
    var b = 50;
    for (var i = 0; i < cards.length; i++) {

        var gapX = 800;
        var gapY = 500;

        var randomX = random(b, windowWidth - b);
        var randomY = random(b, windowHeight - b);

        while ((randomX < (windowWidth/2) + (gapX/2) &&
        randomX > (windowWidth/2) - (gapX/2)) && 
        (randomY < (windowHeight/2) + (gapY/2) &&
        randomY > (windowHeight/2) - (gapY/2))) {
            randomX = random(b, windowWidth - b);
            randomY = random(b, windowHeight - b);
        }
        cards[i].newPos(randomX, randomY);
    }

    // Place selected cards
    const centerY = height / 2;
    arrangeSelectedCardsOnALine(selectedCards, centerY);
}

function arrangeMultipleCardsOnTheSide(selectedCards) {
    if (selectedCards.length === 0) return;

    shuffle(cards, true);

    let otherCards = cards;

    //otherCards = cards.filter(c => !selectedCards.includes(c));

    let totalOtherCards = cards;
    if (totalOtherCards === 0) return;

    // Get the largest card size
    let maxCardWidth = Math.max(...otherCards.map(c => c.cWidth));
    let maxCardHeight = Math.max(...otherCards.map(c => c.cHeight));

    // Define safe outer boundary
    let margin = 10; // Small margin to prevent clipping
    let safeLeft = margin + maxCardWidth / 2;
    let safeRight = width - margin - maxCardWidth / 2;
    let safeTop = margin + maxCardHeight / 2;
    let safeBottom = height - margin - maxCardHeight / 2;

    // Place one card in each corner first (if there are at least 4 cards)
    let remainingCards = [...otherCards];
    let corners = [];
    if (remainingCards.length >= 4) {
        corners.push(remainingCards.shift()); // Top-left
        corners.push(remainingCards.shift()); // Top-right
        corners.push(remainingCards.shift()); // Bottom-right
        corners.push(remainingCards.shift()); // Bottom-left
    }

    // Assign corner positions
    if (corners.length === 4) {
        corners[0].xPos = safeLeft;
        corners[0].yPos = safeTop; // Top-left

        corners[1].xPos = safeRight;
        corners[1].yPos = safeTop; // Top-right

        corners[2].xPos = safeRight;
        corners[2].yPos = safeBottom; // Bottom-right

        corners[3].xPos = safeLeft;
        corners[3].yPos = safeBottom; // Bottom-left
    }

    // Calculate available space after corners
    let horizontalSpace = safeRight - safeLeft - 2 * maxCardWidth; // Space between left and right, minus corners
    let verticalSpace = safeBottom - safeTop - 2 * maxCardHeight; // Space between top and bottom, minus corners

    let totalEdgeCards = remainingCards.length;

    // Split the remaining cards evenly along the edges
    let numTop = Math.floor(totalEdgeCards * (horizontalSpace / (2 * horizontalSpace + 2 * verticalSpace)));
    let numRight = Math.floor(totalEdgeCards * (verticalSpace / (2 * horizontalSpace + 2 * verticalSpace)));
    let numBottom = Math.floor(totalEdgeCards * (horizontalSpace / (2 * horizontalSpace + 2 * verticalSpace)));
    let numLeft = totalEdgeCards - (numTop + numRight + numBottom); // Ensure all are used

    let index = 0;

    // Distribute cards along the top edge (between corners)
    for (let i = 0; i < numTop && remainingCards.length > 0; i++) {
        let card = remainingCards.shift();
        card.xPos = safeLeft + maxCardWidth + (i * (horizontalSpace / (numTop - 1)));
        card.yPos = safeTop;
    }

    // Distribute cards along the right edge (between corners)
    for (let i = 0; i < numRight && remainingCards.length > 0; i++) {
        let card = remainingCards.shift();
        card.xPos = safeRight;
        card.yPos = safeTop + maxCardHeight + (i * (verticalSpace / (numRight - 1)));
    }

    // Distribute cards along the bottom edge (between corners)
    for (let i = 0; i < numBottom && remainingCards.length > 0; i++) {
        let card = remainingCards.shift();
        card.xPos = safeRight - maxCardWidth - (i * (horizontalSpace / (numBottom - 1)));
        card.yPos = safeBottom;
    }

    // Distribute cards along the left edge (between corners)
    for (let i = 0; i < numLeft && remainingCards.length > 0; i++) {
        let card = remainingCards.shift();
        card.xPos = safeLeft;
        card.yPos = safeBottom - maxCardHeight - (i * (verticalSpace / (numLeft - 1)));
    }

    // Place for selected cards
    const centerY = height / 2;
    
    // Position selected cards on a line in the middle
    arrangeSelectedCardsOnALine(selectedCards, centerY);
}


function shuffleCards() {
    if (stackT == 0) { // stackType == stack
        for (var i = 0; i < cards.length; i++) {
            cards[i].newPos(windowWidth / 2, windowHeight / 2);
        }
    }

    if (stackT == 1) { // stackType == stacks
        var longestRow = 0;
        for (var iRow = 0; iRow < rowsAndColumns.length; iRow++) {
            if (rowsAndColumns[iRow].length > rowsAndColumns[longestRow].length) {
                longestRow = iRow;
            }
        }

        // calculate spaces inbetween cards (depending on longestRow)
        var longestRowLength = rowsAndColumns[longestRow].length;
        var border = cards[0].cWidth / 2;
        var cardSpaceWidth = windowWidth - (2 * border);
        var maxDistanceBetweenCards = (cardSpaceWidth - cards[0].cWidth) / (longestRowLength - 1);
        var distanceBetweenCards = Math.min(maxDistanceBetweenCards, cards[0].cWidth * 1.2);

        var rowCount = rowsAndColumns.length;
        var startY = (windowHeight / 2) - (distanceBetweenCards * (rowCount - 1) / 2);

        for (var iRow = 0; iRow < rowsAndColumns.length; iRow++) {
            var columnLength = rowsAndColumns[iRow].length;
            var startX = (windowWidth / 2) - (distanceBetweenCards * (columnLength - 1) / 2);

            for (var iColumn = 0; iColumn < columnLength; iColumn++) {
                for (var iCards = 0; iCards < cards.length; iCards++) {
                    if (cards[iCards].cID == rowsAndColumns[iRow][iColumn]) {
                        cards[iCards].newPos(startX + (iColumn * distanceBetweenCards), startY + (iRow * distanceBetweenCards));
                    }
                }
            }
        }
    }

    if (stackT == 2) { // stackType == chaos
        var b = 50;
        for (var i = 0; i < cards.length; i++) {
            cards[i].newPos(random(b, windowWidth - b), random(b, windowHeight - b));
        }
    }

    for (var i = 0; i < cards.length; i++) {
        cards[i].newRotation();
    }

    cards.shuffle();
    if (stackT == 1) {
        separateStacks();
    }
}

function separateStacks() {
    for (var i = cardCategories.length; i >= 0; i--) {
        for (var j = 0; j < cards.length; j++) {
            if (cards[j].cID == i) {
                cards.move(j, cards.length - 1);
            }
        }
    }
}

function moveFirstRowCardsToTop() {
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].cID == 0) {
            cards.move(i, cards.length - 1);
        }
    }
}

function initializeCardRowsAndColumns() {
    console.log("Test"); // Use "Test" in quotes to log it as a string

    // Define the starting positions
    let centerX = windowWidth / 2; // Center of the canvas horizontally
    let startY = 100; // A constant starting Y position to keep cards near the top

    // Iterate over all cards to set their initial positions
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        card.xPos = centerX; // Center each card horizontally
        card.yPos = startY;  // Place them all at the same Y position (startY)
    }
}
function shuffleCards() {
    console.log("Shuffling cards...");

    // Check if cards or rowsAndColumns are defined and have elements
    if (!cards || cards.length === 0) {
        console.error("shuffleCards: 'cards' is undefined or empty.");
        return;
    }

    if (!rowsAndColumns || rowsAndColumns.length === 0) {
        console.error("shuffleCards: 'rowsAndColumns' is undefined or empty.");
        return;
    }

    if (stackT == 0) { // stackType == stack
        for (let i = 0; i < cards.length; i++) {
            cards[i].newPos(windowWidth / 2, windowHeight / 2);
        }
    }

    if (stackT == 1) { // stackType == stacks
        let longestRow = 0;
        for (let iRow = 0; iRow < rowsAndColumns.length; iRow++) {
            if (rowsAndColumns[iRow].length > rowsAndColumns[longestRow].length) {
                longestRow = iRow;
            }
        }

        // Calculate spaces in between cards (depending on longestRow)
        let longestRowLength = rowsAndColumns[longestRow].length;
        let border = cards[0].cWidth / 2;
        let cardSpaceWidth = windowWidth - (2 * border);
        let maxDistanceBetweenCards = (cardSpaceWidth - cards[0].cWidth) / (longestRowLength - 1);
        let distanceBetweenCards = Math.min(maxDistanceBetweenCards, cards[0].cWidth * 1.2);

        let rowCount = rowsAndColumns.length;
        let startY = (windowHeight / 2) - (distanceBetweenCards * (rowCount - 1) / 2);

        for (let iRow = 0; iRow < rowsAndColumns.length; iRow++) {
            let columnLength = rowsAndColumns[iRow].length;
            let startX = (windowWidth / 2) - (distanceBetweenCards * (columnLength - 1) / 2);

            for (let iColumn = 0; iColumn < columnLength; iColumn++) {
                for (let iCards = 0; iCards < cards.length; iCards++) {
                    if (cards[iCards].cID == rowsAndColumns[iRow][iColumn]) {
                        cards[iCards].newPos(startX + (iColumn * distanceBetweenCards), startY + (iRow * distanceBetweenCards));
                    }
                }
            }
        }
    }

    if (stackT == 2) { // stackType == chaos
        let b = 50;
        for (let i = 0; i < cards.length; i++) {
            cards[i].newPos(random(b, windowWidth - b), random(b, windowHeight - b));
        }
    }

    for (let i = 0; i < cards.length; i++) {
        cards[i].newRotation();
    }

    console.log("Shuffling complete.");
    cards.shuffle();
    if (stackT == 1) {
        separateStacks();
    } else {
        //moveFirstRowCardsToTop();
    }
}
function setupRowsAndColumns() {
    console.log("Setting up rows and columns...");

    // Reset rowsAndColumns to an empty array
    rowsAndColumns = [];

    // Determine the number of rows required based on card categories
    rowCount = 0;
    for (let i = 0; i < cardCategories.length; i++) {
        if (cardCategories[i].tRow > rowCount) {
            rowCount = cardCategories[i].tRow;
        }
    }
    rowCount++; 

    for (let ii = 0; ii < rowCount; ii++) {
        rowsAndColumns[ii] = [];
        for (let i = 0; i < cardCategories.length; i++) {
            if (cardCategories[i].tRow == ii) {
                rowsAndColumns[ii].push(i);
            }
        }
    }

    console.log("Rows and columns setup complete:", rowsAndColumns);
}