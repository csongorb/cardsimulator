let categoryCheckboxes = [];

function setup() {
    console.log("Setup started");

    let myCanvas = createCanvas(windowWidth, windowHeight);
    myCanvas.parent("myCanvas");

    rectMode(CENTER);
    console.log("Canvas created and parented");

    let urlParams = getURLParams();
    let requestedCardTitle = urlParams.card ? decodeURIComponent(urlParams.card) : null;

    loadCardCategories(() => {
        console.log("Card categories loaded");

        loadCards(() => {
            console.log("Cards loaded");

            setupRowsAndColumns();
            initializeCardRowsAndColumns();
            console.log("initializeCardRowsAndColumns called");

            shuffleCards();
            console.log("Cards shuffled");

            createMenu();  // Existing menu in bottom left
            createCategoryFilterMenu();  // New menu in top left
            console.log("Menus created");

            if (requestedCardTitle) {
                let matchedCard = cards.find(card => card.filename.toLowerCase() === requestedCardTitle.toLowerCase());
                if (matchedCard) {
                    arrangeCardsInDoubleCircle(matchedCard);
                } else {
                    console.warn(`Card "${requestedCardTitle}" not found.`);
                }
            }
        });
    });
}



function createCategoryFilterMenu() {
    let menuX = 20;
    let menuY = 20;
    let checkboxSpacing = 25;

    categoryCheckboxes.forEach(checkbox => checkbox.remove());
    categoryCheckboxes = [];

    for (let i = 0; i < cardCategories.length; i++) {
        let category = cardCategories[i];

        let checkbox = createCheckbox(category.tTitle, true);
        checkbox.position(menuX, menuY + i * checkboxSpacing);
        checkbox.style('color', `#${category.tColor}`);

        checkbox.changed(() => {
            updateCardVisibility();
        });

        category.checkbox = checkbox;
        categoryCheckboxes.push(checkbox);
    }
}

function updateCardVisibility() {
    for (let card of cards) {
        let category = cardCategories[card.cID];
        if (category.checkbox.checked()) {
            card.visible = true;
        } else {
            card.visible = false;
        }
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

function draw() {
    // The draw loop to constantly refresh the canvas
    clear(); // Clear canvas each frame

    drawBack(); // Draw the background (if any drawing elements exist)

    if (!dragLock) {
        if (mouseOverVisibleCard()) {
            mOverCard = true;
            mOverTopCardID = getTopCardID();
            cursor(MOVE);
        } else {
            mOverCard = false;
            cursor(CROSS);
        }
    }

    // Display and update all the cards
    for (let i = 0; i < cards.length; i++) {
        if (i === mOverTopCardID) {
            cards[i].mOverAndTopCard = true;
        } else {
            cards[i].mOverAndTopCard = false;
        }
        cards[i].display();
    }
}

function loadCardCategories(callback) {
    loadXML('cards/cardCategories.xml', (xml) => {
        if (!xml) {
            console.error("Failed to load XML file for categories.");
            return;
        }

        // Directly get all 'cardCategory' children from the XML root
        let categoryElements = xml.getChildren('cardCategory');
        if (categoryElements.length === 0) {
            console.error("No category elements found in XML. XML structure might be incorrect.");
            console.log("XML Content:", xml);
            return;
        }

        // Clear existing categories
        cardCategories = [];

        for (let i = 0; i < categoryElements.length; i++) {
            let categoryElement = categoryElements[i];

            // Correctly extract attributes
            let tTitle = categoryElement.getChild('title').getContent(); // Getting the content of the child 'title'
            let tColor = categoryElement.getString('color'); // Correctly get the 'color' attribute
            let tRow = categoryElement.hasAttribute('row') ? parseInt(categoryElement.getString('row')) : 0; // Get 'row' attribute if present

            // Create a category and push to cardCategories array
            cardCategories.push({ tTitle, tColor, onlyBorder: false, tRow });
        }

        // Call the callback once categories are loaded
        if (callback) {
            callback();
        }
    });
}

function loadCards(callback) {
    loadXML('cards/cards.xml', (xml) => {
        if (!xml) {
            console.error("Failed to load XML file.");
            return;
        }

        let cardElements = xml.getChildren('card');
        if (cardElements.length === 0) {
            console.error("No card elements found in XML.");
            return;
        }

        // Clear the existing cards
        cards = [];

        for (let i = 0; i < cardElements.length; i++) {
            let cardElement = cardElements[i];

            // Safely extract the card type, default to "link" if undefined
            let cType = cardElement.getString('type') || "link";

            if (cType === 'display') {
                // Load only fields relevant for display cards
                let cID = parseInt(cardElement.getChild('cardCategoryId')?.getContent() || "0");
                let cText = cardElement.getChild('text')?.getContent() || "";
                let cTags = cardElement.getChildren('tag')?.map(linkElement => linkElement.getContent()) || [];

                // Create a card with only the required information for display type
                let card = new Card(cType, cID, null, null, cText, [], cTags);
                cards.push(card);
            } else {
                // Load fields for non-display cards (or untyped ones)
                let cID = parseInt(cardElement.getChild('cardCategoryId')?.getContent() || "0");
                let cTitle = cardElement.getChild('title')?.getContent() || "Untitled";
                let filename = cardElement.getChild('title')?.getString('forcedFilename') || "defaultFilename";
                let cText = cardElement.getChild('text')?.getContent() || "";

                // Get all links as an array of strings, default to empty array if no links are available
                let links = cardElement.getChildren('link').map(linkElement => linkElement.getContent()) || [];

                // Create the card object for non-display types
                let card = new Card(cType, cID, cTitle, filename, cText, links);
                cards.push(card);
            }
        }

        // Execute the callback once the cards have been loaded
        if (callback) {
            callback();
        }

        console.log("Cards loaded successfully");
    });
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