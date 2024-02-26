const socket = io('https://webchat-1.azurewebsites.net/');
const messageForm = document.getElementById('send-window');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const userNameElement = document.getElementById('user-name');
const storageKey = 'theme-preference'

let userName = prompt('What is your name?');
if (!userName) userName = "Anonymous";

userNameElement.innerText = `Chatting with: Waiting for user...`;

socket.emit('new-user', userName);

socket.on('existing-users', usersList => {
  if (usersList.length > 0) {
    userNameElement.innerText = `Chatting with: ${usersList[0]}`;
  }
});

socket.on('new-user-joined', otherUserName => {
  userNameElement.innerText = `Chatting with: ${otherUserName}`;
});

socket.on('send-chat-message', data => {
  appendMessage(data.message, true, data.sender);
});

socket.on('chat-message', data => {
  appendMessage(data.message, false, data.sender);
});

socket.on('user-connected', userName => {
  appendMessage(`${userName} joined`, false, 'System');
});

socket.on('user-disconnected', userName => {
  appendMessage(`${userName} disconnected`, false, 'System');
});

messageForm.addEventListener('submit', e => {
  e.preventDefault(); // Prevent the default form submission behavior

  const message = messageInput.value;
  appendMessage(`${message}`, true, userName);
  socket.emit('send-chat-message', { message, sender: userName });
  messageInput.value = '';
});

function appendMessage(message, isSent, sender) {
  const messageElement = document.createElement('div');
  const senderText = isSent ? '' : (sender ? `${sender}: ` : '');

  messageElement.innerText = `${senderText}${message}`;
  messageElement.classList.add('message', isSent ? 'sent' : 'received');

  messageContainer.append(messageElement);

  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Add an event listener for the 'input' event on the message input field
messageInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Add an event listener for the 'keypress' event to prevent the Enter key from creating a new line
messageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

// Function to handle sending the message 
function sendMessage() {
  const message = messageInput.value;
  if (message.trim() !== '') {
    appendMessage(`${message}`, true, '');
    socket.emit('send-chat-message', { message, sender: '' });
    messageInput.value = '';
  }
}

const typingIndicator = document.getElementById('typing-indicator');
let typingTimeout;

messageInput.addEventListener('keydown', (event) => {
  // Ignore the enter key
  if (event.key !== 'Enter') {
    socket.emit('typing', { user: 'User Name' });
    clearTimeout(typingTimeout);
  }
});

messageInput.addEventListener('keyup', () => {
  typingTimeout = setTimeout(() => {
    socket.emit('stop typing', { user: 'User Name' });
  }, 2000);
});

socket.on('typing', (data) => {
  typingIndicator.style.display = 'block';
  typingIndicator.innerText = `${userName} is typing...`; // Display the user's name who is typing
});

socket.on('stop typing', (data) => {
  typingIndicator.style.display = 'none';
});




const onClick = () => {
  // flip current value
  theme.value = theme.value === 'light'
    ? 'dark'
    : 'light'

  setPreference()
}

const getColorPreference = () => {
  if (localStorage.getItem(storageKey))
    return localStorage.getItem(storageKey)
  else
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
}

const setPreference = () => {
  localStorage.setItem(storageKey, theme.value)
  reflectPreference()
}

const reflectPreference = () => {
  document.firstElementChild
    .setAttribute('data-theme', theme.value)

  document
    .querySelector('.dark-mode-toggle')
    ?.setAttribute('aria-label', theme.value)
}

const theme = {
  value: getColorPreference(),
}

// set early so no page flashes / CSS is made aware
reflectPreference()

window.onload = () => {
  // set on load so screen readers can see latest value on the button
  reflectPreference()

  // now this script can find and listen for clicks on the control
  document
    .querySelector('.dark-mode-toggle')
    .addEventListener('click', onClick)
}

// sync with system changes
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', ({matches:isDark}) => {
    theme.value = isDark ? 'dark' : 'light'
    setPreference()
  })
