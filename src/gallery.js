import { getCountFromServer, getDoc, getDocs, doc, query, where, orderBy, limit, startAt, serverTimestamp, startAfter, limitToLast, endAt, endBefore } from "firebase/firestore";
import { colRef, db } from "./firebaseInit";
import { $ } from "./utils.js"

const contributions = $("gl_contributions");
const galleryList = $("gl_list");
const totalImages = $("gl_total-images");
const showUnapproved = $("gl_show-unapproved");
showUnapproved.addEventListener("click", ToggleShowUnapproved);

const pageButtons = $("gl_page-buttons");
pageButtons.children[0].addEventListener("click", function() {
    if(pageButtons.children[1].value != 1) 
        {
        LoadPreviousPage();}
});
pageButtons.children[2].addEventListener("click", function() {
     
    LoadNextPage();
});

const promptButtons = $("gl_prompt-buttons");

for(let p = 1; p < promptButtons.children.length - 2; p++)
{
    promptButtons.children[p].addEventListener("click", function() {ChangeSelectedPrompt(p + 1); this.classList.add("highlighted");});
}

promptButtons.children[promptButtons.children.length-1].addEventListener("click", function() {ChangeSelectedPrompt(0); this.classList.add("highlighted");});

// popup

const popupFields = $("gl_popup-fields");
const popupBox = $("gl_popup-box");
const popupCanvas = $("gl_popup-canvas");
const popupCtx = popupCanvas.getContext("2d");
popupCtx.webkitImageSmoothingEnabled = false;
popupCtx.mozImageSmoothingEnabled = false;
popupCtx.imageSmoothingEnabled = false;

const closePopup = $("gl_close-popup");
closePopup.addEventListener("click", ClosePopupBox);

let hasSeenDisclaimer = sessionStorage.getItem("hasSeenDisclaimer") ?? false;

const disclaimerPopup = $("gl_disclaimer-popup");
const closeDisclaimer = $("gl_disclaimer-close");
closeDisclaimer.addEventListener("click", function() {disclaimerPopup.hidden = true; sessionStorage.setItem("hasSeenDisclaimer", true)});

disclaimerPopup.hidden = hasSeenDisclaimer;

const roundName = $("gl_round-name");

// fields

const popupTitle = $("gl_popup-title");
const popupHr = $("gl_popup-hr");

// variables

let canViewUnapproved = sessionStorage.getItem("canViewUnapproved") == "true" ? true : false;
let selectedPrompt = 0;

const imagesPerPage = 24;

export function OnGalleryLoad()
{
    // TODO remember on refresh
    ChangeSelectedPrompt(0);
    promptButtons.children[6].classList.add("highlighted");

    if(!canViewUnapproved)
    {
        showUnapproved.src = "assets/images/eye-closed.png";
    }
    else
    {
        showUnapproved.src = "assets/images/eye.png";
    }

    ClosePopupBox();

    // TODO uncomment (hidden to save reads)
    GetGalleryContributions();
}

async function GetGalleryContributions()
{
    const count = await getCountFromServer(colRef);
    contributions.textContent = count.data().count + " artworks contributed";
}

async function ShowPageImageCount(qry)
{
    const count = await getCountFromServer(qry);
    let pageStart = imagesPerPage * (pageButtons.children[1].value - 1);

    totalImages.textContent = `Showing artworks ${pageStart + 1}-${Math.min(count.data().count, pageStart + imagesPerPage)} of ${count.data().count}`;
}

let canLoadNextPage = true;
let lastDocument = null;
let firstDocument = null;

function LoadNextPage()
{
    if(!canLoadNextPage) return;

    totalImages.textContent = "";

    if(canViewUnapproved == true)
    {
        // get all from selected prompt

        // only seems to work in ternary
        const qry = (lastDocument != null) 
        ? query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc"), startAfter(lastDocument)) 
        : query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc"));

        const pageQry = query(qry, limit(imagesPerPage));

        getDocs(pageQry).then((snapshot) => {

            if(snapshot.docs.length == 0) return;
            lastDocument = snapshot.docs[snapshot.docs.length - 1].data().timestamp;
            firstDocument = snapshot.docs[0];

            CheckForLastPage(snapshot, qry);
            ShowPageImageCount(query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc")));

            snapshot.docs.forEach((doc) => {
                CreateGalleryElement(doc);
            });           
        });

        galleryList.innerHTML = ""; // clear existing gallery

    }
    else
    {
        const qry = query(colRef, where("approved", "==", true), orderBy("timestamp", "desc"));
        const qry2 = query(qry, where("prompt", "==", selectedPrompt));

        const pageQry = query(qry2, limit(imagesPerPage));

        getDocs(pageQry).then((snapshot) => {
            
            CheckForLastPage(snapshot, qry2);
            ShowPageImageCount(qry2);
            
            snapshot.docs.forEach((doc) => {
                CreateGalleryElement(doc);
            });
        });

        galleryList.innerHTML = ""; // clear existing gallery
    }

    pageButtons.children[1].value = parseInt(pageButtons.children[1].value) + 1;

}

function GetFirstPage()
{
    totalImages.textContent = "";
    pageButtons.children[1].value = 1;

    if(canViewUnapproved == true)
    {
        // get all from selected prompt

        const qry = query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc"));
        const pageQry = query(qry, limit(imagesPerPage));

        getDocs(pageQry).then((snapshot) => {

            if(snapshot.docs.length == 0) return;
            lastDocument = snapshot.docs[snapshot.docs.length - 1].data().timestamp;
            firstDocument = snapshot.docs[0];

            CheckForLastPage(snapshot, qry);
            ShowPageImageCount(qry);
            
            snapshot.docs.forEach((doc) => {
                CreateGalleryElement(doc);
            }); 
        });

        galleryList.innerHTML = ""; // clear existing gallery

    }
    else
    {
        const qry = query(colRef, where("approved", "==", true), orderBy("timestamp", "desc"), where("prompt", "==", selectedPrompt));
        const pageQry = query(qry, limit(imagesPerPage));

        getDocs(qry).then((snapshot) => {

            if(snapshot.docs.length == 0) return;
            lastDocument = snapshot.docs[snapshot.docs.length - 1].data().timestamp;
            firstDocument = snapshot.docs[0];

            CheckForLastPage(snapshot, qry);
            ShowPageImageCount(qry);

            snapshot.docs.forEach((doc) => {
                CreateGalleryElement(doc);
            });
        });

        galleryList.innerHTML = ""; // clear existing gallery

    }
}

function LoadPreviousPage()
{
    // console.log("loading previous page");
    // start before beginning of last query, limit from end

    totalImages.textContent = "";

    const qry = query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc"), endBefore(firstDocument), limitToLast(imagesPerPage));

    getDocs(qry).then((snapshot) => {

        if(snapshot.docs.length == 0) return;
        lastDocument = snapshot.docs[snapshot.docs.length - 1].data().timestamp;
        firstDocument = snapshot.docs[0];
        // console.log(lastDocument.id);

        ShowPageImageCount(query(colRef, where("prompt", "==", selectedPrompt), orderBy("timestamp", "desc")));
        
        snapshot.docs.forEach((doc) => {
            CreateGalleryElement(doc);
        });
    });

    galleryList.innerHTML = ""; // clear existing gallery
    canLoadNextPage = true; 
    pageButtons.children[1].value = parseInt(pageButtons.children[1].value) - 1;
}

function CheckForLastPage(snapshot, qry)
{
    canLoadNextPage = false; 
    
    const lastQry = query(qry, limitToLast(1));
    
    getDocs(lastQry).then((lastSnapshot) => {
        if(snapshot.docs[snapshot.docs.length - 1].id == lastSnapshot.docs[0].id)
        {
            canLoadNextPage = false;
        }
        else 
        {
            canLoadNextPage = true;
        }
    });
}

function CreateGalleryElement(doc)
{
    let data = doc.data();

    let canvas = document.createElement("canvas");
    canvas.setAttribute("width", "300");
    canvas.setAttribute("height", "300");
    canvas.classList.add("gallery-box");
    canvas.addEventListener("click", function() {ShowGalleryElementPopup(canvas)});

    canvas.setAttribute("data-title", data.title);
    canvas.setAttribute("data-name", data.name);
    canvas.setAttribute("data-location", data.location);

    let ctx = canvas.getContext("2d");
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    let imageBytes = ConvertBytesToImageData(data.image);
    let imageData = ctx.createImageData(100,100);

    // apply bytes into imageData object
    for(let i = 0; i < 100 * 100 * 4; i++)
    {
        imageData.data[i] = imageBytes[i];
    }

    ctx.putImageData(imageData, 0, 0);

    ctx.drawImage(ctx.canvas,0,0, canvas.width * 3, canvas.height * 3);

    galleryList.appendChild(canvas);

}

function ShowGalleryElementPopup(element)
{
    let ctx = element.getContext("2d");

    popupBox.hidden = false;
    popupFields.innerHTML = ""; // clear old data

    popupCtx.drawImage(ctx.canvas,0,0,600,600);

    let name = element.dataset.name;
    let location = element.dataset.location;

    popupTitle.textContent = element.dataset.title;

    if(element.dataset.title == "") popupHr.hidden = true;
    else popupHr.hidden = false;

    if(name != "" || location != "") popupFields.appendChild(document.createElement("hr"));

    if(name != "")
    {
        let nameField = document.createElement("p");
        nameField.innerHTML = "<span class=\"gl_popup-field\" style=\"margin-right: 5rem;\">BY</span>" + name;
        popupFields.appendChild(nameField);
    }

    if(location != "")
    {
        let locationField = document.createElement("p");
        locationField.innerHTML = "<span class=\"gl_popup-field\" style=\"margin-right: 2rem;\">FROM</span>" + location;
        popupFields.appendChild(locationField);
    }       
}

export function ConvertBytesToImageData(imageString)
{
    let imageData = [];

    let binary = atob(imageString);
    let imageBytes = new Uint8Array(binary.length);

    for(let i = 0; i < imageString.length; i++)
    {
        // console.log(imageString[i]);
        imageBytes[i] = binary.charCodeAt(i);
    }

    for(let i = 0; i < (imageBytes.length * 8); i++)
    {
        let x = i % 8;
        let y = Math.floor(i / 8);

        let mask = 1 << x;

        // if bit is 1
        if((imageBytes[y] & mask) == mask) imageData.push(255);
        else imageData.push(0);

        if((i + 1)  % 3 == 0 && i != 0) imageData.push(255); // every "rgb" needs an "a" at the end
    }

    return imageData;
}

function ClosePopupBox()
{
    popupBox.hidden = true;
}

function ToggleShowUnapproved()
{
    if(canViewUnapproved)
    {
        showUnapproved.src = "assets/images/eye-closed.png";
    }
    else
    {
        showUnapproved.src = "assets/images/eye.png";
    }

    canViewUnapproved = !canViewUnapproved;
    sessionStorage.setItem("canViewUnapproved", canViewUnapproved);
    
    GetFirstPage();
}

function ChangeSelectedPrompt(prompt)
{   
    for(let i = 1; i < promptButtons.children.length; i++) promptButtons.children[i].classList.remove("highlighted");
    selectedPrompt = prompt;

    switch(prompt)
    {
        case 0:
            roundName.textContent = "FREE DRAW";
            break;
        case 2:
            roundName.textContent = "APPLES";
            break;
        case 3:
            roundName.textContent = "SOMETHING HOT";
            break;
        case 4:
            roundName.textContent = "YOUR FAVOURITE FOOD";
            break;
        case 5:
            roundName.textContent = "SELF PORTRAIT";
            break;
    }

    GetFirstPage();
}

