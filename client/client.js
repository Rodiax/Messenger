/** Websocket
********************************************************************/
var ws = (function initializeConnection() {
    const connection = new WebSocket("ws://127.0.0.1:4080");

    connection.onopen = () => { 
        addMessage("Connection estabilished.");

        statusIcon.classList.remove('status__icon--red');
        statusIcon.classList.add('status__icon--green');

        statusActivity.innerText = "online";
    };

    connection.onclose = () => {
        const timer = 3000;
        const msg = addMessage("Connection failed!", 'trying to reconnect:', timer / 1000)({ firstTextNodeClass: 'mb-10' });
        const interval = setInterval(() => {
            let seconds = msg.textNodes[msg.textNodes.length - 1].textContent;
            msg.textNodes[msg.textNodes.length - 1].textContent = --seconds;
            
            if (seconds < 1) {
                clearInterval(interval);
                addMessage('Connecting...');

                ws = initializeConnection();
            }
        }, 1000);                

        statusIcon.classList.remove('status__icon--green');
        statusIcon.classList.add('status__icon--red');

        statusActivity.innerText = "offline";
    };

    connection.onmessage = response => { 
        const data = JSON.parse(response.data);
        
        if (!data.settings) {
            addMessage(`Message from: ${data.name}`,  data.message)({ textBlockClass: 'text-right', firstTextNodeClass: 'mb-10' });  
        } else {
            statusUser.textContent = data.clientName;
            statusCount.textContent = data.connectedUsers.length;
            
            statusUsers.innerHTML = ""; // Will clear old nodes
            data.connectedUsers.filter((user, i) => i < 2).forEach(user => {
                const node = document.createElement('div');
                node.innerText = user;

                statusUsers.appendChild(node);
            });

            if (data.connectedUsers.length > 2) {
                const others = data.connectedUsers.filter((user, i) => i >= 2);
                const node = document.createElement('div');
                node.innerText = `And other users (${others.length})`;
                node.title = others.join(", ");

                statusUsers.appendChild(node);
            }
        }
    };

    return connection;
})();

/** Node elements
********************************************************************/
const textForm = document.querySelector('.text-form');
const textInput = document.querySelector('.text-form__input');
const textSubmitButton = document.querySelector('.text-form__submit-btn');

const chatWindow = document.querySelector('.messenger__top');

const statusActivity = document.querySelector('.status__activity');
const statusUser = document.querySelector('.status__username');
const statusIcon = document.querySelector('.status__icon');
const statusCount = document.querySelector('.status__count');
const statusUsers = document.querySelector('.status__users');


/** App
********************************************************************/
textForm.onsubmit = event => {
    event.preventDefault();

    handleFormSubmit();
};

textInput.onkeydown = event => {
    if (event.keyCode == 13 && !event.shiftKey) {
        event.preventDefault();
        
        handleFormSubmit();
    }
};


/** Utils
********************************************************************/
const addMessage = (...message) => {
    const textBlock = document.createElement('div');
    const textWrapper = document.createElement('div');

    textWrapper.className = "messenger__text text-left";

    message.forEach(msg => {
        const textNode = document.createElement('div');
        textNode.innerText = msg;

        textWrapper.appendChild(textNode);    
    });

    textBlock.appendChild(textWrapper);
    chatWindow.appendChild(textBlock);

    chatWindow.scrollTop = chatWindow.scrollHeight;

    return options => {
        if (options.textBlockClass)
            textBlock.className = options.textBlockClass;

        if (options.firstTextNodeClass)   
            textWrapper.children[0].className = options.firstTextNodeClass;

        return {
            textNodes: textWrapper.childNodes
        };
    };
};

const handleFormSubmit = () => {
    if (!textInput.value.length || /^(\s|\n)+$/g.test(textInput.value)) return;

    addMessage('You said:', textInput.value)({ firstTextNodeClass: 'mb-10' });

    ws.send(textInput.value);

    textForm.reset();
}
