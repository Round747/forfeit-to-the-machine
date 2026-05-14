import { $ } from "./utils.js"
import { mainCanvas, pixelScale, mainCtx } from "./canvasDraw.js";
import { ConvertBytesToImageData } from "./gallery.js";

mainCtx.webkitImageSmoothingEnabled = false;
mainCtx.mozImageSmoothingEnabled = false;
mainCtx.imageSmoothingEnabled = false;

export function DownloadCanvasImage()
{
    let image = mainCanvas.toDataURL();

    let downloadLink = document.createElement("a");

    downloadLink.download = "My awesome artwork.png";
    downloadLink.href = image;

    downloadLink.click();

    URL.revokeObjectURL(downloadLink.href);
}

export function DownloadCanvasProjectFile()
{
    // compress and convert to base 64.

    let projectString = ConvertImagedataToBase64(mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height));

    const link = document.createElement("a");
    const file = new Blob([projectString], {type: "text/plain"});

    link.href = URL.createObjectURL(file);

    link.download = "My Awesome artwork.fmp";

    link.click();

    URL.revokeObjectURL(link.href);
}

export function ImportProjectFileToCanvas(event)
{   
    let string = "";

    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);

    reader.addEventListener("load", () => {
        string = reader.result;

        if(!confirm("overwrite existing artwork?")) return;

        let imageBytes = ConvertBytesToImageData(string);
        let imageData = mainCtx.createImageData(100,100);

        // apply bytes into imageData object
        for(let i = 0; i < 100 * 100 * 4; i++)
        {
            imageData.data[i] = imageBytes[i];
        }
        

        mainCtx.putImageData(imageData, 0, 0);

        mainCtx.drawImage(mainCtx.canvas,0,0, mainCanvas.width * 6, mainCanvas.height * 6);

    });
}

export function ConvertImagedataToBase64(imageData)
{
    let bitArray = CompressImageData(imageData); // turn canvas image data into custom format bit array, each element being a 1 or a 0
    let byteArray = ConvertBitArrayToBytes(bitArray); // compress bit array into an array of bytes, oring the bits into the value of each element

    // convert the byte array into a base 64 string
    let string = "";

    for(let i = 0; i < byteArray.length; i++)
    {
        string += String.fromCharCode(byteArray[i]);
    }

    let base64 = btoa(string);

    return base64;

}

function CompressImageData(imageData)
{
    const width = (mainCanvas.width / pixelScale);

    let pixelArray = imageData.data;

    let resultBitArray = new Uint8Array(width * width * 3);
    let resultIndex = 0;

    for(let i = 0; i < width * width; i++, resultIndex += 3)
    {
        let x = i % width;
        let y = Math.floor(i / width);

        let arrayIndex = ((width * y * pixelScale * 4 * pixelScale) + (x * pixelScale * 4)); // *4 at the end because each pixel is rgba

        let r = pixelArray[arrayIndex] == 255 ? 1 : 0;
        let g = pixelArray[arrayIndex + 1] == 255 ? 1 : 0;
        let b = pixelArray[arrayIndex + 2] == 255 ? 1 : 0;

        resultBitArray[resultIndex] = r;
        resultBitArray[resultIndex + 1] = g;
        resultBitArray[resultIndex + 2] = b;
    }

    return resultBitArray;
}   

function ConvertBitArrayToBytes(bitArray)
{
    let resultByteArray = new Uint8Array(bitArray.length / 8);

    for(let i = 0; i < bitArray.length; i++)
    {
        let x = i % 8;
        let y = Math.floor(i / 8);

        let value = bitArray[i] == 1 ? 1 << x : 0;

        resultByteArray[y] = (resultByteArray[y] ?? 0) | value;
    }

    return resultByteArray;
}