let categoryCheckboxes = [];

const CARD_WIDTH_MM = 63.5; // Card width in mm
const CARD_HEIGHT_MM = 88.9; // Card height in mm
const BLEED_MM = 3; // Extra space for trimming in mm

function setup() {
    console.log("Setup started");

    let myCanvas = createCanvas(windowWidth, windowHeight);
    myCanvas.parent("myCanvas");

    rectMode(CENTER);
    console.log("Canvas created and parented");

    let urlParams = getURLParams();
    let requestedCardTitle = urlParams.card ? decodeURIComponent(urlParams.card) : null;
    let requestedCardState = urlParams.open ? decodeURIComponent(urlParams.open) : null;

    loadCardCategories(() => {
        console.log("Card categories loaded");

        // check if we need to "open" cards
        if (requestedCardState){

            console.log("Card state added to URL: " + requestedCardState);

            if (requestedCardState === "true"){
                console.log("Requested state is: true");
            }
        }

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
                    arrangeMultipleCardsNextToStacks(matchedCards)
                }else if (matchedCards.length > 0) {
                    arrangeMultipleCardsNextToStacks(matchedCards[0]);
                } else {
                    console.warn(`No matching cards found for: ${requestedCardTitles.join(', ')}`);
                }

                // "open" cards (make them large) if needed
                if (matchedCards.length > 0 && requestedCardState === "true") {
                    matchedCards.forEach((card, index) => {
                        card.makeLarge();
                    });
                }
            }            
        });
    });
}

function openPanel() {
    document.getElementById("pdfSettingsPanel").style.right = "0";
}

function closePanel() {
    document.getElementById("pdfSettingsPanel").style.right = "-300px";
}

function generatePDFWithSettings() {
    let includeQR = document.getElementById("includeQR").checked;
    let singlePage = document.getElementById("singlePage").checked;
    let colorMode = document.getElementById("colorMode").checked;

    generatePDF(includeQR, singlePage, colorMode);
    closePanel();
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
        // checkbox.style('color', `#${category.tColor}`);

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

function draw() {
    // The draw loop to constantly refresh the canvas

    // is this not the same loop as in sketch.js?

    clear(); // Clear canvas each frame

    //drawBack(); // Draw the background (if any drawing elements exist)

    if (!dragLock) {
        if (mouseOverVisibleCard()) {
            mOverCard = true;
            mOverTopCardID = getTopCardID();
            cursor(MOVE);
        } else {
            mOverCard = false;
            cursor(ARROW);
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
                let filename = cardElement.getChild('title')?.getString('forcedFilename') || cTitle;
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

async function generatePDF(includeQR, singlePage, colorMode) {
    const { jsPDF } = window.jspdf;

    const FULL_CARD_WIDTH = CARD_WIDTH_MM + (2 * BLEED_MM);
    const FULL_CARD_HEIGHT = CARD_HEIGHT_MM + (2 * BLEED_MM);

    let pdfFormat = singlePage ? [FULL_CARD_WIDTH, FULL_CARD_HEIGHT] : "a4";
    let pdf = new jsPDF({
        unit: "mm",
        format: pdfFormat,
        compress: true,
        precision: 10, 
    });

    let fontUrl = "cardsimulator/fonts/Ubuntu-Regular.ttf";
    try {
        let response = await fetch(fontUrl);
        if (!response.ok) throw new Error("Font fetch failed!");
        
        let fontBlob = await response.blob();
        let fontBase64 = await blobToBase64(fontBlob);
        pdf.addFileToVFS("Ubuntu-Regular.ttf", fontBase64);
        pdf.addFont("Ubuntu-Regular.ttf", "Ubuntu", "normal");
        pdf.setFont("Ubuntu");
    } catch (error) {
        pdf.setFont("helvetica"); 
    }

    const QR_SIZE = 30;
    const LINE_HEIGHT = 5;
    let margin = singlePage ? 0 : 10;
    let cardWidth = singlePage ? FULL_CARD_WIDTH : (210 - margin * 2) / 3;
    let cardHeight = singlePage ? FULL_CARD_HEIGHT : (297 - margin * 2) / 3;
    const MAX_TEXT_HEIGHT = cardHeight * 0.6;

    let x = margin;
    let y = margin;
    let count = 0;

    for (let i = 0; i < cards.length; i++) {
        if (!cards[i].visible) continue;

        let card = cards[i];
        let cleanCardTitle = card.cTitle.replace(/\//g, " ");
        let cardName = card.filename || cleanCardTitle.replace(/ /g, "").toLowerCase();
        let qrText = `${window.location.origin}/?card=${cardName}`;

        let categoryColor = "#FFFFFF"; 
        if (colorMode) {
            let category = cardCategories[card.cID] || { tColor: "CCCCCC" };
            categoryColor = `#${category.tColor}`;
        }

        pdf.setFillColor(categoryColor);
        pdf.rect(x, y, FULL_CARD_WIDTH, FULL_CARD_HEIGHT, "F");

        pdf.setTextColor(colorMode ? 255 : 0); 

        let safeX = x + BLEED_MM;
        let safeY = y + BLEED_MM;
        let safeWidth = CARD_WIDTH_MM;
        let safeHeight = CARD_HEIGHT_MM;

        if (!singlePage) {
            pdf.setDrawColor(0);
            pdf.rect(safeX, safeY, safeWidth, safeHeight);
        }

        pdf.setFontSize(14);
        let textLines = wrapText(cleanCardTitle, pdf, safeWidth - 10);
        let textHeight = textLines.length * LINE_HEIGHT;

        let textStartY;
        if (singlePage) {
            textStartY = safeY + (safeHeight / 2) - (textHeight / 2);
        } else {
            textStartY = safeY + 15;
        }

        for (let j = 0; j < textLines.length; j++) {
            if (textStartY + j * LINE_HEIGHT > safeY + MAX_TEXT_HEIGHT) break;
            pdf.text(textLines[j], safeX + safeWidth / 2, textStartY + j * LINE_HEIGHT, { align: "center" });
        }

        if (includeQR) {
            let qrCanvas = document.createElement("canvas");
            let qr = new QRious({
                element: qrCanvas,
                value: qrText,
                size: QR_SIZE * 4,
            });

            if (singlePage) {
                pdf.addPage();
                pdf.setFillColor(categoryColor);
                pdf.rect(0, 0, FULL_CARD_WIDTH, FULL_CARD_HEIGHT, "F");

                let qrX = (FULL_CARD_WIDTH / 2) - (QR_SIZE / 2);
                let qrY = (FULL_CARD_HEIGHT / 2) - (QR_SIZE / 2);
                pdf.addImage(qrCanvas.toDataURL(), "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
            } else {
                let qrX = safeX + (safeWidth / 2) - (QR_SIZE / 2);
                let qrY = textStartY + textHeight + 5;
                if (qrY + QR_SIZE < safeY + safeHeight) {
                    pdf.addImage(qrCanvas.toDataURL(), "PNG", qrX, qrY, QR_SIZE, QR_SIZE);
                }
            }
        }

        if (singlePage && i < cards.length - 1) {
            pdf.addPage();
        } else {
            x += cardWidth;
            count++;

            if (count % 3 === 0 && !singlePage) {
                x = margin;
                y += cardHeight;
            }

            if (count === 9 && !singlePage) {
                pdf.addPage();
                x = margin;
                y = margin;
                count = 0;
            }
        }
    }

    pdf.save("cards.pdf");
}

// Convert Blob to Base64 for embedding fonts
function blobToBase64(blob) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
    });
}


function wrapText(text, pdf, maxWidth) {
    let words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let testLine = currentLine + " " + words[i];
        let testWidth = pdf.getStringUnitWidth(testLine) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        
        if (testWidth < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}