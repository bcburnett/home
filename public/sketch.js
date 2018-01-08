function setup(){
    var canvasDiv = document.getElementById('myContainer');
     width = canvasDiv.clientWidth;
     cnv = createCanvas(width,700);
cnv.parent("myContainer");
background('black')
}

function mouseDragged(){

    let data = {
        x: mouseX,
        y: mouseY,
        color:colr,
        bs:brushSize
    }
    canvasHistory.push(data)

    socket.emit('wbDraw', data)

    noStroke()
    fill(colr)
    ellipse(mouseX, mouseY,brushSize,brushSize)  
}


function draw(){}