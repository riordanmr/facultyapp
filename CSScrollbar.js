// A class to create a scrollbar for an HTML canvas.  
// The caller provides a canvas representing the scrollbar, and a callback
// function to call when the scrollbar is scrolled.  
//
// Mark Riordan  Feb 2024
// Released under the MIT License.
class CSScrollbar {
    constructor (canvas, maxLines, linesPerPage, isVertical, onScrollCallback) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.maxLines = maxLines;
      this.linesPerPage = linesPerPage;
      this.onScrollCallback = onScrollCallback;

      this.width = canvas.width;
      this.scrollbarSize = canvas.width;
      this.height = canvas.height;
      this.curLine = 0;
      this.isVertical = isVertical;

      // This is a trick to allow us to add a callback to the event listener.
      this.handleClick = this.handleClick.bind(this);
      this.handleWheelScroll = this.handleWheelScroll.bind(this);

      canvas.addEventListener("click", this.handleClick);  
      canvas.addEventListener("wheel", this.handleWheelScroll);
    }

    draw () {
      // Draw the scrollbar itself. 
      this.ctx.fillStyle = '#d9d9d9';  // Used color picker to get this color from original applet.
      //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillRect(0, 0, this.width, this.height);
      //console.log(width);

      // Draw the scrollbar slider.
      this.ctx.fillStyle = '#aeaeae';  // Used color picker to get this color from original applet.
      if (this.isVertical) {
        this.pixelsPerScroll = (this.height - this.scrollbarSize) * (this.linesPerPage / this.maxLines); 
        var ratioDown = this.curLine / this.maxLines;
        this.curSliderPos = (this.height - this.scrollbarSize) * ratioDown;
        this.ctx.fillRect(0, this.curSliderPos, this.width, this.width);
      } else {
        // Fix this to use the horizontal scrollbar.
        this.curSliderPos = ((width - scrollbarSize) / max) * val;
        this.ctx.fillRect(this.curSliderPos, 0, this.scrollbarSize, this.height);
      }
    }

    // The user has clicked on the scrollbar at the relative location y.  
    // Calculate the line to scroll to and return true if it has changed.
    calculateNewLine(y) {
      if (y >= this.curSliderPos && y <= (this.curSliderPos + this.scrollbarSize)) {
        // User clicked on the slider.  No change in line number.
        //console.log("calculateNewLine: user clicked on the slider");
        return false;
      } else {
        if (y < this.curSliderPos) {
          this.curLine -= this.linesPerPage - 1;
          if (this.curLine < 0) {
            this.curLine = 0;
          }
          //console.log("calculateNewLine: user clicked above the slider y=" + y + " prevY=" + this.prevY + " curLine=" + this.curLine + " maxLines=" + this.maxLines + " linesPerPage=" + this.linesPerPage + " pixelsPerScroll=" + this.pixelsPerScroll+ " curSliderPos=" + this.curSliderPos);
        } else {
          this.curLine += this.linesPerPage - 1;
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
      //var x = e.clientX - rect.left; //x position within the element.
      var y = e.clientY - rect.top;  //y position within the element.

      //console.log("handleClick here with event " + e + " and y " + y);
      if (this.calculateNewLine(y)) {
        this.draw();
        this.onScrollCallback(this.curLine);
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
      this.onScrollCallback(this.curLine);
    }
  }
