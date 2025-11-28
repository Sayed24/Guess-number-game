let randomNumber = Math.floor(Math.random() * 100) + 1;
let attemptsLeft = 10;
let successCount = 0;
let failCount = 0;
let username = "";

// Save username and start game
function saveUsername() {
    const input = document.getElementById("username-input").value.trim();

    if (input === "") {
        alert("Please enter your name!");
        return;
    }

    username = input;

    document.getElementById("welcome").innerText = `Welcome, ${username}!`;
    document.getElementById("player-name-display").innerText = `Player: ${username}`;

    document.getElementById("username-section").classList.add("hidden");
    document.getElementById("game-section").classList.remove("hidden");
}

// Check guess
function checkGuess() {
    const guess = Number(document.getElementById("guess-input").value);
    const resultDiv = document.getElementById("result");
    const previousDiv = document.getElementById("previous-guesses");

    if (!guess) {
        alert("Please enter a valid number.");
        return;
    }

    attemptsLeft--;
    document.getElementById("attempts").innerText = attemptsLeft;

    let icon = "";
    let message = "";

    if (guess === randomNumber) {
        icon = "✔️";
        message = `<span class='success'>${username}, you guessed it right! ${icon}</span>`;
        successCount++;
        document.getElementById("success-count").innerText = successCount;
        endGame(true);
    } else if (guess < randomNumber) {
        icon = "⬇️";
        message = `${username}, your guess is too low. ${icon}`;
    } else {
        icon = "⬆️";
        message = `${username}, your guess is too high. ${icon}`;
    }

    previousDiv.innerHTML += `<p>${guess} ${icon}</p>`;
    resultDiv.innerHTML = message;

    // Game fail
    if (attemptsLeft === 0) {
        failCount++;
        document.getElementById("fail-count").innerText = failCount;

        resultDiv.innerHTML = `<span class='fail'>${username}, you ran out of attempts! ❌</span>`;
        endGame(false);
    }
}

// Restart the game
function endGame(won) {
    setTimeout(() => {
        randomNumber = Math.floor(Math.random() * 100) + 1;
        attemptsLeft = 10;
        document.getElementById("attempts").innerText = attemptsLeft;
        document.getElementById("result").innerText = "";
        document.getElementById("previous-guesses").innerHTML = "";
        document.getElementById("guess-input").value = "";
    }, 2000);
}
