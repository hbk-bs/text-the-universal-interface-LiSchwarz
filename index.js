const container = document.getElementById('canvas-container');
const bgCanvas = document.getElementById('backgroundCanvas');
const drawCanvas = document.getElementById('drawingCanvas');
const bgCtx = bgCanvas.getContext('2d');
const ctx = drawCanvas.getContext('2d');

// Array of background images
const backgroundImages = [
    "bilder/95DA8118-E357-432A-A419-F6D9B3DDEF64_1_201_a.jpeg",
    "bilder/2A4CACD2-09FC-4A07-A989-69452F9E99B0_1_201_a.jpeg",
    "bilder/EB8043D9-5DAA-4A50-AFFD-71EAF5B03E44_1_201_a.jpeg",
    "bilder/F7978021-72C4-43C1-AE3B-396A198C257B_1_201_a.jpeg",
    "bilder/EC4BF5DB-C483-4726-9BB9-312AD672E937_1_201_a.jpeg",
    "bilder/99132FB9-E2B0-4E6E-A805-56C5028C7C0A_1_201_a.jpeg",
    "bilder/0312652B-86D7-4E77-AA35-5D26EBB76212_1_201_a.jpeg"
];

let currentImageIndex = Math.floor(Math.random() * backgroundImages.length);
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Initialize canvases and load background
function init() {
    const width = 800;
    const height = 600;
    
    bgCanvas.width = width;
    bgCanvas.height = height;
    drawCanvas.width = width;
    drawCanvas.height = height;
    
    loadBackgroundImage();
}

function loadBackgroundImage() {
    const img = new Image();
    img.onload = function() {
        // Berechne das richtige Seitenverhältnis
        const ratio = Math.min(
            bgCanvas.width / img.width,
            bgCanvas.height / img.height
        );
        
        // Berechne neue Dimensionen
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        
        // Zentriere das Bild
        const x = (bgCanvas.width - newWidth) / 2;
        const y = (bgCanvas.height - newHeight) / 2;
        
        // Lösche vorheriges Bild
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        // Zeichne neues Bild mit korrektem Seitenverhältnis
        bgCtx.drawImage(img, x, y, newWidth, newHeight);
    }
    img.src = backgroundImages[currentImageIndex];
}

function nextBackground() {
    // Save the old index
    const oldIndex = currentImageIndex;
    
    // Keep generating new random index until it's different from the old one
    do {
        currentImageIndex = Math.floor(Math.random() * backgroundImages.length);
    } while (currentImageIndex === oldIndex);
    
    // Reset response text
    document.getElementById('response').textContent = 'Setze deine Unterschrift auf das Dokument';
    
    // Clear drawing canvas
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    
    // Load new background
    loadBackgroundImage();
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

// Event listeners
window.addEventListener('load', init);
drawCanvas.addEventListener('mousedown', startDrawing);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDrawing);
drawCanvas.addEventListener('mouseout', stopDrawing);

// Startseite ausblenden wenn Button geklickt wird
document.getElementById('start-button').addEventListener('click', function() {
    document.getElementById('intro-overlay').style.display = 'none';
    document.getElementById('control-buttons').style.display = 'block';
});

// API endpoint
const apiEndpoint = 'https://lindas-openai-api-images.val.run/';

window.clearDrawing = function() {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    document.getElementById('response').textContent = 'Setze deine Unterschrift auf das Dokument';
}

window.saveCanvas = async function() {
    // Show loading spinner and update text
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('response').textContent = 'Unterschrift wird überprüft...';

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = drawCanvas.width;
    finalCanvas.height = drawCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');
    
    finalCtx.drawImage(bgCanvas, 0, 0);
    finalCtx.drawImage(drawCanvas, 0, 0);
    
    const imageDataUrl = finalCanvas.toDataURL('image/jpeg');
    
    const data = {
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: 'Informiere den Nutzer zuerst auf sehr lustige, humorvolle und kreative Weise über den Inhalt von dem Hintergrundbild. Warne den Nutzer auch davor, wenn etwas wichtiges beachtet werden muss. Der Nutzer wird darauf unterschreiben, jeder Strich wird als Unterschrift gewertet. Versuche die Unterschrift zu lesen und bewerte sie anhand der Lesbarkeit. Wenn die Unterschrift lesbar ist, reagiere überschwänglich positiv und freu dich. Wenn die Unterschrift nicht lesbar ist, sei gemein, traurig, enttäuscht und frustriert und fordere den Nutzer auf, es besser zu machen. Antworte auf Deutsch in mindestens 4 Sätzen und ohne Emojis. Du musst am Ende auf jeden Fall entscheiden, ob die Schrift leserlich ist und ob der Nutzer noch einmal unterschreiben soll. Beschreibe, was du siehst in einem JSON-Format {result: string}',
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageDataUrl,
                        },
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        const { content } = result.completion.choices[0].message;
        const json = JSON.parse(content);
        
        document.getElementById('response').textContent = json.result;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response').textContent = 'Ein Fehler ist aufgetreten.';
    } finally {
        // Hide loading spinner in all cases
        document.getElementById('loading-spinner').classList.add('hidden');
    }
};