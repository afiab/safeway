const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const walkableColorDisplay = document.createElement('div'); // Display for walkable colors
document.body.appendChild(walkableColorDisplay);

let image = new Image();
let walkableColors = [];
let placesToVisit = [];
let selectingWalkable = true; // Flag to toggle between selecting colors and places

// Load the selected image
imageLoader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        image.src = e.target.result;
    }
    
    reader.readAsDataURL(file);
});

// Draw the image once loaded
image.onload = function() {
    const scale = window.innerWidth / image.width;
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

// Click event to select walkable colors
canvas.addEventListener('click', (event) => {
    if (selectingWalkable) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / (canvas.width / image.width));
        const y = Math.floor((event.clientY - rect.top) / (canvas.height / image.height));

        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3]})`;

        // Check if the color is already marked as walkable
        if (!walkableColors.includes(color)) {
            walkableColors.push(color);
            updateWalkableColorDisplay(color); // Update the display
            console.log(`Selected walkable color: ${color}`);
        } else {
            console.log(`Color ${color} is already walkable.`);
        }
    } else {
        // Select places to visit
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / (canvas.width / image.width));
        const y = Math.floor((event.clientY - rect.top) / (canvas.height / image.height));

        placesToVisit.push({ x, y });
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

// Function to generate paths (for simplicity, using straight lines)
function generatePaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw walkable areas (you can implement more sophisticated pathfinding here)
    placesToVisit.forEach((place, index) => {
        if (index > 0) {
            ctx.beginPath();
            ctx.moveTo(placesToVisit[index - 1].x * (canvas.width / image.width), placesToVisit[index - 1].y * (canvas.height / image.height));
            ctx.lineTo(place.x * (canvas.width / image.width), place.y * (canvas.height / image.height));
            ctx.strokeStyle = 'red'; // Path color
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });
}

// Button to trigger path generation
const generateButton = document.createElement('button');
generateButton.innerText = 'Generate Paths';
generateButton.addEventListener('click', generatePaths);
document.body.appendChild(generateButton);

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
