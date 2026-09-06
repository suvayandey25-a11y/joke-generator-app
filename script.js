// Joke Generator App
const getJokeBtn = document.getElementById('getJokeBtn');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const jokeText = document.getElementById('jokeText');
const jokeType = document.getElementById('jokeType');
const jokeCategory = document.getElementById('jokeCategory');
const historyList = document.getElementById('historyList');
const loading = document.getElementById('loading');

let currentJoke = null;
let favorites = JSON.parse(localStorage.getItem('favoriteJokes')) || [];

// API Configuration
const JOKE_APIS = {
    random: 'https://v2.jokeapi.dev/joke/Any?format=json',
    general: 'https://v2.jokeapi.dev/joke/General?format=json',
    programming: 'https://v2.jokeapi.dev/joke/Programming?format=json',
    'knock-knock': 'https://v2.jokeapi.dev/joke/Knock-Knock?format=json'
};

// Event Listeners
getJokeBtn.addEventListener('click', fetchJoke);
copyBtn.addEventListener('click', copyToClipboard);
shareBtn.addEventListener('click', shareJoke);
jokeCategory.addEventListener('change', fetchJoke);

// Fetch Joke from API
async function fetchJoke() {
    const category = jokeCategory.value;
    const apiUrl = JOKE_APIS[category];
    
    loading.classList.add('active');
    getJokeBtn.disabled = true;
    copyBtn.disabled = true;
    shareBtn.disabled = true;

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch joke');
        }

        const data = await response.json();
        
        if (data.error) {
            jokeText.textContent = 'Could not fetch a joke. Please try again!';
            jokeType.textContent = '';
            currentJoke = null;
        } else {
            // Handle both setup/delivery (two-part) and single joke
            if (data.type === 'twopart') {
                currentJoke = `${data.setup}\n\n${data.delivery}`;
            } else {
                currentJoke = data.joke;
            }
            
            jokeText.textContent = currentJoke;
            jokeType.textContent = `Category: ${data.category}`;
        }
    } catch (error) {
        console.error('Error fetching joke:', error);
        jokeText.textContent = 'Oops! Something went wrong. Please try again.';
        jokeType.textContent = '';
        currentJoke = null;
    } finally {
        loading.classList.remove('active');
        getJokeBtn.disabled = false;
        copyBtn.disabled = !currentJoke;
        shareBtn.disabled = !currentJoke;
    }
}

// Copy Joke to Clipboard
function copyToClipboard() {
    if (!currentJoke) return;

    navigator.clipboard.writeText(currentJoke).then(() => {
        showNotification('Joke copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Share Joke
function shareJoke() {
    if (!currentJoke) return;

    if (navigator.share) {
        navigator.share({
            title: 'Check out this joke!',
            text: currentJoke
        }).catch(err => console.error('Error sharing:', err));
    } else {
        // Fallback: Add to favorites
        addToFavorites();
        showNotification('Joke added to favorites!');
    }
}

// Add to Favorites
function addToFavorites() {
    if (!currentJoke) return;

    const jokeObj = {
        text: currentJoke,
        category: jokeCategory.value,
        timestamp: new Date().toISOString()
    };

    // Check if already in favorites
    if (!favorites.some(fav => fav.text === currentJoke)) {
        favorites.unshift(jokeObj);
        
        // Keep only last 10 favorites
        if (favorites.length > 10) {
            favorites.pop();
        }
        
        saveFavorites();
        updateHistoryDisplay();
        showNotification('Added to favorites!');
    } else {
        showNotification('Already in favorites!');
    }
}

// Remove from Favorites
function removeFromFavorites(index) {
    favorites.splice(index, 1);
    saveFavorites();
    updateHistoryDisplay();
    showNotification('Removed from favorites!');
}

// Save Favorites to LocalStorage
function saveFavorites() {
    localStorage.setItem('favoriteJokes', JSON.stringify(favorites));
}

// Update History Display
function updateHistoryDisplay() {
    if (favorites.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No favorite jokes yet. Share or favorite jokes to see them here!</div>';
        return;
    }

    historyList.innerHTML = favorites.map((joke, index) => `
        <div class="history-item">
            <div class="history-item-text">${escapeHtml(joke.text)}</div>
            <button class="history-item-btn" onclick="removeFromFavorites(${index})">Remove</button>
        </div>
    `).join('');
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add to Favorites on Button
const addFavBtn = document.createElement('button');
addFavBtn.className = 'btn btn-secondary';
addFavBtn.textContent = '❤️ Add to Favorites';
addFavBtn.style.marginTop = '10px';
addFavBtn.addEventListener('click', addToFavorites);
document.querySelector('.controls').appendChild(addFavBtn);

// Initialize
updateHistoryDisplay();
copyBtn.disabled = true;
shareBtn.disabled = true;

// Optional: Auto-load first joke on page load
window.addEventListener('load', () => {
    // Uncomment to auto-load joke on page load
    // fetchJoke();
});