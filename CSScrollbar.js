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
    constructor (canvas, maxLines, linesPerPage, isVertical, onScrollCallback) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.maxLines = maxLines;
      this.linesPerPage = linesPerPage;
      this.onScrollCallback = onScrollCallback;

      this.width = canvas.width;
      this.height = canvas.height;
      this.totalScrollbarLength = isVertical ? this.height : this.width;
      if (isVertical) {
        this.scrollbarSize = canvas.width;
      } else {
        this.scrollbarSize = canvas.height;
      }
      this.curLine = 0;
      this.isVertical = isVertical;
      this.isDragging = false;
    //   this.onThumbDrag = onThumbDrag;

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
      this.canvas.addEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseDown(e) {
        // Check if the mouse is over the thumb here
        // If it is, set isDragging to true
        this.isDragging = true;
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            var rect = e.target.getBoundingClientRect();
            if(this.isVertical) {
                var curPos = e.clientY - rect.top;
                this.curSliderPos = curPos - this.scrollbarSize / 2;
                if(this.curSliderPos < 0) {
                    this.curSliderPos = 0;
                }
                this.curLine = Math.floor((this.curSliderPos / this.height) * this.maxLines);
            } else {
                var curPos = e.clientX - rect.left;
                this.curSliderPos = curPos - this.scrollbarSize / 2;
                if(this.curSliderPos < 0) {
                    this.curSliderPos = 0;
                }
                this.curLine = Math.floor((this.curSliderPos / this.width) * this.maxLines);
            }
            this.draw();
            this.onScrollCallback();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
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
    // Calculate the line to scroll to and return true if it has changed.
    calculateNewLine(y) {
      if (y >= this.curSliderPos && y <= (this.curSliderPos + this.scrollbarSize)) {
        // User clicked on the slider.  No change in line number.
        //console.log("calculateNewLine: user clicked on the slider");
        return false;
      } else {
        if (y < this.scrollbarSize) {
          // User clicked in the top arrow.
        } else if(y > this.totalScrollbarLength - this.scrollbarSize) {
          // User clicked in the bottom arrow.
        } else if(y < this.curSliderPos) {
          this.curLine -= this.linesPerPage;
          if (this.curLine < 0) {
            this.curLine = 0;
          }
          //console.log("calculateNewLine: user clicked above the slider y=" + y + " prevY=" + this.prevY + " curLine=" + this.curLine + " maxLines=" + this.maxLines + " linesPerPage=" + this.linesPerPage + " pixelsPerScroll=" + this.pixelsPerScroll+ " curSliderPos=" + this.curSliderPos);
        } else {
          this.curLine += this.linesPerPage;
          if (this.curLine >= this.maxLines) {
            this.curLine = this.maxLines-1;
          }
          //console.log("calculateNewLine: user clicked below the slider. y=" + y + " prevY=" + this.prevY + " curLine=" + this.curLine + " maxLines=" + this.maxLines + " linesPerPage=" + this.linesPerPage + " pixelsPerScroll=" + this.pixelsPerScroll + " curSliderPos=" + this.curSliderPos);
        }
        return true;
      }
    }

    handleClick(e) {
      var rect = e.target.getBoundingClientRect();
      var curPos = this.isVertical ? e.clientY - rect.top : e.clientX - rect.left;

      if (this.calculateNewLine(curPos)) {
        this.draw();
        this.onScrollCallback();
      }
    }

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
  }
