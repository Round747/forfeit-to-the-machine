// I would like to thank my lord and saviour Net Ninja and his firebase tutorial videos.
// This probably wouldn't exist without him.

// -------------- Firebase init ------------------

import { colRef, db } from "./firebaseInit.js";

// -------------- imports ------------------

import { canDrawOnCanvas, SetCanDrawOnCanvas } from "./canvasDraw.js";
import { $ } from "./utils.js";

// -------------- Page logic ------------------

const allGameScreens = [$("title-screen"), $("game-screen"), $("gallery-screen"), $("free-draw-screen")];
const titleScreen = allGameScreens[0];
const gameScreen = allGameScreens[1];
const galleryScreen = allGameScreens[2];
const freeDrawScreen = allGameScreens[3];

// functions

function HideGameScreens() {allGameScreens.forEach(screen => {screen.hidden = true;})}

// -------------- persistant ------------------

const exitGameButton = $("p_menu");
exitGameButton.addEventListener("click", function() {LoadTitleScreen(); ExitGame();});


// -------------- Title screen ------------------

const music = new Audio("assets/sounds/loop.wav");
music.play();
music.volume = 0.5;
music.addEventListener("ended", function() {this.currentTime = 0;
    this.play();});

const muteButton = $("p_mute-button");
muteButton.addEventListener("click", function() {
    if(music.volume == 0)
    {
        music.volume = 0.5;
        muteButton.src = "assets/images/sound.png";
    }
    else
    {
        music.volume = 0;
        muteButton.src = "assets/images/mute.png";
    }
});


const pop = new Audio("assets/sounds/pop.wav");
    window.addEventListener("mousedown", function() {
        
        pop.play();
    });

function LoadTitleScreen()
{
    sessionStorage.setItem("currentPage", 0);
    SetCanDrawOnCanvas(false);
    // muteButton.hidden = false;
    HideGameScreens();
    titleScreen.hidden = false;
    exitGameButton.hidden = true;
}

const titleButtons = $("t_menu-buttons");
titleButtons.children[0].addEventListener("click", LoadGameScreen);
titleButtons.children[1].addEventListener("click", LoadGalleryScreen);
titleButtons.children[2].addEventListener("click", LoadFreeDrawScreen);

// -------------- Game screen ------------------

import { OnGameLoad, ExitGame } from "./game.js";

function LoadGameScreen()
{
    music.play();
    // muteButton.hidden = true;

    sessionStorage.setItem("currentPage", 1);

    HideGameScreens();
    gameScreen.hidden = false;
    exitGameButton.hidden = false;
    OnGameLoad();

}

// -------------- Gallery screen ------------------

import { OnGalleryLoad } from "./gallery.js";

function LoadGalleryScreen()
{
    music.play();
    // muteButton.hidden = true;

    sessionStorage.setItem("currentPage", 2);

    HideGameScreens();
    galleryScreen.hidden = false;
    exitGameButton.hidden = false;

    OnGalleryLoad();
}


// -------------- Free Draw screen ------------------

import { OnFreeDrawLoad } from "./freeDraw.js";

function LoadFreeDrawScreen()
{
    music.play();
    // muteButton.hidden = true;

    sessionStorage.setItem("currentPage", 3);

    HideGameScreens();
    freeDrawScreen.hidden = false;
    exitGameButton.hidden = false;

    OnFreeDrawLoad();

}

// -------------- Game logic ------------------

switch(parseInt(sessionStorage.getItem("currentPage")))
{
    case 1:
        LoadGameScreen();
        break;
    case 2:
        LoadGalleryScreen();
        break;
    case 3:
        LoadFreeDrawScreen();
        break;
    default: // called in the case of null (no storage item found), value of 0 or a fallback
        LoadTitleScreen();
        break;
}