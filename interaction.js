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
            createPDFButton();
            console.log("Menus created");

            if (requestedCardTitle) {
                // Split the parameter by commas and normalize each entry
                let requestedCardTitles = requestedCardTitle.split(',').map(title => 
                    title.toLowerCase().replace(/\s+/g, '')
                );
            
                // Find matching cards for each requested title
                let matchedCards = cards.filter(card =>
                    requestedCardTitles.includes(card.filename.replace(/\s+/g, '').toLowerCase()) ||
                    requestedCardTitles.includes(card.cTitle.replace(/\s+/g, '').toLowerCase())
                );
                if (matchedCards.length > 1) {
                    arrangeMultipleCards(matchedCards)
                }else if (matchedCards.length > 0) {
                    arrangeCardsInCircle(matchedCards[0]);
                } else {
                    console.warn(`No matching cards found for: ${requestedCardTitles.join(', ')}`);
                }
            }            
        });
    });
}

function createPDFButton() {
    let pdfButton = createButton("Generate PDF");
    pdfButton.position(windowWidth - 120, windowHeight - 50);
    pdfButton.mousePressed(generatePDF);
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

function arrangeMultipleCards(selectedCards) {
    if (selectedCards.length === 0) return;

    // Center for selected cards
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 150; // Radius for selected cards

    // Position selected cards in a circle at the center
    let angleStep = TWO_PI / selectedCards.length;
    selectedCards.forEach((card, index) => {
        let angle = index * angleStep;
        card.xPos = centerX + cos(angle) * radius;
        card.yPos = centerY + sin(angle) * radius;
    });

    // Get remaining (non-selected) cards
    let otherCards = cards.filter(c => !selectedCards.includes(c));
    let totalOtherCards = otherCards.length;
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


function generatePDF() {
    const { jsPDF } = window.jspdf;  // Ensure jsPDF is properly accessed
    let pdf = new jsPDF({ unit: "mm", format: "a4" });

    let cardsPerPage = 9; // 3 rows x 3 columns
    let margin = 10;  // Padding from the edge
    let cardWidth = (210 - margin * 2) / 3;  // A4 width: 210mm
    let cardHeight = (297 - margin * 2) / 3; // A4 height: 297mm

    let x = margin;
    let y = margin;
    let count = 0;

    for (let i = 0; i < cards.length; i++) {
        if (!cards[i].visible) continue;  // Skip hidden cards

        let card = cards[i];

        // Correct the card name (replace "/" with a space)
        let cleanCardTitle = card.cTitle.replace(/\//g, " ");
        let cardName = card.filename || cleanCardTitle.replace(/ /g, "").toLowerCase();
        let qrText = `${window.location}/?card=${cardName}`;

        // Draw Card Outline
        pdf.setDrawColor(0);  // Black outline
        pdf.rect(x, y, cardWidth, cardHeight);

        // Add Centered Card Title
        pdf.setFontSize(12);
        let textWidth = pdf.getStringUnitWidth(cleanCardTitle) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        let textX = x + (cardWidth / 2) - (textWidth / 2); // Center text horizontally
        pdf.text(cleanCardTitle, textX, y + 15); // Slight offset for readability

        // Generate QR Code
        let qrCanvas = document.createElement("canvas");
        let qr = new QRious({ element: qrCanvas, value: qrText, size: 50 });

        // Center QR Code inside the card
        let qrSize = 30;  // Adjust QR code size
        let qrX = x + (cardWidth / 2) - (qrSize / 2);  // Centered horizontally
        let qrY = y + (cardHeight / 2) - (qrSize / 2);  // Centered vertically

        pdf.addImage(qrCanvas.toDataURL(), "PNG", qrX, qrY, qrSize, qrSize);

        // Move to Next Position
        x += cardWidth;
        count++;

        if (count % 3 === 0) {  // Move to the next row after 3 cards
            x = margin;
            y += cardHeight;
        }

        // If 9 cards are placed, add a new page
        if (count === cardsPerPage) {
            pdf.addPage();
            x = margin;
            y = margin;
            count = 0;
        }
    }

    // Save the PDF
    pdf.save("cards.pdf");
}
