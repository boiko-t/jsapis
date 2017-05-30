/**
 * Created by tayab on 29.05.2017.
 */
var startSearchButton = document.getElementById('startSearch');
var stopSearchButton = document.getElementById('stopSearch');
var firstNumberInput = document.getElementById('numberA');
var secondNumberInput = document.getElementById('numberB');
var searchState = document.getElementById('status');
var outputPlace = document.getElementById('primesSearchResult');
var worker, lastFoundPrime, hidden, visibilityChange;
var isPrimeSearchFinished = true, wasNotified = false;

Notification.requestPermission();
setVisibilityProperties();

document.addEventListener(visibilityChange, handleVisibilityChange);
startSearchButton.addEventListener('click', startSearch);
stopSearchButton.addEventListener('click', stopSearch);

window.onload = function () {
    loadMap();
    if(!localStorage.isSaved)
        return;
    isPrimeSearchFinished = false;
    outputPlace.innerHTML = localStorage['primes'];
    lastFoundPrime = localStorage['lastFoundPrime'];
    firstNumberInput.value = localStorage['firstInRange'];
    secondNumberInput.value = localStorage['lastInRange'];
    startSearchButton.click();
};

window.onbeforeunload = function () {
    if(!isPrimeSearchFinished) {
        stopSearch();
        localStorage.isSaved = 1;
        localStorage['lastFoundPrime'] = lastFoundPrime;
        localStorage['firstInRange'] = firstNumberInput.value;
        localStorage['lastInRange'] = secondNumberInput.value;
        localStorage['primes'] = outputPlace.innerHTML;
    }else
        localStorage.clear();
};

function doSearch() {
    var sendingParams = {
        firstNumber: lastFoundPrime,
        secondNumber: secondNumberInput.value
    };
    worker.postMessage(sendingParams);
}

function startSearch(e) {
    e.target.disabled = true;
    worker = new Worker('script/PrimeSearcher.js');
    if(isPrimeSearchFinished) {
        lastFoundPrime = firstNumberInput.value;
        outputPlace.innerHTML = '';
    }
    isPrimeSearchFinished = false;

    worker.onmessage = receiveMessage;

    searchState.innerHTML = 'Пошук розпочався...';
    window.performance.mark('mark_start_search');
    doSearch();
}

function receiveMessage(e) {
    var prime = e.data.number;
    if(e.data.isFinished) {
        searchState.innerHTML = 'Пошук закінчено';
        finishSearch();
    }else {
        window.performance.measure('mark' + prime, 'mark_start_search' );
        var time = window.performance.getEntriesByName('mark' + prime, 'measure')[0].duration;
        outputPlace.innerHTML += prime + '(' + time.toFixed(2) + ') ';
        lastFoundPrime = prime;
        outputPlace.scrollTop = outputPlace.scrollHeight;
        localStorage['primes'] = outputPlace.innerHTML;
        doSearch();
    }
}

function stopSearch() {
    worker.terminate();
    worker = null;
    searchState.innerHTML = "Пошук припинено";
    startSearchButton.disabled = false;
}

function finishSearch() {
    startSearchButton.disabled = false;
    isPrimeSearchFinished = true;
    alertNotification('Пошук завершено!');

}

function alertNotification(message) {
    if (Notification.permission === "granted") {
        var notification = new Notification("Prime factory", {
            body: message,
            icon: './ico.png'
        });
    }

    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                var notification = new Notification(message);
            }
        });
    }
}

function setVisibilityProperties() {
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
}


function handleVisibilityChange() {
    if(document[hidden] && !wasNotified){
        setTimeout(function () {
            if(document[hidden]){
                alertNotification('Сторінка неактивна вже хвилину');
                wasNotified = true;
            }
        }, 60000)
    }else if(!document[hidden])
        wasNotified = false;
}

function loadMap() {
    var mapDom = document.getElementById('map');
    var mapInfo = document.getElementById('mapInfo');
    var mapOptions = {
        zoom: 15,
        mapTypeId: 'roadmap'
    };

    var map = new google.maps.Map(mapDom, mapOptions);
    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationFailure);

    function geolocationSuccess(position) {
        mapInfo.innerHTML = 'Ваші координати: ' + position.coords.latitude + ", "
                        + position.coords.longitude;
        var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(location);
        var infowindow = new google.maps.InfoWindow();
        infowindow.setContent('Ваше місцезнахождення');
        infowindow.setPosition(location);

        infowindow.open(map);
    }

    function geolocationFailure() {
        mapInfo.innerHTML = 'Помилка відображення координат';
    }
}