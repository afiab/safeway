let mapImage;
let walkableColors = [];
let waypoints = [];
let mode = 'selectColors'; // Start in select colors mode
let finishedSelectingWaypoints = false; // Track if the user has finished selecting waypoints

function setup() {
    createCanvas(windowWidth, windowHeight);
    const input = select('#imageUpload');
    input.changed(loadMapImage);

    const toggleButton = select('#toggleWalkableMode');
    toggleButton.mousePressed(toggleMode);
}

function loadMapImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Reset everything when a new image is uploaded
        resetSelection(); // Clear previous selections
        const url = URL.createObjectURL(file);
        
        loadImage(url, (img) => {
            mapImage = img;
            resizeCanvas(mapImage.width, mapImage.height);
            image(mapImage, 0, 0); // Draw the image after loading

            // Enable the button after the image is successfully loaded
            const toggleButton = select('#toggleWalkableMode');
            toggleButton.attribute('enabled', true); // Enable the button
        }, (err) => {
            console.error("Error loading image:", err);
        });
    }
}

function draw() {
    background(255); // Clear the canvas with a white background
    if (mapImage) {
        image(mapImage, 0, 0); // Draw the uploaded map image
    }
    drawWaypoints(); // Draw waypoints if any
    if (finishedSelectingWaypoints) {
        drawPaths(); // Draw paths only if finished selecting waypoints
    }
}

function mousePressed() {
    if (mapImage && mouseX < width && mouseY < height) {
        const toggleButton = select('#toggleWalkableMode');

        // Check if the mouse click is within the button area
        const buttonX = toggleButton.position().x;
        const buttonY = toggleButton.position().y;
        const buttonWidth = toggleButton.size().width;
        const buttonHeight = toggleButton.size().height;

        // If the click is inside the button, return early
        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && 
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            return; // Don't register this click
        }

        const selectedColor = get(mouseX, mouseY);
        if (mode === 'selectColors') {
            toggleColorInWalkable(selectedColor);
        } else if (mode === 'selectPlaces' && !finishedSelectingWaypoints) {
            // Only allow adding waypoints if in select places mode
            if (mouseX>=0 && mouseY>=0){
                waypoints.push(createVector(mouseX, mouseY));
            }
        }
    }
}

function toggleMode() {
    const toggleButton = select('#toggleWalkableMode');
    
    if (mode === 'selectColors') {
        mode = 'selectPlaces'; // Switch to selecting places
        toggleButton.html("Show Paths"); // Update button text to "Show Places"
    } else if (mode === 'selectPlaces') {
        finishedSelectingWaypoints = true; // Finish selecting waypoints
        toggleButton.html("Show Paths"); // Update button text to "Show Paths"
    }
}

function toggleColorInWalkable(selectedColor) {
    const colorHex = color(selectedColor).toString();
    const colorIndex = walkableColors.findIndex((c) => c.toString() === colorHex);

    if (colorIndex === -1) {
        walkableColors.push(color(selectedColor)); // Add color if not already present
    } else {
        walkableColors.splice(colorIndex, 1); // Remove color if it's already in the list
    }
    displayColors(); // Update color display
}

function displayColors() {
    const colorList = select('#colorList');
    colorList.html('Walkable Colors: '); // Clear previous list
    walkableColors.forEach((c) => {
        colorList.html(
            colorList.html() + `<span style="background-color: ${c}; padding: 5px; margin: 2px; border-radius: 5px; display: inline-block;"></span>`
        );
    });
}

function drawWaypoints() {
    for (let point of waypoints) {
        fill(255, 0, 0);
        noStroke();
        ellipse(point.x, point.y, 10, 10); // Draw waypoints as red circles
    }
}

function drawPaths() {
    if (waypoints.length < 2) return; // Need at least two waypoints to draw a path
    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        stroke(0, 0, 255); // Set path color
        strokeWeight(2);
        line(start.x, start.y, end.x, end.y); // Draw lines between waypoints
    }
    
    // Connect the last point back to the first point
    const firstPoint = waypoints[0];
    const lastPoint = waypoints[waypoints.length - 1];
    line(lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y); // Draw line to connect to the first waypoint
}

function resetSelection() {
    walkableColors = []; // Clear walkable colors
    waypoints = []; // Clear waypoints
    finishedSelectingWaypoints = false; // Reset waypoint selection state
    mode = 'selectColors'; // Reset mode to selectColors
    select('#toggleWalkableMode').html("Select Places"); // Reset button text
    select('#colorList').html('Walkable Colors: '); // Clear displayed colors
}
