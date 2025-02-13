//global vars
var cardCategories = [];
var cards = [];

var backLines = [];
var lineC;
var colorSelect;
var aLine;

var mOverCard = false;
var mOverTopCardID;
var xDif, yDif;
var dragLock = false;
var isPainting = false;

var debugOn = false;

var stacked = true;
var stackT = 1;
var sStack;

var rowCount = 0;
var rowsAndColumns = [];

var mCheckbox = [];
var mCheckboxRows = [];
var changedCheckboxId;

var backImage;

//momentum vars
var dragMult = 0.9;
var oldMouseX;
var oldMouseY;
var draggedCard = null;
let offsetX = 0;
let offsetY = 0;
let clickedCard = null;

// p5 method: setup is called when the website is first loaded
function setup() {
    var myCanvas = createCanvas(windowWidth, windowHeight);
    myCanvas.parent("myCanvas");

    rectMode(CENTER);
    textFont("Helvetica Neue");

    loadCardCategories();
    loadCards();

    for (i = 0; i < cardCategories.length; i++) {
        if (cardCategories[i].tRow > rowCount) {
            rowCount = cardCategories[i].tRow;
        }
    }
    rowCount++;

    // composite the rows & columns of each stack
    for (var ii = 0; ii < rowCount; ii++) {
        rowsAndColumns[ii] = [];
        for (var i = 0; i < cardCategories.length; i++) {
            if (cardCategories[i].tRow == ii) {
                rowsAndColumns[ii].push(i);
            }
        }
    }

    shuffleCards();

    lineC = color(255, 0, 0);
}

// p5 method: draw is called every frame
function draw() {
    clear();
    drawBack();

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

    for (var i = 0; i < cards.length; i++) {
        if (cards[i].visible) { 
            cards[i].display();
        }
    }
    

    if (debugOn) {
        noStroke();
        fill(200);
        strokeWeight(0);
        textSize(12);
        text("frameRate: " + nf(frameRate(), 2, 2), 800, 40);
    }

    oldMouseX = mouseX;
    oldMouseY = mouseY;
}

function drawBack() {
    for (let i = 0; i < cards.length; i++) {
        cards[i].draw();
    }
}

function mousePressed() {
    // Loop through the cards array in reverse order to check from topmost to bottommost
    for (let i = cards.length - 1; i >= 0; i--) {
        let card = cards[i];

        // Check if the mouse is over the card to initiate dragging
        if (card.mouseOver()) {
            // Set the clicked card
            clickedCard = card;

            // Set the card as the one being dragged
            draggedCard = card;

            // Calculate the offset between the mouse position and the card's top-left corner
            offsetX = mouseX - card.xPos;
            offsetY = mouseY - card.yPos;

            // Move the selected card to the end of the array to bring it on top
            cards.splice(i, 1);
            cards.push(draggedCard);

            break; // Stop after finding the first card that matches
        }
    }
}

function mouseDragged() {
    if (draggedCard) {
        // Update the position of the dragged card based on the mouse position minus the offset
        draggedCard.xPos = mouseX - offsetX;
        draggedCard.yPos = mouseY - offsetY;
        clickedCard = null; // If the card is dragged, it should not be considered clicked
    }
}

function mouseReleased() {
    let linkClicked = false;

    // Loop through all cards to check for interactions
    for (let i = cards.length - 1; i >= 0; i--) {
        let card = cards[i];

        // Only proceed if the card is large (expanded state)
        if (card.cType === "link" && card.isLarge) {
            // Check if any of the link placeholders are clicked
            for (let j = 0; j < card.linkBounds.length; j++) {
                const bounds = card.linkBounds[j];

                // If mouse is within the bounds of the placeholder
                if (mouseX > bounds.left && mouseX < bounds.right && mouseY > bounds.top && mouseY < bounds.bottom) {
                    // Open the corresponding link in a new tab
                    window.open(card.cLinks[bounds.linkIndex], '_blank');
                    linkClicked = true;
                    break; // Exit the loop once the link is clicked
                }
            }

            if (linkClicked) {
                break; // Exit the card loop if a link is clicked
            }
        }
    }

    // Only toggle the card size if no link was clicked
    if (!linkClicked && clickedCard) {
        // Toggle the size of the card if it was clicked but not dragged
        if (clickedCard.cWidth > 160) {
            // Shrink back to original size
            clickedCard.cWidth /= 5;
            clickedCard.cHeight /= 4;
            clickedCard.textSize /= 2;
            clickedCard.isLarge = false;
        } else {
            // Make the card bigger
            clickedCard.cWidth *= 5;
            clickedCard.cHeight *= 4;
            clickedCard.textSize *= 2;
            clickedCard.isLarge = true;
        }
        clickedCard = null;
    }

    if (draggedCard) {
        draggedCard = null; // Release the card after dragging
    }
}

//p5 method: called on keyboard key pressed
function keyPressed() {
    if (keyCode === 68) { // if "d" is pressed toggle the debug mode
        debugOn = !debugOn;
    }
}

//returns true if the mouse is hovering over a card
function mouseOverVisibleCard() {
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].visible && cards[i].mouseOver()) {
            return true;
        }
    }
    return false;
}

function getTopCardID() {
    var mOverCIDs = [];

    for (var i = 0; i < cards.length; i++) {
        if (cards[i].mouseOver() && cards[i].visible) {
            mOverCIDs.push(i);
        }
    }

    return mOverCIDs[mOverCIDs.length - 1];
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

function createMenu() {
    var myFooterLeft = createDiv("").style("float:left; text-align:left").parent("myFooter");
    var myColorChanger = createDiv("").parent(myFooterLeft);

    var myStacks = createDiv("").parent(myFooterLeft);
    createSpan(" ").style("cursor:default;").parent(myStacks);

    sStack = createSelect().parent(myStacks);
    sStack.option("stacks");
    sStack.option("stack");
    sStack.option("chaos");
    sStack.changed(changeStack);

    createSpan(" / ").style("cursor:default;").parent(myStacks);

    var sShuffle = createSpan("shuffle").style("cursor:pointer;").parent(myStacks);
    sShuffle.mousePressed(shuffleCards);
}

function toggleRows() {
    for (var i = 0; i < mCheckboxRows.length; i++) {
        for (var ii = 0; ii < rowsAndColumns[i].length; ii++) {
            if (mCheckboxRows[i].checked() == true) {
                mCheckbox[rowsAndColumns[i][ii]].checked(true);
            } else {
                mCheckbox[rowsAndColumns[i][ii]].checked(false);
            }
        }
    }
    toggleType();
}

function toggleType() {
    for (var i = 0; i < cards.length; i++) {
        cards[i].visible = true;
    }
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].visible != mCheckbox[cards[i].cID].checked()) {
            cards[i].visible = !cards[i].visible;
        } else {
            var canStayVisible = false;
            for (var i2 = 0; i2 < cards[i].cTags.length; i2++) {
                if (mCheckbox[cards[i].cTags[i2]].checked() == true) {
                    canStayVisible = true;
                }
            }
            cards[i].visible = canStayVisible;
        }
    }
}

function changeStack() {
    var stackType = sStack.value();
    if (stackType == "stack") {
        stackT = 0;
    }
    if (stackType == "stacks") {
        stackT = 1;
    }
    if (stackType == "chaos") {
        stackT = 2;
    }
    shuffleCards();
}

function changeColor() {
    var colorS = colorSelect.value();
    if (colorS == "r") {
        lineC = color(255, 0, 0);
    }
    if (colorS == "g") {
        lineC = color(0, 255, 0);
    }
    if (colorS == "b") {
        lineC = color(0, 0, 255);
    }
}

// ============================
// https://www.kirupa.com/html5/shuffling_array_js.htm

Array.prototype.shuffle = function () {
    var input = this;

    for (var i = input.length - 1; i >= 0; i--) {
        var randomIndex = Math.floor(Math.random() * (i + 1));
        var itemAtIndex = input[randomIndex];

        input[randomIndex] = input[i];
        input[i] = itemAtIndex;
    }
    return input;
}

// ============================
// https://stackoverflow.com/questions/2440700/reordering-arrays

Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};