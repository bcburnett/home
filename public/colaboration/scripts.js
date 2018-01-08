// ==================== vars ===================
const socket = io.connect('http://192.168.0.10:4000'),
    editText = document.getElementById('demotext'),
    eb = document.getElementById('editbtn'),
    cb = document.getElementById('wbClear')
//==================== end vars ====================

//========== Button event listeners ================

eb.addEventListener('click', () => socket.emit('EditorSend', {
    text: editText.value
}))
cb.addEventListener('click', () => socket.emit('wbClear', {
    clear:true
}))
//=========== end button events =======================


//=========== web socket on events =====================
socket.on('EditorSend', data => {
    zounds.playURL('Sounds/beep1.wav')
    console.log(data)
    editText.val = data.text
})

socket.on('wbDraw', data=>{
    noStroke()
    fill(255,0,100)
    ellipse(data.x, data.y,10,10)
})

socket.on('wbClear', data=>{
    background(51)
})

// ==================== end web socket events =============

//================== time display ===================
const startTime = () => {
    const today = new Date();
    $("#time").html(`${today.getHours()}:${('0' + today.getMinutes()).slice(-2)}`);
    const t = setTimeout(startTime, 60000);
};
// ================== end time display ================

//====================get the data=====================

startTime()
socket.emit('weather')
socket.emit('todoget')
socket.emit('recipeget')
setInterval(() => {
    socket.emit('weather')
}, 600000)