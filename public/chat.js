// ==================== vars ===================
const socket = io.connect('localhost:3000'),
    output = document.getElementById('output'),
    handle = document.getElementById('handle'),
    message = document.getElementById('message'),
    btn = document.getElementById('send'),
    tb = document.getElementById('todoButton'),
    todo = document.getElementById('todo'),
    duedate = document.getElementById('duedate'),
    result = document.getElementById('result'),
    recipeTitle = document.getElementById('recipetitle'),
    recipeIng = document.getElementById('ingredients'),
    recipeDir = document.getElementById('directions'),
    rb = document.getElementById('recipebutton'),
    rst = document.getElementById('recipeSearchText'),
    wst = document.getElementById('wikiSearchText'),
    editText = document.getElementById('demotext'),
    eb = document.getElementById('editbtn'),
    cb = document.getElementById('wbClear'),
    ub = document.getElementById('wbUpdate'),
    bs = document.getElementById('brushSize')
var canvasHistory = []
var cnv
var width
var colr = 'white'
var brushSize = 10
//==================== end vars ====================

var editor = CodeMirror.fromTextArea(document.getElementById("demotext"), {
    lineNumbers: true,
    mode: "text/javascript",
    matchBrackets: true
});

const setColr = (c) => {
    colr = c
    $(bs).css('color', c)
}


const setBrushSize = (n) => {
    brushSize = Number(n)
}

const weatherHourly = () => {
    let table = '<table class="table-bordered">'
    $.get('http://api.wunderground.com/api/e1f92b15fcb8aa24/hourly/q/CT/Groton.json', text => {
        console.dir(text)
        for (const {
                FCTTIME,
                temp,
                condition,
                feelslike,
                snow
            } of text.hourly_forecast) {
            table += `
        <tr>
        <td>${FCTTIME.civil}</td>
        <td>${temp.english}</td>
        <td>${condition}</td>
        <td>${feelslike.english}</td>
        <td>${snow.english}</td>
        </tr>
        `
        }
        table += '</table>'
        $('#weather-hourly').html(table);
    })
}

const weather = () => {

    $.get('http://api.wunderground.com/api/e1f92b15fcb8aa24/geolookup/conditions/q/CT/Groton.json', body => {
        console.dir(body)
        const htdata = `
        Current temperature in ${body.location.city} is: ${body.current_observation.temp_f} 
        the wind chill is ${body.current_observation.windchill_f} and conditions are ${body.current_observation.weather}
        `
        $('#weather').empty().append(htdata)
        weatherHourly()
    })
}

weather()


//========== Button event listeners ================

ub.addEventListener('click', () => {
    // console.log(c)
    socket.emit('wbUpdate', {
        image: canvasHistory
        // width:c.width,
        // height:c.height
    })
})

eb.addEventListener('click', () => {
    socket.emit('EditorSend', {
        text: editor.getValue()
    })
})
cb.addEventListener('click', () => {
    canvasHistory = []
    socket.emit('wbClear', {
        clear: true

    })
})

wst.addEventListener('change', () => socket.emit('WikiSearch', {
    search: wst.value
}))
rst.addEventListener('change', () => socket.emit('RecipeSearch', {
    search: rst.value
}))
rb.addEventListener('click', () => socket.emit('recipeadd', {
    title: recipeTitle.value,
    ingredients: recipeIng.value,
    directions: directions.value
}))
tb.addEventListener('click', () => socket.emit('todoadd', {
    todo: todo.value,
    duedate: duedate.value
}))
message.addEventListener('change', () => socket.emit('chat', {
    message: message.value,
    handle: handle.value
}))
// message.addEventListener('click', () => socket.emit('typing', handle.value))

//=========== end button events =======================


//=========== web socket on events =====================

socket.on('wbUpdate', data => {
    console.log(data.image)
    canvasHistory = []
    for (const {
            x,
            y,
            color,
            bs
        } of data.image) {
        noStroke()
        fill(color)
        ellipse(x, y, bs, bs)
        let obj = {
            x,
            y,
            color,
            bs
        }
        canvasHistory.push(obj)

    }

})

socket.on('EditorSend', data => {
    editor.setValue(data.text)
})

socket.on('wbDraw', data => {
    let obj = {
        x: data.x,
        y: data.y,
        color: data.color,
        bs: data.bs
    }
    canvasHistory.push(obj)
    noStroke()
    fill(data.color)
    ellipse(data.x, data.y, data.bs, data.bs)
})

socket.on('wbClear', data => {
    canvasHistory = []
    background('black')
})

socket.on('chat', data => {
    zounds.playURL('Sounds/beep1.wav')
    output.innerHTML += `<p><strong>${data.handle}</strong> | ${data.message}</p>`
    feedback.innerHTML = ""
})

socket.on('todoget', data => {
    //zounds.playURL('Sounds/beep1.wav')
    data.message = data.message.sort((a, b) => a.duedate > b.duedate)
    $('#result').empty();
    // **********************   Item variables  **************************
    for (const {
            id,
            todo,
            duedate,
            done,
        } of data.message) {
        // **********************   Item Template  **************************
        $('#result').append(`<div class="item"  id="${id}" ></div>`);
        $(`#${id}`).append(`
        <div class="itemHeader" >
        
            <button
            class="btn btn-danger"
            onclick="socket.emit('tododel',{id:${id} })"
            >
                DEL
            </button>
            <span
            class="expand"
            onclick="$('#expandable-${id}').slideToggle('fast')"
            >(${todo.substr(0,10)}) 
            </span>
        </div>
        <div id="expandable-${id}" class="expandable">

        <p>
            todo: ${todo}
            <br>
            Due Date: ${duedate}
            <br>
            <input type="checkbox" ${done} onchange="socket.emit('tododone',{id:${id},done:'${done}'})">
        </p>
        `)
    }
})

socket.on('RecipeSearch', data => {
    console.log(data.htdata.recipes)
    $('#recipesearch').empty()
    let id = 0
    // **********************   Item variables  **************************
    for (const {
            title,
            source_url
        } of data.htdata.recipes) {
        id++
        // **********************   Item Template  **************************
        $('#recipesearch').append(`<div class="item"  id="${id}rs" ></div>`);
        $(`#${id}rs`).append(
            `
                <a
                href="${source_url}" 
                target="_blank" 
                id="${id}title" 
                style="background-color: none;margin:10px;display:block;"
                onmouseover = "$('#${id}title').css('background-color','lightblue');$('#${id}title').css('cursor','pointer')"
                onmouseout = "$('#${id}title').css('background-color','transparent');$('#${id}title').css('cursor','default')"
                >
                    ${title}
                    </a>
                    <br>
            `);
    }

})


socket.on('WikiSearch', data => {
    console.log(data.htdata)
    $('#wikisearch').empty()
    let id = 0
    // **********************   Item variables  **************************
    for (const {
            title,
            pageid,
            snippet
        } of data.htdata) {
        id++
        // **********************   Item Template  **************************
        $('#wikisearch').append(`<div class="item"  id="${id}rs" ></div>`);
        $(`#${id}rs`).append(
            `
                <a
                href="https://en.wikipedia.org/?curid=${pageid}" 
                target="_blank" 
                id="${id}" 
                style="background-color: none;"
                onmouseover = "$('#${id}wikititle').css('background-color','lightblue');$('#${id}wikititle').css('cursor','pointer')"
                onmouseout = "$('#${id}wikititle').css('background-color','transparent');$('#${id}wikititle').css('cursor','default')"
                >
                    ${title}
                </a>
                <p>${snippet}</p>
                <br>
            `);
    }

})


socket.on('recipeget', data => {
    $('#recipe').empty();
    // **********************   Item variables  **************************
    for (const {
            id,
            title,
            ingredients,
            directions,
        } of data.results) {
        // **********************   Item Template  **************************
        $('#recipe').append(`<div class="item"  id="${id}" ></div>`);
        $(`#${id}`).append(`
            <p 
                id="${id}title" 
                style="background-color: none;" 
                onclick = "$('#${id}recipe').toggle('slow')"
                onmouseover = "$('#${id}title').css('background-color','lightblue');$('#${id}title').css('cursor','pointer')"
                onmouseout = "$('#${id}title').css('background-color','transparent');$('#${id}title').css('cursor','default')"
                >
            ${title}
            </p>
            <br>
            <div id="${id}recipe" style="display: none">
                <h3>ingredients</h3>
                <p>${ingredients}</p>
                <h3>directions</h3>
                <p>${directions}</p>
                <hr>
            </div>
            
            `);
    }

})

socket.on('authorized', data => {
    weather()
    socket.emit('todoget')
    socket.emit('recipeget')
    setInterval(() => {
        weather()
    }, 3600000)
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
// socket.emit('weather')
weather()
socket.emit('todoget')
socket.emit('recipeget')
setInterval(() => {
    weather()
}, 3600000)