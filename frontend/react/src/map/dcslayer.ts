import * as L from "leaflet";

export class DCSLayer extends L.TileLayer {
  createTile(coords: L.Coords, done: L.DoneCallback) {
    let newDone = (error?: Error, tile?: HTMLElement) => {
      if (
        error === null &&
        tile !== undefined &&
        !tile.classList.contains("filtered")
      ) {
        // Create a canvas and set its width and height.
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", "256px");
        canvas.setAttribute("height", "256px");

        // Get the canvas drawing context, and draw the image to it.
        var context = canvas.getContext("2d");
        if (context) {
          context.drawImage(
            tile as CanvasImageSource,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Get the canvas image data.
          var imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Create a function for preserving a specified colour.
          var makeTransparent = function (
            imageData: ImageData,
            color: { r: number; g: number; b: number }
          ) {
            // Get the pixel data from the source.
            var data = imageData.data;
            // Iterate through all the pixels.
            for (var i = 0; i < data.length; i += 4) {
              // Check if the current pixel should have preserved transparency. This simply compares whether the color we passed in is equivalent to our pixel data.
              var convert =
                data[i] > color.r - 5 &&
                data[i] < color.r + 5 &&
                data[i + 1] > color.g - 5 &&
                data[i + 1] < color.g + 5 &&
                data[i + 2] > color.b - 5 &&
                data[i + 2] < color.b + 5;

              // Either preserve the initial transparency or set the transparency to 0.
              data[i + 3] = convert ? 100 : data[i + 3];
            }
            return imageData;
          };

          // Get the new pixel data and set it to the canvas context.
          var newData = makeTransparent(imageData, { r: 26, g: 109, b: 127 });
          context.putImageData(newData, 0, 0);
          (tile as HTMLImageElement).src = canvas.toDataURL();
          tile.classList.add("filtered");
        }
      } else {
        return done(error, tile);
      }
    };
    return super.createTile(coords, newDone);
  }
}
