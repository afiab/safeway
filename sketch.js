let mapImage;
let walkableColors = [];
let waypoints = [];
let mode = 'selectColors'; // Start in select colors mode
let finishedSelectingWaypoints = false; // Track if the user has finished selecting waypoints
let currentPathSegment = 0; // Keep track of the current path segment being drawn
let paths = []; // Store all calculated paths

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
            if (mouseX >= 0 && mouseY >= 0) {
                waypoints.push(createVector(mouseX, mouseY));
            }
        }
    }
}

function toggleMode() {
    const toggleButton = select('#toggleWalkableMode');
    
    if (mode === 'selectColors') {
        mode = 'selectPlaces'; // Switch to selecting places
        toggleButton.html("Show Paths"); // Update button text to "Show Paths"
    } else if (mode === 'selectPlaces') {
        finishedSelectingWaypoints = true; // Finish selecting waypoints
        toggleButton.html("Show Paths"); // Update button text to "Show Paths"
        
        // Calculate paths immediately upon finishing selection
        const grid = createGrid(); // Create the grid based on the walkable colors
        paths = [];
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];
            const path = bfs(start, end, grid);
            paths.push(path);
        }
        currentPathSegment = 0; // Reset path segment index to start drawing from the beginning
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
    stroke(0, 0, 255); // Set path color
    strokeWeight(2);

    // Draw the paths up to the current segment
    for (let i = 0; i < currentPathSegment; i++) {
        const path = paths[i];
        if (path.length > 0) { // Only draw if a path is found
            for (let j = 0; j < path.length - 1; j++) {
                line(path[j].x, path[j].y, path[j + 1].x, path[j + 1].y);
            }
        }
    }

    // Increment the path segment every frame to reveal the next one
    if (currentPathSegment < paths.length) {
        currentPathSegment++;
    }
    
    // Optional: Connect the last waypoint back to the first one
    if (waypoints.length > 2 && currentPathSegment === paths.length) {
        const firstPoint = waypoints[0];
        const lastPoint = waypoints[waypoints.length - 1];
        line(lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y); // Draw line to connect to the first waypoint
    }
}

function createGrid() {
    const cols = Math.floor(mapImage.width);
    const rows = Math.floor(mapImage.height);
    const grid = new Array(rows);

    for (let y = 0; y < rows; y++) {
        grid[y] = new Array(cols);
        for (let x = 0; x < cols; x++) {
            const pixelColor = get(x, y);
            // Check if this color is close enough to any color in the walkableColors array
            grid[y][x] = walkableColors.some((c) => {
                return isColorClose(pixelColor, c);
            });
        }
    }

    return grid;
}

function isColorClose(color1, color2, threshold = 50) {
    const r1 = red(color1);
    const g1 = green(color1);
    const b1 = blue(color1);
    
    const r2 = red(color2);
    const g2 = green(color2);
    const b2 = blue(color2);
    
    // Calculate the Euclidean distance between the two colors
    const distance_rg = dist(r1, g1, r2, g2);
    const distance_gb = dist(g1, b1, g2, b2);
    const distance_br = dist(b1, r1, b2, r2);

    return distance_rg < threshold || distance_gb < threshold || distance_br < threshold; 
    // Return true if the distance is within the threshold
}

function bfs(start, end, grid) {
    const queue = [];
    const visited = new Set();
    const cameFrom = new Map();

    queue.push(start);
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(cameFrom, current);
        }

        const neighbors = getNeighbors(current, grid);
        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(neighbor);
                cameFrom.set(key, current);
            }
        }
    }
    return []; // Return an empty path if no path is found
}

function getNeighbors(node, grid) {
    const neighbors = [];
    const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    for (const dir of directions) {
        const newX = node.x + dir.x;
        const newY = node.y + dir.y;
        if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length && grid[newY][newX]) {
            neighbors.push(createVector(newX, newY));
        }
    }

    return neighbors;
}

function reconstructPath(cameFrom, current) {
    const path = [];
    while (current) {
        path.push(current);
        current = cameFrom.get(`${current.x},${current.y}`);
    }
    return path.reverse(); // Return the path from start to end
}

function resetSelection() {
    waypoints = []; // Clear previous waypoints
    walkableColors = []; // Clear previous walkable colors
    finishedSelectingWaypoints = false; // Reset the selection status
    currentPathSegment = 0; // Reset the current path segment
    paths = []; // Clear previous paths
}
