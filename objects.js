class Card {
    constructor(_cType = "link", _cID = 0, _cTitle = "Untitled", _filename = "defaultFilename", _cText = "", _cLinks = [], _cTags = []) {
        this.cType = _cType;
        this.cID = _cID;
        this.cTitle = _cTitle;
        this.filename = _filename;
        this.cText = _cText;
        this.cTags = _cTags;
        this.cLinks = Array.isArray(_cLinks) ? _cLinks : []; // Ensure cLinks is always an array

        // Ensure the card category exists before trying to access its properties
        if (cardCategories[this.cID]) {
            let category = cardCategories[this.cID];
            this.cColor = color(`#${category.tColor}`);
            this.onlyBorder = category.onlyBorder;
            this.cRow = category.tRow;
        } else {
            console.error(`Invalid category ID (${this.cID}) for card:`, this);
            this.cColor = color(100); // Set a default color if category doesn't exist
            this.onlyBorder = false;
            this.cRow = 0;
        }

        this.cWidth = 160;
        this.cHeight = 160;
        this.textBorder = 10;
        this.textSize = 14;
        this.visible = true;
        this.bColor = color(50);
        this.shuffleSpiel = 5;
        this.rotationSpiel = 0.05;
        this.mOverAndTopCard = false;
        this.isLarge = false;

        this.xPos = 0;
        this.yPos = 0;
        this.rotation = 0;

        this.xVel = 0;
        this.yVel = 0;
    }

    // Draws the card with rotation and translation
    draw() {
        if (this.visible) {
            push();
            translate(this.xPos, this.yPos);
            rotate(this.rotation);
            
            if (this.cType === "display") {
                // For display cards: black fill with colored border
                fill(0); // Set card fill to black
                stroke(this.cColor); // Set border color to card color
                strokeWeight(3);
            } else {
                // For other cards: colored fill with no border
                fill(this.cColor); // Set card fill to card color
                noStroke();
            }
            rect(0, 0, this.cWidth, this.cHeight);
            pop();
        }
    }

    // Checks if the mouse is over the card
    mouseOver() {
        return (
            mouseX > this.xPos - this.cWidth / 2 && mouseX < this.xPos + this.cWidth / 2 &&
            mouseY > this.yPos - this.cHeight / 2 && mouseY < this.yPos + this.cHeight / 2
        );
    }

    // Moves the card by a small random amount
    newPos(_xp, _yp) {
        this.xPos = _xp + random(-this.shuffleSpiel, this.shuffleSpiel);
        this.yPos = _yp + random(-this.shuffleSpiel, this.shuffleSpiel);
    }

    // Rotates the card by a small random amount
    newRotation() {
        this.rotation = random(-this.rotationSpiel, this.rotationSpiel);
    }

    // Displays the card with text and possible link placeholders
    display() {
        if (this.visible) {
            push();
            translate(this.xPos, this.yPos);
            rotate(this.rotation);

            textAlign(CENTER, CENTER);
            strokeWeight(1);

            if (this.cType === "display") {
                // For display cards: black fill with colored border
                stroke(this.cColor); // Set border color to card color
                fill(0); // Set card fill to black
            } else {
                // For other cards: colored fill with no border
                noStroke();
                fill(this.cColor);
            }
            rect(0, 0, this.cWidth, this.cHeight, 5);

            // Draw card content based on type
            if (this.cType === "link") {
                noStroke();
                fill(200);
                textSize(this.textSize);

                if (this.isLarge) {
                    this.cTitle = this.cTitle.replace("/", " ");
                    textSize(this.textSize * 1.5);
                    text(this.cTitle, 0, -this.cHeight / 2 + 150, this.cWidth, this.cHeight - this.textBorder * 2);
                    textSize(this.textSize * 0.8);
                    text(this.cText, 0, -this.cHeight / 2 + 250, this.cWidth * 0.6, this.cHeight - this.textBorder * 2);

                    // Draw link placeholders only if there are links
                    if (this.cLinks.length > 0) {
                        let totalWidth = 0;
                        const placeholders = [];
                        for (let i = 0; i < this.cLinks.length; i++) {
                            const linkText = `(${i + 1})`;
                            placeholders.push(linkText);
                            totalWidth += textWidth(linkText) + 10;
                        }
                        totalWidth -= 10;

                        this.linkBounds = [];

                        // Draw placeholders and check for hover
                        let xOffset = -totalWidth / 2;
                        for (let i = 0; i < placeholders.length; i++) {
                            let placeholderWidth = textWidth(placeholders[i]);
                            let leftBound = this.xPos + xOffset - placeholderWidth / 2;
                            let rightBound = this.xPos + xOffset + placeholderWidth / 2;
                            let topBound = this.yPos - this.cHeight / 2 + 350 - this.textSize / 2;
                            let bottomBound = this.yPos - this.cHeight / 2 + 350 + this.textSize / 2;

                            this.linkBounds.push({
                                left: leftBound,
                                right: rightBound,
                                top: topBound,
                                bottom: bottomBound,
                                linkIndex: i
                            });

                            // Highlight link if mouse is over
                            if (mouseX > leftBound && mouseX < rightBound && mouseY > topBound && mouseY < bottomBound) {
                                textStyle(BOLD);
                                text(placeholders[i], xOffset, -this.cHeight / 2 + 350);
                                stroke(200);
                                strokeWeight(3);
                                const underlineY = -this.cHeight / 2 + 355;
                                line(xOffset - placeholderWidth / 2, underlineY, xOffset + placeholderWidth / 2, underlineY);
                            } else {
                                strokeWeight(0);
                                textStyle(NORMAL);
                                text(placeholders[i], xOffset, -this.cHeight / 2 + 350);
                            }

                            xOffset += placeholderWidth + 10;
                        }
                    }
                } else {
                    const splitTitle = this.cTitle.split("/");
                    for (let i = 0; i < splitTitle.length; i++) {
                        text(splitTitle[i], 0, -10 + i * 16, this.cWidth - this.textBorder * 2, this.cHeight - this.textBorder * 2);
                    }
                }
            }

            if (this.cType === "display") {
                let circleDiameter = 20; 
                noStroke();
                fill(200);
                strokeWeight(0);
                if (this.isLarge) {
                    circleDiameter = 60;
                    textSize(this.textSize * 1.4) 
                }else if(this.cText.length > 75){
                    textSize(this.textSize * 0.7);
                }else{
                    textSize(this.textSize);
                }

                text(this.cText, 0, -this.cHeight / 2 / 10 * 2, this.cWidth * 0.6, this.cHeight - this.textBorder * 2);
            
                this.cRefColors = [];
            
                this.cTags.forEach((tag, index) => {
                    let category = cardCategories[tag];
                    this.cRefColors[index] = color(`#${category.tColor}`);
                });
                            
                const totalWidth = this.cRefColors.length * circleDiameter + (this.cRefColors.length - 1) * 10; 
                let startX = -totalWidth / 2 + circleDiameter / 2; 
            
                for (let i = 0; i < this.cRefColors.length; i++) {
                    fill(this.cRefColors[i]);
                    noStroke();
                    ellipse(startX + i * (circleDiameter + 10), this.cHeight / 4, circleDiameter, circleDiameter);
                }
            }
            pop();
        }
    }

    // Updates the card physics and handles wall collisions
    update() {
        if (Math.abs(this.xVel) > 0.05) {
            this.xPos += this.xVel;
            this.xVel *= dragMult;
        }

        if (Math.abs(this.yVel) > 0.05) {
            this.yPos += this.yVel;
            this.yVel *= dragMult;
        }

        // Bounce off walls
        if (this.xPos < this.cWidth / 2) {
            this.xPos = this.cWidth / 2;
            this.xVel = Math.abs(this.xVel);
        }

        if (this.xPos > windowWidth - this.cWidth / 2) {
            this.xPos = windowWidth - this.cWidth / 2;
            this.xVel = -Math.abs(this.xVel);
        }

        if (this.yPos < this.cHeight / 2) {
            this.yPos = this.cHeight / 2;
            this.yVel = Math.abs(this.yVel);
        }

        if (this.yPos > windowHeight - this.cHeight / 2) {
            this.yPos = windowHeight - this.cHeight / 2;
            this.yVel = -Math.abs(this.yVel);
        }
    }

    // Sets momentum of the card
    setMomentum(xM, yM) {
        this.xVel = xM;
        this.yVel = yM;
    }
}

function cardCategory(_tTitle, _tColor, _onlyBorder, _tRow) {
    this.tTitle = _tTitle;
    this.tColor = _tColor;
    this.tRow = _tRow;
    this.onlyBorder = _onlyBorder;
    this.points = [];
}

function backLine(_x, _y, _c) {
    this.points = [];
    this.points[0] = createVector(_x, _y);
    this.c = _c;

    // Adds a new segment to the backline
    this.newSegment = function (_xp, _yp) {
        this.points[this.points.length] = createVector(_xp, _yp);
    }

    // Draws the backline
    this.draw = function () {
        stroke(this.c);
        noFill();
        strokeWeight(3);
        beginShape();
        for (var i = 0; i < this.points.length; i++) {
            curveVertex(this.points[i].x, this.points[i].y);
        }
        endShape();
    }
}
