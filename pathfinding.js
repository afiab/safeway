const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const walkableColorDisplay = document.getElementById('walkableColorDisplay');

let image = new Image();
let walkableColors = [];
let placesToVisit = [];
let selectingWalkable = true; // Flag to toggle between selecting colors and places
let walkableMap = []; // Array to store walkable vs non-walkable pixels

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
    const scale = window.innerWidth / image.width;
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    // Initialize walkable map
    walkableMap = Array.from({ length: canvas.height }, () => Array(canvas.width).fill(0));
}

// Click event to select walkable colors or places to visit
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / (canvas.width / image.width));
    const y = Math.floor((event.clientY - rect.top) / (canvas.height / image.height));

    if (selectingWalkable) {
        // Select walkable colors
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;

        if (!walkableColors.includes(color)) {
            walkableColors.push(color);
            updateWalkableColorDisplay(color); // Update the display
            updateWalkableMap();
            console.log(`Selected walkable color: ${color}`);
        } else {
            console.log(`Color ${color} is already walkable.`);
        }
    } else {
        // Select places to visit
        placesToVisit.push({ x, y });
        drawPlaceMarker(x, y);
        console.log(`Added place to visit at (${x}, ${y}).`);
    }
});

// Toggle selection mode
const toggleButton = document.createElement('button');
toggleButton.innerText = 'Finish Selecting Walkable Colors';
toggleButton.addEventListener('click', () => {
    selectingWalkable = !selectingWalkable;
    toggleButton.innerText = selectingWalkable ? 'Finish Selecting Walkable Colors' : 'Select Places to Visit';
});
document.body.appendChild(toggleButton);

// Generate paths using BFS
function generatePaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw each place to visit
    placesToVisit.forEach(place => drawPlaceMarker(place.x, place.y));

    for (let i = 0; i < placesToVisit.length - 1; i++) {
        const start = placesToVisit[i];
        const end = placesToVisit[i + 1];
        const path = findPathBFS(start, end);
        if (path) {
            drawPath(path);
        }
    }
}

// BFS for pathfinding
function findPathBFS(start, end) {
    const queue = [[start.x, start.y]];
    const visited = Array.from({ length: canvas.height }, () => Array(canvas.width).fill(false));
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

            if (nx >= 0 && ny >= 0 && nx < canvas.width && ny < canvas.height && !visited[ny][nx] && walkableMap[ny][nx] === 1) {
                queue.push([nx, ny]);
                visited[ny][nx] = true;
                parent[`${nx},${ny}`] = `${x},${y}`;
            }
        }
    }
    return null; // No path found
}

// Draw the path on the canvas
function drawPath(path) {
    ctx.strokeStyle = 'red'; // Path color
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(path[0].x * (canvas.width / image.width), path[0].y * (canvas.height / image.height));

    for (let j = 1; j < path.length; j++) {
        ctx.lineTo(path[j].x * (canvas.width / image.width), path[j].y * (canvas.height / image.height));
    }

    ctx.stroke();
}

// Function to update the walkable map based on selected colors
function updateWalkableMap() {
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;

            if (isColorSimilar(color)) {
                walkableMap[y][x] = 1; // Mark as walkable
            } else {
                walkableMap[y][x] = 0; // Mark as non-walkable
            }
        }
    }
}

// Check if a color is similar to any selected walkable color
function isColorSimilar(color) {
    const rgba = color.match(/\d+/g).map(Number);
    return walkableColors.some(walkableColor => {
        const walkableRGBA = walkableColor.match(/\d+/g).map(Number);
        return colorDistance(rgba, walkableRGBA) < 50; // Threshold for color similarity
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
    ctx.fillStyle = 'blue'; // Marker color
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 5, 0, Math.PI * 2); // Circle marker with radius 5
    ctx.fill();
}

// Button to trigger path generation
const generateButton = document.createElement('button');
generateButton.innerText = 'Generate Paths';
generateButton.addEventListener('click', generatePaths);
document.body.appendChild(generateButton);
