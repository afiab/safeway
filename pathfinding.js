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

// Function to generate paths (for simplicity, using straight lines)
function generatePaths() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw each place to visit
    placesToVisit.forEach(place => drawPlaceMarker(place.x, place.y));

    // Draw paths between consecutive places and connect the last to the first
    placesToVisit.forEach((place, index) => {
        const scaleX = canvas.width / image.width;
        const scaleY = canvas.height / image.height;
        
        // Draw path to the next place
        if (index < placesToVisit.length - 1) {
            ctx.beginPath();
            ctx.moveTo(place.x * scaleX, place.y * scaleY);
            ctx.lineTo(placesToVisit[index + 1].x * scaleX, placesToVisit[index + 1].y * scaleY);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    // Connect last place to the first to complete the loop
    if (placesToVisit.length > 1) {
        ctx.beginPath();
        const firstPlace = placesToVisit[0];
        const lastPlace = placesToVisit[placesToVisit.length - 1];
        ctx.moveTo(lastPlace.x * (canvas.width / image.width), lastPlace.y * (canvas.height / image.height));
        ctx.lineTo(firstPlace.x * (canvas.width / image.width), firstPlace.y * (canvas.height / image.height));
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
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

// Function to draw a marker at each place to visit
function drawPlaceMarker(x, y) {
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    ctx.fillStyle = 'blue'; // Marker color
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 5, 0, Math.PI * 2); // Circle marker with radius 5
    ctx.fill();
}