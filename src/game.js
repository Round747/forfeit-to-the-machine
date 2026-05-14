import { $, SecondsSinceEpoch } from "./utils.js";
import { importButton, submitButton, downloadPopup} from "./freeDraw.js";
import { ClearCanvas, SetCanDrawOnCanvas, mainCanvas, mainCtx } from "./canvasDraw.js";
import { ConvertImagedataToBase64 } from "./fileHandler.js";
import { addDoc, Timestamp } from "firebase/firestore";
import { colRef } from "./firebaseInit.js";

const playerCanvasHolder = $("main-canvas-parent");
const playerCanvasLocation = $("g_canvas-parent");
const machineCanvas = $("g_machine-canvas");
const machineOverlay = $("g_machine-canvas-overlay");

const promptText = $("g_prompt-reveal");
const promptHeader = $("g_prompt");

const header = $("g_header");
const promptPopup = $("g_prompt-popup");

const timer = $("g_timer")

let currentPrompt = 1;
const machineText = $("g_machine-text");
const generateText = machineText.children[0];
const generateElipses = machineText.children[1];

const forfeitPopup = $("g_forfeit-popup");
const forfeitOverlay = $("g_forfeit-overlay");

const continueButtons = $("g_continue-buttons");
const forfeitButton = continueButtons.children[0];
const keepGoingButton = continueButtons.children[1];

const roundNumber = $("g_round-number");
const resultButton = $("g_result-button");
resultButton.addEventListener("click", CalculateWinner);

const loseText = $("g_lose-text");

forfeitButton.addEventListener("click", function() {
    sessionStorage.setItem("currentPage", 0);
    SetCanDrawOnCanvas(false);

    $("game-screen").hidden = true;
    $("title-screen").hidden = false;
    $("p_menu").hidden = true;

    forfeitOverlay.classList.remove("opacity50");
    forfeitPopup.classList.remove("popup-middle");

    ExitGame();
});
keepGoingButton.addEventListener("click", function() {
    forfeitOverlay.classList.remove("opacity50");
    forfeitPopup.classList.remove("popup-middle");

    setTimeout(StartRound, 1500);
});

const prompts = ["apples", "something hot", "your favourite food", "self portrait"];
const loseTexts = ["Let's face it, you're not cut out for this.", "Was that really worth the effort?", "The Machine just knows more about food than you.", "That doesn't even look like you."];

export function OnGameLoad()
{
    playerCanvasLocation.appendChild(playerCanvasHolder);
    playerCanvasLocation.appendChild(downloadPopup);
    importButton.hidden = true;
    submitButton.hidden = true;

    ClearCanvas();

    // play cutsene
    
    StartRound();
}

export function ExitGame()
{
    clearTimeout(generateVar);
    clearTimeout(timerVar);
    header.classList.remove("visible");
    generateText.textContent = "";
    generateElipses.textContent = "";
}

let hasSeenComic = false;

function StartRound()
{
    if(!hasSeenComic)
    {
        PlayComic();
        return;
    }
    
    if(currentPrompt == 5)
    {
        PlayEnding();
        return;
    }
    ClearCanvas();
    machineCanvas.src = "assets/images/ai/empty.png";

    promptText.textContent = prompts[currentPrompt - 1].toUpperCase();
    promptHeader.textContent = prompts[currentPrompt - 1].toUpperCase();
    roundNumber.textContent = "ROUND " + currentPrompt; 
    
    setTimeout(function() {
        promptPopup.classList.add("popup-middle");
    }, 0);

    setTimeout(function() {
        promptPopup.classList.remove("popup-middle");

        setTimeout(function() {
            if($("game-screen").hidden) return; 
                header.classList.add("visible");
                $("g_header-info").style.display = "flex";
                resultButton.hidden = true;
                StartTimer();
            }, 600);

    }, 3000);
}

let timerCount = 60;
let timerVar;
let generateVar;

function StartTimer()
{
    timerCount = 60;
    timer.textContent = timerCount + "s";

    timerVar = setInterval(DecrementTimer, 1000);
    StartGenerating();
    machineCanvas.src = "assets/images/ai/machine generating.gif";
    SetCanDrawOnCanvas(true);

}

function DecrementTimer()
{
    if(timerCount == 0)
    {
        EndRound();
        return;
    }

    timerCount--;
    timer.textContent = timerCount + "s";

}

function StartGenerating()
{
    generateLoop = 0;
    generateIndex = 0;
    generateText.textContent = generateTexts[generateIndex];
    generateVar = setInterval(IncrementGenerateText, 750);

}

let generateTexts = ["Generating", "Stealing training images", "Consuming water", "Averaging results", "Raising RAM prices"]
let generateLoop = 0;
let generateIndex = 0;

function IncrementGenerateText()
{
    if(generateElipses.textContent == "...")
    {
        generateElipses.textContent = ".";
        if(generateLoop == 4)
        {
            generateIndex ++;
            if(generateIndex == generateTexts.length) generateIndex = 0;
            generateText.textContent = generateTexts[generateIndex];
            generateLoop = 0;
            return;
        }
        generateLoop++;
        return;
    }

    generateElipses.textContent += ".";
}

function EndRound()
{
    header.classList.remove("visible");

    machineOverlay.src = "assets/images/ai/reveal.gif";

    clearTimeout(generateVar);
    clearTimeout(timerVar);
    generateText.textContent = "";
    generateElipses.textContent = "";

    setTimeout(function() {
        // calculate actual image
        switch(currentPrompt)
        {
            case 1:
                machineCanvas.src = "assets/images/ai/apples.png";
                break;
            case 2:
                machineCanvas.src = "assets/images/ai/something hot.png";
                break;
            case 3:
                machineCanvas.src = "assets/images/ai/favourite food.png";
                break;
            case 4:
                machineCanvas.src = "assets/images/ai/self portrait.png";
                break;    
        }
    }, 400);

    setTimeout(function() {
        SetCanDrawOnCanvas(false);
        SubmitCanvasToGallery();
        currentPrompt++;
    }, 500);

    setTimeout(function() {
        machineOverlay.src = "assets/images/ai/transparent.png";
    }, 1400);

    setTimeout(function() {
        header.classList.add("visible");
        $("g_header-info").style.display = "none";
        resultButton.hidden = false;
        resultButton.textContent = "GET RESULTS";

    }, 3000);

    //calculate animaiton & popup

    // machine wins

    // forfeit to the machine?

    //show fun fact

    // submit canvas to gallery

    // clear canvas

    // next round
}

function CalculateWinner()
{
    loseText.textContent = loseTexts[currentPrompt - 2];
    resultButton.textContent = "CALCULATING.";

    setTimeout(function() {
        resultButton.textContent = "CALCULATING..";
        
        setTimeout(function() {
        resultButton.textContent = "CALCULATING...";
        
        }, 750);
    }, 750);

    setTimeout(function() {
        header.classList.remove("visible");

        forfeitOverlay.classList.add("opacity50");
        forfeitPopup.classList.add("popup-middle");
    }, 2000);
    
}

function SubmitCanvasToGallery()
{
    let image = ConvertImagedataToBase64(mainCtx.getImageData(0,0, mainCanvas.width, mainCanvas.height));

    if(image == ("/".repeat(5000))) // don't submit an empty canvas
    {
        return;
    } 

    let prompt = currentPrompt + 1;
    let approved = false;
    let timeStamp = new Timestamp(SecondsSinceEpoch(),0);

    let document = {
        image: image,
        title: "",
        name: "",
        location: "",
        prompt: prompt,
        approved: approved,
        timestamp: timeStamp
    }

    // TODO readd (removed for testing)
    addDoc(colRef, document);
}

const gamePage = $("g_game");
const comicPage = $("g_comic");
const comicImage = $("g_comic-image");

let comicPageNumber = 1;
let comicPath = "assets/images/comic/";
let comicLength = 5;

$("g_comic-left").addEventListener("click", function() {
    if(comicPageNumber == 1) return;
    comicPageNumber--;
    comicImage.src = comicPath + comicPageNumber + ".png";
});

$("g_comic-right").addEventListener("click", function() {
    if(comicPageNumber == comicLength && !hasSeenComic) 
    {
        gamePage.hidden = false;
        comicPage.style.display = "none";
        hasSeenComic = true;
        StartRound();
        return;
    }
    else if (comicPageNumber == comicLength && hasSeenComic)
    {
        sessionStorage.setItem("currentPage", 0);
        SetCanDrawOnCanvas(false);

        $("game-screen").hidden = true;
        $("title-screen").hidden = false;
        $("p_menu").hidden = true;

        forfeitOverlay.classList.remove("opacity50");
        forfeitPopup.classList.remove("popup-middle");

        ExitGame();
    }
    comicPageNumber++;
    comicImage.src = comicPath + comicPageNumber + ".png";
});

function PlayComic()
{
    comicPath = "assets/images/comic/";
    comicLength = 5;
    gamePage.hidden = true;
    comicPage.style.display = "flex";
    comicPageNumber = 1;
    comicImage.src = comicPath + comicPageNumber + ".png";

}

const endingPage = $("g_ending");

function PlayEnding()
{
    comicPath = "assets/images/ending/";
    gamePage.hidden = true;
    comicPage.style.display = "flex";
    comicPageNumber = 1;
    comicLength = 6;

    comicImage.src = comicPath + comicPageNumber + ".png";

}