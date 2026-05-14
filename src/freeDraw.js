import { SetCanDrawOnCanvas, ClearCanvas, mainCtx, mainCanvas } from "./canvasDraw";
import { $, SecondsSinceEpoch } from "./utils.js"
import { ConvertImagedataToBase64, DownloadCanvasImage, DownloadCanvasProjectFile, ImportProjectFileToCanvas } from "./fileHandler.js";
import { addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { colRef } from "./firebaseInit.js";


export const importButton = $("c_upload");
importButton.addEventListener("mouseenter", function() {SetToolTipText("Import project file")});
importButton.addEventListener("mouseleave", function() {SetToolTipText("")});

const importFile = $("c_upload-file");
importFile.addEventListener("change", ImportProjectFileToCanvas);


const exportButton = $("c_download");
exportButton.addEventListener("click", OpenDownloadPopup);
exportButton.addEventListener("mouseenter", function() {SetToolTipText("Save artwork")});
exportButton.addEventListener("mouseleave", function() {SetToolTipText("")});

export const submitButton = $("c_submit");
submitButton.addEventListener("click", ShowSubmitPopup);
submitButton.addEventListener("mouseenter", function() {SetToolTipText("Submit artwork to gallery")});
submitButton.addEventListener("mouseleave", function() {SetToolTipText("")});

const tooltip = $("c_tooltip");

// download menu
export const downloadPopup = $("f_export-popup");

const imageButton = $("f_image-button");
imageButton.addEventListener("click", function() {DownloadCanvasImage(); CloseDownloadPopup();});

const fileButton = $("f_file-button");
fileButton.addEventListener("click", function() {DownloadCanvasProjectFile(); CloseDownloadPopup();});

const downloadClose = $("f_download-close");
downloadClose.addEventListener("click", CloseDownloadPopup);

// submit popup

const submitBox = $("f_submit-popup");
const submitClose = $("f_submit-close");
submitClose.addEventListener("click", CloseSubmitPopup);

const popupCanvas = $("f_popup-canvas");
const popupCtx = popupCanvas.getContext("2d");

const submitForm = $("f_submit-artwork-form");
const submitPopupButton = $("f_submit-button");
submitPopupButton.addEventListener("click", SubmitImageToGallery);

let canSubmitArtwork = true;

const titleInfo = $("f_title-info");
const nameInfo = $("f_name-info");
const locationInfo = $("f_location-info");

const titleInput = submitForm.userTitle;
titleInput.addEventListener("input", function() {
    titleInfo.textContent = titleInput.value.length + "/30";
    if(titleInput.value.length > 30) {
        titleInfo.style.color = "red";
        canSubmitArtwork = false;
    }
    else {
        titleInfo.style.color = "black";
        canSubmitArtwork = true;
    }
});
const nameInput = submitForm.userName;
nameInput.addEventListener("input", function() {
    nameInfo.textContent = nameInput.value.length + "/30";
    if(nameInput.value.length > 30) {
        titleInfo.style.color = "red";
        canSubmitArtwork = false;
    }
    else {
        titleInfo.style.color = "black";
        canSubmitArtwork = true;
    }
});
const locationInput = submitForm.userLocation;
locationInput.addEventListener("input", function() {
    locationInfo.textContent = locationInput.value.length + "/30";
    if(locationInput.value.length > 30) {
        titleInfo.style.color = "red";
        canSubmitArtwork = false;
    }
    else {
        titleInfo.style.color = "black";
        canSubmitArtwork = true;
    }
});

const freeDrawCanvasParent = $("f_canvas-parent");
const canvasParent = $("main-canvas-parent");

export function OnFreeDrawLoad()
{
    SetCanDrawOnCanvas(true);
    freeDrawCanvasParent.appendChild(canvasParent);
    freeDrawCanvasParent.appendChild(downloadPopup);

    importButton.hidden = false;
    submitButton.hidden = false;
}

function CloseDownloadPopup()
{
    downloadPopup.hidden = true;
    SetCanDrawOnCanvas(true);
}

function OpenDownloadPopup()
{
    downloadPopup.hidden = false;
    SetCanDrawOnCanvas(false);
}

function SetToolTipText(text)
{
    tooltip.textContent = text;
}

function ShowSubmitPopup()
{
    submitBox.hidden = false;
    SetCanDrawOnCanvas(false);

    popupCtx.drawImage(mainCtx.canvas, 0, 0, popupCanvas.width, popupCanvas.height);
}

function CloseSubmitPopup()
{
    submitBox.hidden = true;
    SetCanDrawOnCanvas(true);
    canSubmitArtwork = true;
    titleInfo.textContent = "0/30";
    nameInfo.textContent = "0/30";
    locationInfo.textContent = "0/30";
    submitForm.reset();

    // clear form
}

function SubmitImageToGallery()
{
    if(!canSubmitArtwork) return;

    let name = submitForm.userName.value;
    let title = submitForm.userTitle.value;
    let location = submitForm.userLocation.value;

    let approved = false;

    let timeStamp = new Timestamp(SecondsSinceEpoch(),0);
    let prompt = 0; // no prompt, free draw

    let image = ConvertImagedataToBase64(mainCtx.getImageData(0,0, mainCanvas.width, mainCanvas.height));

    if(image == ("/".repeat(5000))) // empty canvas
    {
        alert("canvas is empty!");
        return;
    } 

    let document = {
        image: image,
        title: title,
        name: name,
        location: location,
        prompt: prompt,
        approved: approved,
        timestamp: timeStamp
    }

    addDoc(colRef, document);

    CloseSubmitPopup();
}