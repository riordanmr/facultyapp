// A class to create a scrollbar for an HTML canvas.  
// The caller provides a canvas representing the scrollbar, and a callback
// function to call when the scrollbar is scrolled.  
//
// Mark Riordan  Feb 2024
// Released under the MIT License.

// Color of the background of a scrollbar.
const colorScrollbar = '#d9d9d9';  // Used color picker to get this color from original applet.
// Color of the slider in a scrollbar.
const colorSlider = '#aeaeae';  // Used color picker to get this color from original applet.
// Color of the arrows in the scrollbar - the triangles that the user clicks to scroll up or down.
const colorArrow = '#000000'; 

// The triangle is drawn with the top point at this ratio of the height of the box
// enclosing the triangle, at the end of the scrollbar.
const triangleOffsetRatio = 0.2;

class CSScrollbar {
    // Create a new CSScrollbar object.  
    // canvas       is the canvas of the scrollbar.  For a vertical scrollbar, this
    //              should be positioned immediately to the left or right of the
    //              main window being scrolled (you may want to use an HTML table),
    //              and should be tall and thin. For a horizontal scrollbar, it should
    //              be positioned immediately below the main window, and should be
    //              short and wide.
    // canvasMain   is the canvas of the main window (the one being scrolled).
    // maxLines     is the total number of lines in the window being scrolled.
    //              or in the case of a horizontal scrollbar, the number of units
    //              to be scrolled.
    // linesPerPage is the number of lines (or horizontal units) visible on 
    //              the screen at once.
    // isVertical   is true for a vertical scrollbar, or false for horizontal.
    // onScrollback is a function to be called whenever the user moves the slider.
    //              This function will then query curLine to find out where they 
    //              moved it to.
    constructor (canvas, canvasMain, maxLines, linesPerPage, isVertical, onScrollCallback) {
      this.canvas = canvas;
      this.canvasMain = canvasMain;
      this.maxLines = maxLines;
      this.linesPerPage = linesPerPage;
      this.isVertical = isVertical;
      this.onScrollCallback = onScrollCallback;

      this.ctx = canvas.getContext('2d');

      this.width = canvas.width;
      this.height = canvas.height;
      if (isVertical) {
        this.scrollbarSize = canvas.width;
        this.totalScrollbarLength = canvas.height;
      } else {
        this.scrollbarSize = canvas.height;
        this.totalScrollbarLength = canvas.width;
      }
      this.curLine = 0;
      this.isDragging = false;
      // curSliderPos is the location of the slider, relative to the top 
      // or left of the scrollbar canvas.
      // It will never be 0, due to the arrows at the end of the scrollbar.
      this.curSliderPos = this.scrollbarSize;

      // This is a trick to allow us to add a callback to the event listener.
      this.handleClick = this.handleClick.bind(this);
      this.handleWheelScroll = this.handleWheelScroll.bind(this);
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);

      canvas.addEventListener("click", this.handleClick);  
      if(isVertical) {
        canvas.addEventListener("wheel", this.handleWheelScroll);
      }
      this.canvas.addEventListener('mousedown', this.handleMouseDown);
      this.canvas.addEventListener('mousemove', this.handleMouseMove);
      // Have the main window also watch for cursor movements, as sometimes
      // users dragging the slider will stray outside the scrollbar.
      this.canvasMain.addEventListener('mousemove', this.handleMouseMove);
      this.canvas.addEventListener('mouseup', this.handleMouseUp);
      // Have the main window also watch for mouse up, as sometimes
      // users dragging the slider will let go of the button outside the scrollbar.
      this.canvasMain.addEventListener('mouseup', this.handleMouseUp);
    }

    setMaxLines(maxLines) {
        this.maxLines = maxLines;
        this.draw();
    }

    // Draw a square with curved corners.  This is used for scrollbar sliders.
    // curveSize is the radius of the curve.
    drawCurvedSquare(x, y, size, curveSize) {
      var bendRatio = 0.25;  // Determined by trial and error.
      this.ctx.beginPath();
      // Start at the upper left corner.
      this.ctx.moveTo(x+curveSize, y);
      // Across the top.
      this.ctx.lineTo(x + size - curveSize, y);
      // Upper right corner.
      this.ctx.quadraticCurveTo(x + size-curveSize*bendRatio, y+(curveSize*bendRatio), x + size, y + curveSize);
      // Down the right side.
      this.ctx.lineTo(x + size, y + size - curveSize);
      // Lower right corner.
      this.ctx.quadraticCurveTo(x + size-curveSize*bendRatio, y + size-curveSize*bendRatio, x + size - curveSize, y + size);
      // Across the bottom.
      this.ctx.lineTo(x+curveSize, y + size);
      // Lower left corner.
      this.ctx.quadraticCurveTo(x - curveSize*bendRatio, y + size-curveSize*bendRatio, x, y + size-curveSize);
      // Up the left side.
      this.ctx.lineTo(x, y+curveSize);
      // Upper left corner.
      this.ctx.quadraticCurveTo(x+curveSize*bendRatio, y, x+curveSize, y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Draw a triangle.  This is used for the up and down arrows in the scrollbar.
    drawTriangle(x1,y1,x2,y2,x3,y3) {
      this.ctx.fillStyle = colorArrow;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineTo(x3, y3);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Draw the entire scrollbar.
    draw () {
      // Draw the scrollbar itself. 
      this.ctx.fillStyle = colorScrollbar;
      //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Draw the scrollbar slider.
      this.ctx.fillStyle = colorSlider;
      if (this.isVertical) {
        // Draw the slider.
        this.pixelsPerScroll = (this.height - 3*this.scrollbarSize) * (this.linesPerPage / this.maxLines); 
        var ratioDown = this.curLine / this.maxLines;
        this.curSliderPos = this.scrollbarSize + (this.height - 3*this.scrollbarSize) * ratioDown;
        this.drawCurvedSquare(0, this.curSliderPos, this.width, 0.3*this.width);

        // Draw the background of the top arrow.
        this.ctx.fillStyle = colorSlider;
        this.ctx.fillRect(0, 0, this.width, this.width);
        // Draw the top arrow: the triangle on which the user can click to scroll up.
        this.ctx.fillStyle = colorArrow;
        this.drawTriangle(this.width / 2, this.width * triangleOffsetRatio,// top center
          this.width * triangleOffsetRatio, this.width*(1.0-triangleOffsetRatio), // bottom left
          this.width *(1.0-triangleOffsetRatio), this.width*(1.0-triangleOffsetRatio)); // bottom right

        // Draw the background of the bottom arrow.
        this.ctx.fillStyle = colorSlider;
        this.ctx.fillRect(0, this.height - this.width, this.width, this.width);
        // Draw the triangle on which the user can click to scroll down.
        this.drawTriangle(this.width / 2, this.height - this.width * triangleOffsetRatio,// bottom center
          this.width*triangleOffsetRatio, this.height - this.width*(1.0-triangleOffsetRatio), // top left
          this.width*(1.0-triangleOffsetRatio), this.height - this.width*(1.0-triangleOffsetRatio)); // top right
      } else {
        // Draw the slider.
        this.pixelsPerScroll = (this.width - 3*this.scrollbarSize) * (this.linesPerPage / this.maxLines);
        var ratioDown = this.curLine / this.maxLines;
        this.curSliderPos = this.scrollbarSize + (this.width - 3*this.scrollbarSize) * ratioDown;
        this.drawCurvedSquare(this.curSliderPos, 0, this.scrollbarSize, 0.3*this.scrollbarSize);

        // Draw the background of the left arrow.
        this.ctx.fillStyle = colorSlider;
        this.ctx.fillRect(0, 0, this.height, this.height);
        // Draw the left arrow: the triangle on which the user can click to scroll left.
        this.ctx.fillStyle = colorArrow;
        this.drawTriangle(this.height * triangleOffsetRatio, this.height / 2, // left center
          this.height * (1.0-triangleOffsetRatio), this.height * triangleOffsetRatio, // top right
          this.height * (1.0-triangleOffsetRatio), this.height * (1.0-triangleOffsetRatio)); // bottom right

        // Draw the background of the right arrow.
        this.ctx.fillStyle = colorSlider;
        this.ctx.fillRect(this.width - this.height, 0, this.height, this.height);
        // Draw the triangle on which the user can click to scroll right.
        this.drawTriangle(this.width - this.height * triangleOffsetRatio, this.height / 2, // right center
          this.width - this.height * (1.0-triangleOffsetRatio), this.height * triangleOffsetRatio, // top left
          this.width - this.height * (1.0-triangleOffsetRatio), this.height * (1.0-triangleOffsetRatio)); // bottom left
      }
    }

    // The user has clicked on the scrollbar at location y in the scrollbar canvas.  
    // Calculate the line to scroll to.
    // Exit: Returns true if the line number has changed, in which case
    //       curLine is the new ordinal of the top line in the window.
    calculateNewLine(y) {
      if (y >= this.curSliderPos && y <= (this.curSliderPos + this.scrollbarSize)) {
        // User clicked on the slider.  No change in line number.
        return false;
      } else {
        if (y < this.scrollbarSize) {
          // User clicked in the top arrow.
          this.curLine--;
          if (this.curLine < 0) {
            this.curLine = 0;
          }
        } else if(y > this.totalScrollbarLength - this.scrollbarSize) {
          // User clicked in the bottom arrow.
          this.curLine++;
          if (this.curLine >= this.maxLines) {
            this.curLine = this.maxLines-1;
          }
        } else if(y < this.curSliderPos) {
          // The user has clicked above the slider, meaning page up.
          this.curLine -= this.linesPerPage;
          if (this.curLine < 0) {
            this.curLine = 0;
          }
        } else {
          // The user has clicked below the slider, meaning page down.
          this.curLine += this.linesPerPage;
          if (this.curLine >= this.maxLines) {
            this.curLine = this.maxLines-1;
          }
        }
        return true;
      }
    }

    // Handle a click on the scrollbar.
    handleClick(e) {
      var rect = e.target.getBoundingClientRect();
      var curPos = this.isVertical ? e.clientY - rect.top : e.clientX - rect.left;

      if (this.calculateNewLine(curPos)) {
        this.draw();
        this.onScrollCallback();
      }
    }

    // Handle a mouse wheel scroll event.
    handleWheelScroll(e) {
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      if (delta > 0) {
        // Scroll up, if possible.
        this.curLine--;
        if (this.curLine < 0) {
          this.curLine = 0;
        }
      } else {
        // Scroll down, if possible.
        this.curLine++
        if (this.curLine >= this.maxLines) {
          this.curLine = this.maxLines-1;
        }
      }
      this.draw();
      this.onScrollCallback();
    }

    // Handle a mouse down event on the scrollbar.
    // This is not the same as a click; the user may be dragging the slider.
    handleMouseDown(e) {
      // Check if the mouse is over the thumb.
      var rect = e.target.getBoundingClientRect();
      var curPos = this.isVertical ? e.clientY - rect.top : e.clientX - rect.left;
      if(curPos >= this.curSliderPos && curPos < this.curSliderPos + this.scrollbarSize) {
        this.isDragging = true;
      }
    }

    // Handle the mouse moving, possibly while the user is dragging the slider.
    handleMouseMove(e) {
      if (this.isDragging) {
        var rect = e.target.getBoundingClientRect();
        var curPos = this.isVertical ? e.clientY - rect.top : e.clientX - rect.left;
        var ratio = (curPos - this.scrollbarSize) / (this.totalScrollbarLength-3*this.scrollbarSize);
        if(ratio >= 1.0) ratio = 0.9999;
        if(ratio < 0.0) ratio = 0.0;
        this.curLine = Math.floor(ratio * this.maxLines);
        this.draw();
        this.onScrollCallback();
      }
    }

    // Handle the mouse up event, possibly while the user is dragging the slider.
    handleMouseUp(e) {
      this.isDragging = false;
    }

  }
