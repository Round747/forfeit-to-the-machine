import { $ } from "./utils.js"

export let canDrawOnCanvas = false;

export function SetCanDrawOnCanvas(value)
{
    canDrawOnCanvas = value;
}

export const mainCanvas = $("c_main-canvas");
export const mainCtx = mainCanvas.getContext("2d");
mainCtx.webkitImageSmoothingEnabled = false;
mainCtx.mozImageSmoothingEnabled = false;
mainCtx.imageSmoothingEnabled = false;
const boom = new Audio("assets/sounds/boom.wav");
const brushSize = $("c_brush-size");
brushSize.addEventListener("change", ChangeBrushSizePreview);
const clearCanvas = $("c_clear-canvas");
clearCanvas.addEventListener("click", function() {if(canDrawOnCanvas) ClearCanvas();
    
boom.play();
});
const colourMenu = $("c_colour-menu");
for(let i = 0; i < colourMenu.children.length; i++) colourMenu.children[i].addEventListener("click" , function() {ChangeBrushColour(this.value)});

const increase = $("c_up-arrow");
const decrease = $("c_down-arrow");
increase.addEventListener("click", function() {brushSize.value ++; ChangeBrushSizePreview();});
decrease.addEventListener("click", function() {brushSize.value = Math.max(1, parseInt(brushSize.value) - 1); ChangeBrushSizePreview();});

window.addEventListener("mousedown", StartDrawing);
window.addEventListener("mouseup", EndDrawing);
window.addEventListener("mousemove", Draw);

// brushes

const brushPreview = $("c_brush-preview");

const brush = $("c_brush");
const fill = $("c_fill");
const line = $("c_line");

brush.addEventListener("click", function() {ChangeBrushType(BrushType.brush); brush.classList.add("highlighted");})
fill.addEventListener("click", function() {ChangeBrushType(BrushType.fill); fill.classList.add("highlighted");})
line.addEventListener("click", function() {ChangeBrushType(BrushType.line); line.classList.add("highlighted");})

// variables 

let isDrawing = false;

const BrushType = {
    brush: 0,
    fill: 1,
    line: 2
}

let currentBrush = BrushType.brush;

// canvas init
export const pixelScale = 6;
mainCanvas.width = 100 * pixelScale;
mainCanvas.height = 100 * pixelScale;

brushPreview.style.backgroundColor = "black";
ClearCanvas();

export function ClearCanvas()
{
    mainCtx.fillStyle = "white";
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    mainCtx.fillStyle = brushPreview.style.backgroundColor;
}

// fill variables

let canvasSnapshot;
let startX;
let startY;

function StartDrawing(event)
{
    if(!canDrawOnCanvas) return;
    isDrawing = true;

    let relativeX = event.pageX - mainCanvas.offsetLeft - 2;
    let relativeY = event.pageY - mainCanvas.offsetTop - 2;

    let pixelX = Math.floor(relativeX / pixelScale) * pixelScale;
    let pixelY = Math.floor(relativeY / pixelScale) * pixelScale;

    startX = pixelX;
    startY = pixelY;

    if(currentBrush == BrushType.fill || currentBrush == BrushType.line)
    {
        canvasSnapshot = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height); // snapshot of image   
    }

    if(event.buttons != 1) return;
    
    switch(currentBrush)
    {
        case BrushType.brush:

            if(brushSize.value != 1) // centre the fill area on the mouse (but prefer the top left centre)
            {
                pixelX -= (Math.floor(brushSize.value / 2) + (brushSize.value % 2 == 0 ? -1 : 0)) * pixelScale;
                pixelY -= (Math.floor(brushSize.value / 2) + (brushSize.value % 2 == 0 ? -1 : 0)) * pixelScale;
            }
            
            mainCtx.fillRect(pixelX, pixelY, brushSize.value * pixelScale, brushSize.value * pixelScale);

            break;
        case BrushType.fill:
            mainCtx.fillRect(pixelX, pixelY, pixelScale, pixelScale);
            break;
        case BrushType.line:
            mainCtx.fillRect(pixelX, pixelY, brushSize.value * pixelScale, brushSize.value * pixelScale);
            break;
    }
}

function Draw(event)
{
    if(!isDrawing || event.buttons != 1 || !canDrawOnCanvas) return;

    let relativeX = event.pageX - mainCanvas.offsetLeft - 2;
    let relativeY = event.pageY - mainCanvas.offsetTop - 2;

    let pixelX = Math.floor(relativeX / pixelScale) * pixelScale;
    let pixelY = Math.floor(relativeY / pixelScale) * pixelScale;

    switch(currentBrush)
    {
        case BrushType.brush:

            if(brushSize.value != 1) // centre the fill area on the mouse (but prefer the top left centre)
            {
                pixelX -= (Math.floor(brushSize.value / 2) + (brushSize.value % 2 == 0 ? -1 : 0)) * pixelScale;
                pixelY -= (Math.floor(brushSize.value / 2) + (brushSize.value % 2 == 0 ? -1 : 0)) * pixelScale;
            }
            
            mainCtx.fillRect(pixelX, pixelY, brushSize.value * pixelScale, brushSize.value * pixelScale);
            
            let distanceX = Math.max(startX, pixelX) - Math.min(startX, pixelX);
            let distanceY = Math.max(startY, pixelY) - Math.min(startY, pixelY);

            if((distanceX > brushSize.value * 1.5 || distanceY > brushSize.value * 1.5)) DrawLine(startX / pixelScale, startY / pixelScale, pixelX / pixelScale, pixelY / pixelScale);
            
            startX = pixelX;
            startY = pixelY;
            break;
        case BrushType.fill:

            mainCtx.putImageData(canvasSnapshot,0,0);
            
            let height = Math.max(pixelY, startY) - Math.min(pixelY, startY);
            let width = Math.max(pixelX, startX) - Math.min(pixelX, startX);

            mainCtx.fillRect(Math.min(pixelX, startX), Math.min(pixelY, startY), pixelScale, height);
            mainCtx.fillRect(Math.min(pixelX, startX), Math.min(pixelY, startY), width, pixelScale);
            mainCtx.fillRect(Math.min(pixelX, startX), Math.max(pixelY, startY), width, pixelScale);
            mainCtx.fillRect(Math.max(pixelX, startX), Math.min(pixelY, startY), pixelScale, height + pixelScale);
            
            break;
        case BrushType.line:

            mainCtx.putImageData(canvasSnapshot,0,0);
            DrawLine(startX / pixelScale, startY / pixelScale, pixelX / pixelScale, pixelY / pixelScale);
            break;
    }    
}

function EndDrawing(event)
{
    if(!canDrawOnCanvas) return;

    let relativeX = event.pageX - mainCanvas.offsetLeft - 2;
    let relativeY = event.pageY - mainCanvas.offsetTop - 2;

    let pixelX = Math.floor(relativeX / pixelScale) * pixelScale;
    let pixelY = Math.floor(relativeY / pixelScale) * pixelScale;

    if(currentBrush == BrushType.fill)
    {
        mainCtx.fillRect(startX, startY, (pixelX - startX), (pixelY - startY));
    }
    else if (currentBrush == BrushType.line)
    {
        DrawLine(startX / pixelScale, startY / pixelScale, pixelX / pixelScale, pixelY / pixelScale);
    }
    
    isDrawing = false;
}

function DrawLine(x1, y1, x2, y2)
{
    let m = (y2 - y1) / (x2 - x1);

    let c = y1 - m * x1;

    let totalWidth = Math.max(x1,x2) - Math.min(x1,x2);
    let totalHeight = Math.max(y1,y2) - Math.min(y1,y2);

    // if straight up or down, algorithm wont work so manually draw vertical line
    if(!isFinite(m)) 
    {
        mainCtx.fillRect(Math.min(x1,x2) * pixelScale, Math.min(y1,y2) * pixelScale, brushSize.value * pixelScale, totalHeight * pixelScale)
    }
    
    for(let x = Math.min(x1,x2); x < totalWidth + Math.min(x1,x2); x++)
    {
        let y = m * x + c;
        y = Math.floor(y);
        x = Math.floor(x);

        let placeX = x;
        let placeY = y;

        mainCtx.fillRect(placeX * pixelScale, placeY * pixelScale, brushSize.value * pixelScale, brushSize.value * pixelScale);
    }
}

function ChangeBrushType(newbrush)
{
    currentBrush = newbrush;

    fill.classList.remove("highlighted");
    line.classList.remove("highlighted");
    brush.classList.remove("highlighted");
}

function ChangeBrushColour(colour)
{       
    mainCtx.fillStyle = colour;
    brushPreview.style.backgroundColor = colour;
}

ChangeBrushSizePreview();

function ChangeBrushSizePreview()
{
    brushPreview.style.border = `calc(1.5rem - ${brushSize.value * 3}px) solid white`;
}