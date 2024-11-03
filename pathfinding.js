const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const walkableColorDisplay = document.getElementById('walkableColorDisplay');

let image = new Image();
let walkableColors = [];
let placesToVisit = [];
let selectingWalkable = true;
let walkableMap = [];

// Off-screen canvas for accurate color picking
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// Load the selected image
imageLoader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        image.src = e.target.result;
    };

    reader.readAsDataURL(file);
});

// Draw the image once loaded
image.onload = function() {
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;

    const widthRatio = maxWidth / image.width;
    const heightRatio = maxHeight / image.height;
    const scale = Math.min(widthRatio, heightRatio, 1);

    // Set the canvas size based on the scaled dimensions
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    // Draw the image on the visible canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw the image at its original size on the off-screen canvas
    offscreenCanvas.width = image.width;
    offscreenCanvas.height = image.height;
    offscreenCtx.drawImage(image, 0, 0);

    // Initialize walkable map
    walkableMap = Array.from({ length: image.height }, () => Array(image.width).fill(0));
}

// Correct scaling calculation for x and y coordinates
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / canvas.width; // Horizontal scale factor
    const scaleY = image.height / canvas.height; // Vertical scale factor

    // Adjust click coordinates to match original image dimensions
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    if (selectingWalkable) {
        // Use off-screen canvas to accurately get pixel color
        const pixelData = offscreenCtx.getImageData(x, y, 1, 1).data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;

        if (!walkableColors.includes(color)) {
            walkableColors.push(color);
            updateWalkableColorDisplay(color);
            updateWalkableMap();
            console.log(`Selected walkable color: ${color}`);
        } else {
            console.log(`Color ${color} is already walkable.`);
        }
    } else {
        placesToVisit.push({ x, y });
        drawPlaceMarker(x, y); // Pass original coordinates, scaling will be handled in drawPlaceMarker
        console.log(`Added place to visit at (${x}, ${y}).`);
    }
});

// Function to draw a marker at each place to visit with correct scaling
function drawPlaceMarker(x, y) {
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 5, 0, Math.PI * 2, true); // Scale coordinates for drawing
    ctx.fill();
}


// Toggle selection mode
const toggleButton = document.createElement('button');
toggleButton.innerText = 'Finish Selecting Walkable Colors';
toggleButton.addEventListener('click', () => {
    selectingWalkable = !selectingWalkable;
    toggleButton.innerText = selectingWalkable ? 'Finish Selecting Walkable Colors' : 'Select Places to Visit';
});
document.body.appendChild(toggleButton);

function generatePaths() {
    // Clear the canvas and redraw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Re-draw each place marker with the correct scaling
    placesToVisit.forEach(place => {
        // Apply scaling when drawing each place marker
        drawPlaceMarker(place.x, place.y);
    });

    // Draw paths between places to visit
    for (let i = 0; i < placesToVisit.length - 1; i++) {
        const start = placesToVisit[i];
        const end = placesToVisit[i + 1];
        const path = findPathBFS(start, end);
        if (path) {
            drawPath(path);
        }
    }
}

// Adjusted drawPath function to apply correct scaling
function drawPath(path) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    // Scale the starting point of the path
    ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);

    // Scale each point in the path as it is drawn
    for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x * scaleX, path[j].y * scaleY);
    }

    ctx.stroke();
}


// BFS for pathfinding
function findPathBFS(start, end) {
    const queue = [[start.x, start.y]];
    const visited = Array.from({ length: image.height }, () => Array(image.width).fill(false));
    const parent = {};
    visited[start.y][start.x] = true;

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        if (x === end.x && y === end.y) {
            const path = [];
            let cur = `${end.x},${end.y}`;
            while (cur) {
                const [px, py] = cur.split(',').map(Number);
                path.unshift({ x: px, y: py });
                cur = parent[cur];
            }
            return path;
        }

        for (const { dx, dy } of [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ]) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && ny >= 0 && nx < image.width && ny < image.height && !visited[ny][nx] && walkableMap[ny][nx] === 1) {
                queue.push([nx, ny]);
                visited[ny][nx] = true;
                parent[`${nx},${ny}`] = `${x},${y}`;
            }
        }
    }
    return null;
}

// Function to update the walkable map based on selected colors
function updateWalkableMap() {
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const pixelData = offscreenCtx.getImageData(x, y, 1, 1).data;
            const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;

            if (isColorSimilar(color)) {
                walkableMap[y][x] = 1;
            } else {
                walkableMap[y][x] = 0;
            }
        }
    }
}

// Check if a color is similar to any selected walkable color
function isColorSimilar(color) {
    const rgba = color.match(/\d+/g).map(Number);
    return walkableColors.some(walkableColor => {
        const walkableRGBA = walkableColor.match(/\d+/g).map(Number);
        return colorDistance(rgba, walkableRGBA) < 15;
    });
}

// Calculate the Euclidean distance between two colors
function colorDistance(color1, color2) {
    return Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
}

// Function to update the walkable color display
function updateWalkableColorDisplay(color) {
    const colorBox = document.createElement('div');
    colorBox.style.display = 'inline-block';
    colorBox.style.width = '20px';
    colorBox.style.height = '20px';
    colorBox.style.backgroundColor = color;
    colorBox.style.marginRight = '5px';

    const colorLabel = document.createElement('span');
    colorLabel.innerText = color;

    const colorContainer = document.createElement('div');
    colorContainer.style.display = 'inline-flex';
    colorContainer.style.alignItems = 'center';
    colorContainer.style.margin = '5px';
    
    colorContainer.appendChild(colorBox);
    colorContainer.appendChild(colorLabel);
    walkableColorDisplay.appendChild(colorContainer);
}

// Function to draw a marker at each place to visit
function drawPlaceMarker(x, y) {
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 5, 0, Math.PI * 2, true);
    ctx.fill();
}

// Add a button to generate paths
const generatePathButton = document.createElement('button');
generatePathButton.innerText = 'Generate Paths';
generatePathButton.addEventListener('click', generatePaths);
document.body.appendChild(generatePathButton);
