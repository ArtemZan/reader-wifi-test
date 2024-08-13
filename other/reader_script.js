function _ping() {
    print("Got ping")
    Shelly.emitEvent("ping", "ping")
}

function beep(freq) {
    PWMSet(2, freq * 100, 0.5)
    Timer.set(500, false, function () {
        beep(freq % 3 + 1)
    })
}

function init() {
    beep(1)
}

init()