/**
 * Created by tayab on 29.05.2017.
 */
onmessage = function (e) {
    var n = parseInt(e.data.firstNumber);
    while (n < parseInt(e.data.secondNumber)) {
        n++;
        if( isPrime(n) ) {
            postMessage({number: n, isFinished: false});
            return;
        }
    }

    postMessage({isFinished: true});
};

function isPrime(num) {
    if(num < 2) return false;
    for (var i = 2; i <= Math.sqrt(num); i++) {
        if(num%i==0)
            return false;
    }
    return true;
}