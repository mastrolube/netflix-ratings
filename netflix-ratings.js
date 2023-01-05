// ==UserScript==
// @name          NetflixRatings | MastroLube
// @author        MastroLube
// @homepage      https://github.com/mastrolube/netflix-ratings
// @description   Get ratings for movies and shows in Netflix
// @match         https://*.netflix.com/browse*
// @match         https://*.netflix.com/title/*
// @version       1.0.0
// ==/UserScript==


// API KEY
const API_KEY = 'YOUR-API-KEY-HERE'; // gained from https://imdb-api.com/api

// don't do API requests
const do_nothing = false;

// Inject CSS
let styleElement = document.createElement('style');
styleElement.innerHTML = '.ml-ratings-container { margin-top: 6px; color: #888888; }';
document.head.appendChild(styleElement);

// Define the type of content
const Type = {
    MOVIE: "Movie",
    SERIES: "Series"
};

function getType() {
    let episodes = document.querySelector(".titleCardList--container");
    if (episodes === null) {
        return Type.MOVIE;
    } else {
        return Type.SERIES;
    }
}

function createRatingElement(id, ratings) {
    try {
        let pageElement = document.querySelector(".videoMetadata--container");
        if (!pageElement) {
            console.log("error: could not find the container element on the page");
        }
        let containerDiv = document.createElement("div");
        containerDiv.className = "ml-ratings-container";
        let descriptionElement = document.createElement("span");
        descriptionElement.innerHTML = `imDb: ${ratings.imDb} | metacritic: ${ratings.metacritic} | rottenTomatoes: ${ratings.rottenTomatoes}`;
        let linkElement = document.createElement("a");
        linkElement.id = id;
        containerDiv.appendChild(descriptionElement);
        containerDiv.appendChild(linkElement);
        pageElement.insertAdjacentElement('afterend', containerDiv);
        return linkElement;
    } catch (error) {
        console.log(error);
    }
}

async function searchID(type, name, year) {
    let API_URL = `https://imdb-api.com/en/API/Search${type}/${API_KEY}/${name}`;
    if (type === "Movie") {
        API_URL += ` ${year}`;
    }
    console.log("API request: " + API_URL);
    try {
        let response = await fetch(API_URL);
        let data = await response.json();
        let firstResult = data.results[0];
        return firstResult.id;
    } catch (error) {
        console.error(error);
    }
}

async function getRatings(id) {
    if (id) {
        let API_URL = `https://imdb-api.com/en/API/Ratings/${API_KEY}/${id}`
        console.log("API request: " + API_URL);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error(error);
        }
    }
}

// Main code
async function load() {
    if (!location.href.endsWith("browse")) {
        setTimeout(async function() {
            try {
                let overview = document.querySelector(".previewModal--player-titleTreatment-logo");
                if (overview) {
                    let title = overview.title.normalize("NFD").replace(/[^\x00-\x7F]/g, "");
                    let year = document.querySelector(".year").textContent;
                    console.log(title, year);
                    if (title && year && !do_nothing) {
                        let id_imdb = await searchID(getType(), title, year);
                        let ratings = await getRatings(id_imdb);
                        createRatingElement("ratings", ratings);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }, 2000);
    }
}


// Set up a mutation observer to detect when the URL changes
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
    }
}).observe(document, {subtree: true, childList: true});

// Run for the first time the script
window.addEventListener("load", load);

// Run the code on url change
function onUrlChange() {
    load();
}
